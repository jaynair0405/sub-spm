from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
from typing import Optional, List, Dict, Any
import polars as pl
import pandas as pd
import tempfile
from datetime import datetime

from corridor_loader import CorridorManager
from psr_mps import PSRMPSCalculator, detect_violations
from halt_detection import HaltDetector, calculate_cumulative_distance
from platform_entry_speed import PlatformEntryCalculator
from brakefeel_detector import BrakeFeelDetector
from station_km_maps import get_station_km_map_for_train_type

app = FastAPI(title="SPM Analysis API")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize corridor manager
DATA_ROOT = Path(__file__).parent
corridor_manager = CorridorManager(DATA_ROOT)

# Initialize PSR/MPS calculator
psr_calculator = PSRMPSCalculator(reference_data_dir=str(DATA_ROOT / "reference_data"))

# Initialize halt detector (speed=0, distance=0)
# Tolerance set to 350m to handle wheel diameter variations and GPS inaccuracies
halt_detector = HaltDetector(speed_threshold=0.0, min_halt_duration_seconds=1)
brakefeel_detector = BrakeFeelDetector()

# Global storage for uploaded runs (in production, use a database)
runs_storage: Dict[str, Dict[str, Any]] = {}


@app.on_event("startup")
async def startup_event():
    """Load corridor data on startup"""
    corridor_manager.load_default_corridors()
    corridor_manager.load_train_lookup()
    corridor_manager.load_fast_halts()
    print(f"✓ Loaded {len(corridor_manager.corridors)} corridors")
    print(f"✓ Loaded {len(corridor_manager.train_code_map)} train codes")


@app.get("/")
async def root():
    return {
        "app": "SPM Analysis API",
        "status": "running",
        "corridors_loaded": len(corridor_manager.corridors),
        "train_codes_loaded": len(corridor_manager.train_code_map),
    }


@app.get("/spm.html")
async def serve_spm_html():
    """Serve the SPM analysis HTML interface"""
    html_path = DATA_ROOT / "spm.html"
    if not html_path.exists():
        raise HTTPException(status_code=404, detail="spm.html not found")
    return FileResponse(html_path)


@app.get("/corridors")
async def list_corridors():
    """List all available corridors"""
    return {
        "corridors": [
            {
                "name": name,
                "stations": data.stations,
                "records": len(data.records),
            }
            for name, data in corridor_manager.corridors.items()
        ]
    }


@app.post("/upload")
async def upload_spm_file(
    file: UploadFile = File(...),
    staff_id: Optional[str] = Form(None),
    from_station: Optional[str] = Form(None),
    to_station: Optional[str] = Form(None),
    train_number: Optional[str] = Form(None),
    date_of_working: Optional[str] = Form(None),
    analysed_by: Optional[str] = Form(None),
    unit_number: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
):
    """
    Upload and process SPM data file (CSV or Excel)
    """
    # Validate file type
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")

    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        # Read file using Pandas (more reliable for Excel) then convert to Polars
        if tmp_path.suffix == '.csv':
            # Try with headers first
            df_test = pl.read_csv(tmp_path, n_rows=1)
            first_row = df_test.row(0)

            # Check if first row looks like headers (contains non-numeric text in speed/distance columns)
            has_headers = True
            try:
                # If we can't convert the values to float, they're likely headers
                if len(first_row) >= 2:
                    float(str(first_row[1]))  # Try speed column
                    float(str(first_row[2]) if len(first_row) > 2 else "0")  # Try distance column
                    has_headers = False  # If no error, first row is data
            except (ValueError, TypeError):
                has_headers = True  # First row is headers

            # Read CSV with or without headers
            if has_headers:
                df = pl.read_csv(tmp_path)
            else:
                df = pl.read_csv(tmp_path, has_header=False, new_columns=['Date', 'Speed', 'Distance'])
        else:
            # Try reading Excel with different options to find the data
            pandas_df = None
            # Try different header rows (sometimes data starts after metadata)
            for header_row in [0, 1, 2, 3, 4, 5]:
                try:
                    test_df = pd.read_excel(tmp_path, header=header_row)
                    # Check if this row has the columns we need
                    cols_lower = [str(c).lower() for c in test_df.columns]
                    if any('date' in c for c in cols_lower) or any('speed' in c for c in cols_lower):
                        pandas_df = test_df
                        break
                except:
                    continue

            if pandas_df is None:
                # If no headers found, try reading without headers
                pandas_df = pd.read_excel(tmp_path, header=None)

                # Detect format: 3 columns (DateTime, Speed, Distance) or 4 columns (Date, Time, Speed, Distance)
                if len(pandas_df.columns) >= 4:
                    # Check if column 2 (index 1) looks like time by checking if it's numeric (speed)
                    # If it's numeric, we have 3 columns (DateTime combined)
                    # If it's not numeric, we have 4 columns (Date and Time separate)
                    try:
                        second_col_val = pandas_df.iloc[0, 1]
                        # Try to convert to float - if it works, it's likely Speed (3-column format)
                        float(second_col_val)
                        # 3-column format: DateTime, Speed, Distance
                        pandas_df.columns = ['Date', 'Speed', 'Distance'] + list(pandas_df.columns[3:])
                    except (ValueError, TypeError):
                        # Second column is not numeric - likely Time (4-column format)
                        pandas_df.columns = ['Date', 'Time', 'Speed', 'Distance'] + list(pandas_df.columns[4:])
                elif len(pandas_df.columns) >= 3:
                    pandas_df.columns = ['Date', 'Speed', 'Distance'] + list(pandas_df.columns[3:])
                else:
                    pandas_df.columns = ['Date', 'Speed', 'Distance'][:len(pandas_df.columns)]

            df = pl.from_pandas(pandas_df)

        # Normalize column names (case-insensitive matching)
        df_cols_lower = {c.lower(): c for c in df.columns}

        # Try to find the required columns (case-insensitive)
        date_col = next((v for k, v in df_cols_lower.items() if 'date' in k), None)
        time_col = next((v for k, v in df_cols_lower.items() if 'time' in k and 'date' not in k), None)
        speed_col = next((v for k, v in df_cols_lower.items() if 'speed' in k), None)
        distance_col = next((v for k, v in df_cols_lower.items() if 'distance' in k or 'dist' in k), None)

        if not date_col or not speed_col or not distance_col:
            raise HTTPException(
                status_code=400,
                detail=f"Could not find required columns. Found columns: {df.columns}. Need at least: Date, Speed, Distance"
            )

        # Select only the columns we need
        selected_cols = [date_col, speed_col, distance_col]
        if time_col:
            selected_cols.insert(1, time_col)

        df = df.select(selected_cols)

        # Rename to standard names
        if time_col:
            df = df.rename({
                date_col: 'Date',
                time_col: 'Time',
                speed_col: 'Speed',
                distance_col: 'Distance'
            })
        else:
            df = df.rename({
                date_col: 'DateTime',
                speed_col: 'Speed',
                distance_col: 'Distance'
            })

            # Split DateTime into Date and Time columns
            # Convert to pandas for easier datetime parsing
            temp_df = df.to_pandas()

            # Parse datetime and split
            temp_df['DateTime'] = pd.to_datetime(temp_df['DateTime'], errors='coerce')
            temp_df['Date'] = temp_df['DateTime'].dt.strftime('%Y-%m-%d')
            temp_df['Time'] = temp_df['DateTime'].dt.strftime('%H:%M:%S')
            temp_df = temp_df.drop(columns=['DateTime'])

            # Convert back to polars
            df = pl.from_pandas(temp_df)

        # Clean data: remove any rows that have non-numeric values in Speed/Distance
        # This handles cases where header rows might be included in data
        df = df.filter(
            pl.col("Speed").cast(pl.Utf8).str.contains(r"^\d+\.?\d*$") &
            pl.col("Distance").cast(pl.Utf8).str.contains(r"^\d+\.?\d*$")
        )

        # Process the data
        df = df.with_columns([
            pl.col("Speed").cast(pl.Float64),
            pl.col("Distance").cast(pl.Float64),
        ])

        # Clean data: Force distance=0 when speed=0 (at halt, distance can't be >0)
        df = df.with_columns([
            pl.when(pl.col("Speed") == 0)
              .then(0)
              .otherwise(pl.col("Distance"))
              .alias("Distance")
        ])

        # Calculate cumulative distance
        df = calculate_cumulative_distance(df, distance_col="Distance")

        # Resolve corridor if train number is provided
        corridor_info = None
        train_type = None
        ordered_stations = []
        station_km_map = {}
        halting_station_map = {}
        psr_values = []
        violations = []

        if train_number:
            corridor_info = corridor_manager.resolve_corridor(
                train_number, from_station or "", to_station or ""
            )

            # Determine train type (fast/slow/thb)
            if corridor_info:
                corridor_name = corridor_info.get('corridor', '')
                train_code = corridor_manager.get_train_code(train_number)

                # Determine train type from train code prefix (primary source)
                prefix = str(train_code).strip()[:3] if train_code else None

                if corridor_name and 'THB' in corridor_name.upper():
                    train_type = 'thb'
                elif prefix and prefix in corridor_manager.FAST_PREFIXES:
                    train_type = 'fast'
                else:
                    train_type = 'slow'

                # Validate against corridor name (double-check for consistency)
                if corridor_name and 'FAST' in corridor_name.upper() and train_type != 'fast':
                    print(f"[WARNING] Mismatch: train_type={train_type} but corridor={corridor_name}")
                elif corridor_name and 'LOCAL' in corridor_name.upper() and train_type == 'fast':
                    print(f"[WARNING] Mismatch: train_type={train_type} but corridor={corridor_name}")

                # Get corridor data for PSR calculation
                print(f"[DEBUG] Looking for corridor: '{corridor_name}'")
                print(f"[DEBUG] Available corridors: {list(corridor_manager.corridors.keys())}")

                corridor_data = corridor_manager.corridors.get(corridor_name)
                if corridor_data:
                    print(f"[DEBUG] Corridor found! Stations: {corridor_data.stations[:5]}...")  # First 5 stations

                    # Determine which stations to use for PSR calculation
                    all_stations = corridor_data.stations

                    # Filter to from/to range if provided
                    # psr_stations will be used for PSR calculation (all corridor stations)
                    # ordered_stations will be used for halt matching (may be filtered later)
                    if from_station and to_station and from_station in all_stations and to_station in all_stations:
                        from_idx = all_stations.index(from_station)
                        to_idx = all_stations.index(to_station)
                        if from_idx < to_idx:
                            psr_stations = all_stations[from_idx:to_idx+1]
                        else:
                            psr_stations = all_stations[to_idx:from_idx+1][::-1]
                        print(f"[DEBUG] Target station range from form: {from_station}→{to_station} ({len(psr_stations)} stations)")
                    else:
                        psr_stations = all_stations
                        print(f"[DEBUG] Using all {len(psr_stations)} corridor stations (no from/to provided)")

                    ordered_stations = psr_stations  # Initialize ordered_stations for halt matching

                    # Use official KM map based on train type (like GAS app)
                    # These are hardcoded reference values, NOT calculated from corridor CSV
                    print(f"[DEBUG] Loading official station KM map for train_type={train_type}...")
                    station_km_map = get_station_km_map_for_train_type(train_type)

                    print(f"[DEBUG] Loaded official KM map with {len(station_km_map)} stations (for PSR officialKM)")
                    print(f"[DEBUG] First 5 station KMs: {list(station_km_map.items())[:5]}")
                    print(f"[DEBUG] Last 5 station KMs: {list(station_km_map.items())[-5:]}")
                    if from_station and from_station in station_km_map:
                        print(f"[DEBUG] Target from_station {from_station} at {station_km_map[from_station]:.0f}m")
                    if to_station and to_station in station_km_map:
                        print(f"[DEBUG] Target to_station {to_station} at {station_km_map[to_station]:.0f}m")

                    # Detect halts using ISD-based matching (GAS approach)
                    print(f"[DEBUG] Detecting halts in SPM data...")

                    # Step 1: Detect raw halts (speed=0, distance=0)
                    halts = halt_detector.detect_halts(
                        df,
                        speed_col='Speed',
                        cum_dist_col='cumulative_distance'
                    )

                    halt_distances = [f"{h['cumulative_distance']:.0f}m" for h in halts]
                    print(f"[DEBUG] Detected {len(halts)} raw halts at: {halt_distances[:10]}")

                    # Step 2: Match halts using ISD pattern matching
                    print(f"[DEBUG] Matching halts to stations using ISD algorithm...")
                    halt_result = halt_detector.match_halts_using_isd(
                        halts,
                        corridor_data,
                        from_station=from_station,
                        to_station=to_station,
                        max_isd_diff=175.0,  # 175m ISD tolerance (balances junction stations & skip detection)
                        max_cd_diff=300.0    # 300m cumulative distance tolerance
                    )

                    # Extract halting stations and ordered stations from result
                    halting_station_map = halt_result['halting_stations']
                    ordered_stations = halt_result['ordered_stations']

                    print(f"[DEBUG] Matched {len(halting_station_map)}/{len(halts)} halts to stations")
                    print(f"[DEBUG] Halting stations: {list(halting_station_map.keys())}")
                    print(f"[DEBUG] Ordered stations after halt matching: {len(ordered_stations)} stations")
                    print(f"[DEBUG] Ordered stations list: {ordered_stations}")

                    # Track whether stations were explicitly provided by user (before auto-detection)
                    user_provided_from = bool(from_station)
                    user_provided_to = bool(to_station)
                    user_provided_both = user_provided_from and user_provided_to

                    # Determine the actual from/to stations based on what was matched
                    if (not from_station or not to_station) and ordered_stations and len(ordered_stations) >= 2:
                        # If from/to not provided, use first/last from ordered stations
                        from_station = ordered_stations[0]
                        to_station = ordered_stations[-1]

                        print(f"[DEBUG] Using detected halt range: {from_station}→{to_station} ({len(ordered_stations)} stations)")

                    # Adjust/filter SPM data based on whether user provided explicit stations
                    if halting_station_map:
                        # Determine start and end positions
                        if user_provided_both and from_station in halting_station_map and to_station in halting_station_map:
                            # User explicitly requested specific segment - filter both start AND end
                            start_dist = halting_station_map[from_station]
                            end_dist = halting_station_map[to_station]

                            print(f"[DEBUG] User requested segment: {from_station} ({start_dist:.0f}m) → {to_station} ({end_dist:.0f}m)")
                            print(f"[DEBUG] Filtering data to show only this segment")

                            # Get actual end before adjustment
                            actual_end = float(df['cumulative_distance'].max())
                            original_len = len(df)

                            # Filter both start and end
                            df = df.filter(
                                (pl.col('cumulative_distance') >= start_dist) &
                                (pl.col('cumulative_distance') <= end_dist)
                            )
                        else:
                            # Auto-detected or partial - only filter start, keep full journey
                            start_dist = min(halting_station_map.values())

                            print(f"[DEBUG] Auto-detected or partial station selection")
                            print(f"[DEBUG] Adjusting to start from 0 (was {start_dist:.0f}m), keeping full journey")

                            # Get actual end before adjustment
                            actual_end = float(df['cumulative_distance'].max())
                            original_len = len(df)

                            # Only filter start point
                            df = df.filter(pl.col('cumulative_distance') >= start_dist)

                        # Adjust cumulative distances to start from 0
                        df = df.with_columns([
                            (pl.col('cumulative_distance') - start_dist).alias('cumulative_distance')
                        ])

                        adjusted_end = float(df['cumulative_distance'].max())
                        print(f"[DEBUG] Result: {len(df)} rows (was {original_len}), spanning 0 to {adjusted_end:.0f}m")

                        # Adjust halting_station_map positions to match adjusted data
                        adjusted_halting_map = {}
                        for station, halt_dist in halting_station_map.items():
                            adjusted_halting_map[station] = halt_dist - start_dist
                        halting_station_map = adjusted_halting_map

                        print(f"[DEBUG] Adjusted halting stations: {halting_station_map}")

                        # Adjust station_km_map for PSR calculation
                        # Use psr_stations (all corridor stations) not ordered_stations (halt-filtered)
                        adjusted_station_km_map = {}
                        missing_stations = []
                        for station in psr_stations:
                            if station in station_km_map:
                                adjusted_station_km_map[station] = station_km_map[station] - start_dist
                            else:
                                missing_stations.append(station)

                        print(f"[DEBUG] Adjusted station KM map for PSR: {len(adjusted_station_km_map)} stations")
                        print(f"[DEBUG] First 5: {list(adjusted_station_km_map.items())[:5]}")
                        print(f"[DEBUG] Last 5: {list(adjusted_station_km_map.items())[-5:]}")
                        if missing_stations:
                            print(f"[DEBUG] Missing from station_km_map: {missing_stations}")
                    else:
                        # No halts matched - use original data
                        adjusted_station_km_map = station_km_map
                        print(f"[DEBUG] No halts matched - using original data")

                    # Calculate PSR/MPS values
                    try:
                        print(f"[DEBUG] Starting PSR calculation for train_type={train_type}...")
                        print(f"[DEBUG] Using {len(psr_stations)} corridor stations for PSR (not just halting stations)")
                        spm_data_dicts = df.to_dicts()
                        psr_values = psr_calculator.process_train_speed_limits(
                            spm_data_dicts,
                            psr_stations,  # Use all corridor stations, not just halting stations
                            adjusted_station_km_map,
                            halting_station_map,
                            train_type
                        )

                        print(f"[DEBUG] PSR calculation complete! Got {len(psr_values)} values")
                        print(f"[DEBUG] Sample PSR values: {psr_values[:10]}")

                        # Add PSR values to dataframe as a new column
                        # Use pl.Series to properly add the list as a column
                        df = df.with_columns([
                            pl.Series('PSR', psr_values)
                        ])

                        # Detect violations
                        violations = detect_violations(spm_data_dicts, psr_values)
                        print(f"[DEBUG] Found {len(violations)} violations")

                    except Exception as psr_error:
                        print(f"[ERROR] Could not calculate PSR/MPS: {psr_error}")
                        import traceback
                        traceback.print_exc()
                        # Continue without PSR data

        # Generate run ID
        run_id = f"RUN_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Store run data
        runs_storage[run_id] = {
            "run_id": run_id,
            "filename": file.filename,
            "staff_id": staff_id,
            "from_station": from_station,
            "to_station": to_station,
            "train_number": train_number,
            "date_of_working": date_of_working,
            "analysed_by": analysed_by,
            "unit_number": unit_number,
            "train_type": train_type,
            "notes": notes,
            "uploaded_at": datetime.now().isoformat(),
            "corridor_info": corridor_info,
            "halting_stations": halting_station_map,
            "ordered_stations": ordered_stations if 'ordered_stations' in locals() else [],
            "violations": violations,
            "violation_count": len(violations),
            "data": df.to_dicts(),
            "row_count": len(df),
            "max_speed": float(df["Speed"].max()),
            "total_distance": float(df["Distance"].sum()),
        }

        return {
            "success": True,
            "run_id": run_id,
            "rows_processed": len(df),
            "corridor_info": corridor_info,
            "train_type": train_type,
            "halts_detected": len(halting_station_map),
            "halting_stations": list(halting_station_map.keys()),
            "violation_count": len(violations),
            "violations_summary": {
                "critical": len([v for v in violations if v['severity'] == 'critical']),
                "severe": len([v for v in violations if v['severity'] == 'severe']),
                "moderate": len([v for v in violations if v['severity'] == 'moderate']),
                "minor": len([v for v in violations if v['severity'] == 'minor']),
            },
            "summary": {
                "max_speed": float(df["Speed"].max()),
                "avg_speed": float(df["Speed"].mean()),
                "total_distance": float(df["Distance"].sum()),
                "psr_calculated": len(psr_values) > 0,
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

    finally:
        # Clean up temp file
        tmp_path.unlink(missing_ok=True)


@app.get("/runs")
async def list_runs():
    """List all uploaded runs"""
    return {
        "runs": [
            {
                "run_id": run_id,
                "filename": data["filename"],
                "staff_id": data["staff_id"],
                "from_station": data["from_station"],
                "to_station": data["to_station"],
                "uploaded_at": data["uploaded_at"],
                "row_count": data["row_count"],
            }
            for run_id, data in runs_storage.items()
        ]
    }


@app.get("/runs/{run_id}")
async def get_run(run_id: str):
    """Get details of a specific run"""
    if run_id not in runs_storage:
        raise HTTPException(status_code=404, detail="Run not found")

    return runs_storage[run_id]


@app.post("/chart_data")
async def get_chart_data(
    run_id: Optional[str] = None,
    from_station_equals: Optional[str] = None,
    to_station_equals: Optional[str] = None,
):
    """
    Get chart data for visualization
    If run_id is provided, return that specific run
    Otherwise return the latest run matching the criteria
    """
    # If specific run requested
    if run_id:
        if run_id not in runs_storage:
            raise HTTPException(status_code=404, detail="Run not found")
        run_data = runs_storage[run_id]
    else:
        # Get latest run (or filter by criteria)
        matching_runs = [
            data for data in runs_storage.values()
            if (not from_station_equals or data.get("from_station") == from_station_equals)
            and (not to_station_equals or data.get("to_station") == to_station_equals)
        ]

        if not matching_runs:
            # Return sample data if no runs available
            return {
                "samples": [
                    {
                        "timestamp": f"10:{i:02d}",
                        "distance": round(i * 0.5, 2),
                        "speed": (i * 7) % 90,
                        "station": "" if i % 5 else f"STN{i}",
                    }
                    for i in range(20)
                ],
                "message": "No runs found, showing sample data"
            }

        # Get most recent run
        run_data = max(matching_runs, key=lambda x: x["uploaded_at"])

    # Convert stored data to chart format
    samples = []
    entry_samples = []
    first_halt_index = run_data.get("first_halt_index")
    for idx, row in enumerate(run_data["data"]):
        timestamp = f"{row.get('Time', '')}" if row.get('Time') else f"T+{idx}s"
        raw_cumulative = float(row.get("cumulative_distance", 0) or 0)
        raw_speed = float(row.get("Speed", 0) or 0)

        sample = {
            "timestamp": timestamp,
            "distance": round(float(row.get("Distance", 0) or 0), 2),
            "cumulative_distance": round(raw_cumulative, 2),
            "speed": raw_speed,
            "station": "",  # Could be enriched with station data from corridor_loader
        }

        # Add PSR/MPS if available
        if "PSR" in row and row["PSR"] is not None:
            # Handle both single values and potential list wrapping
            psr_val = row["PSR"]
            if isinstance(psr_val, (list, tuple)) and len(psr_val) > 0:
                psr_val = psr_val[0]  # Unwrap if it's a list
            if psr_val is not None:
                sample["psr"] = int(psr_val)

        samples.append(sample)
        entry_samples.append({
            "cumulative_distance": raw_cumulative,
            "speed": raw_speed
        })

    # Detect brake feel tests (using per-sample speeds)
    brake_tests = [
        {
            "start_index": test.start_index,
            "end_index": test.end_index,
            "max_speed_index": test.max_speed_index,
            "lowest_speed_index": test.lowest_speed_index,
            "recovery_index": test.recovery_index,
            "braking_start_index": test.braking_start_index,
            "start_speed": test.start_speed,
            "max_speed": test.max_speed,
            "braking_start_speed": test.braking_start_speed,
            "lowest_speed": test.lowest_speed,
            "recovery_speed": test.recovery_speed,
            "speed_drop": test.speed_drop,
            "duration": test.duration,
        }
        for test in brakefeel_detector.detect_from_samples(samples)
    ][:1]

    # Prepare station markers for chart visualization
    # Map each station to its nearest sample index for chart positioning
    halting_stations = run_data.get("halting_stations", {})
    ordered_stations = run_data.get("ordered_stations", [])
    train_type = run_data.get("train_type", "slow")
    station_markers = []

    # Calculate platform entry speeds
    platform_entry_data = {}
    if ordered_stations and halting_stations:
        try:
            entry_calculator = PlatformEntryCalculator()
            platform_entry_data = entry_calculator.calculate_platform_entry_speeds(
                halting_stations,
                ordered_stations,
                entry_samples if entry_samples else samples,
                train_type
            )
        except Exception as e:
            print(f"[ERROR] Could not calculate platform entry speeds: {e}")
            import traceback
            traceback.print_exc()

    for station_name, halt_dist_km in halting_stations.items():
        # Find the sample closest to this halt distance
        closest_idx = 0
        min_diff = float('inf')

        for idx, sample in enumerate(samples):
            diff = abs(sample["cumulative_distance"] - halt_dist_km)
            if diff < min_diff:
                min_diff = diff
                closest_idx = idx

        # Get platform entry speeds if available
        entry_speed = None
        mid_platform_speed = None
        one_coach_speed = None
        if station_name in platform_entry_data:
            entry_speed = platform_entry_data[station_name].get('entry_speed')
            mid_platform_speed = platform_entry_data[station_name].get('mid_platform_speed')
            one_coach_speed = platform_entry_data[station_name].get('one_coach_speed')

        station_markers.append({
            "station": station_name,
            "distance": round(halt_dist_km, 2),
            "sample_index": closest_idx,
            "platform_entry_speed": round(entry_speed, 1) if entry_speed is not None else None,
            "mid_platform_speed": round(mid_platform_speed, 1) if mid_platform_speed is not None else None,
            "one_coach_speed": round(one_coach_speed, 1) if one_coach_speed is not None else None
        })
        if first_halt_index is None or closest_idx < first_halt_index:
            first_halt_index = closest_idx

    # Ensure the chart shows the starting station even if no halt was detected there
    start_station = run_data.get("from_station") or (ordered_stations[0] if ordered_stations else None)
    if start_station and all(marker["station"] != start_station for marker in station_markers):
        first_sample = samples[0] if samples else None
        start_distance = first_sample["cumulative_distance"] if first_sample else 0.0
        station_markers.insert(0, {
            "station": start_station,
            "distance": round(float(start_distance), 2),
            "sample_index": 0,
            "platform_entry_speed": 0.0,  # starting point speed is effectively 0 km/h
            "mid_platform_speed": None,
            "one_coach_speed": None
        })

    if first_halt_index is None:
        for idx, sample in enumerate(samples):
            if idx == 0:
                continue
            if (sample.get("speed") == 0 and
                (sample.get("distance") == 0 or sample.get("cumulative_distance") == 0)):
                first_halt_index = idx
                break

    return {
        "samples": samples,
        "run_id": run_data["run_id"],
        "metadata": {
            "staff_id": run_data.get("staff_id"),
            "from_station": run_data.get("from_station"),
            "to_station": run_data.get("to_station"),
            "train_number": run_data.get("train_number"),
            "train_type": run_data.get("train_type"),
            "date_of_working": run_data.get("date_of_working"),
            "analysed_by": run_data.get("analysed_by"),
            "unit_number": run_data.get("unit_number"),
            "notes": run_data.get("notes"),
        },
        "halting_stations": halting_stations,
        "station_markers": station_markers,
        "brake_tests": brake_tests,
        "first_halt_index": first_halt_index,
        "platform_entry_data": platform_entry_data,
        "violations": run_data.get("violations", []),
        "violation_count": run_data.get("violation_count", 0),
    }


@app.delete("/runs/{run_id}")
async def delete_run(run_id: str):
    """Delete a run"""
    if run_id not in runs_storage:
        raise HTTPException(status_code=404, detail="Run not found")

    del runs_storage[run_id]
    return {"success": True, "message": f"Run {run_id} deleted"}


@app.get("/train/{train_number}/info")
async def get_train_info(train_number: str, from_station: str = "", to_station: str = ""):
    """Get train information including corridor and halts"""
    train_code = corridor_manager.get_train_code(train_number)
    halts = corridor_manager.get_train_halts(train_number)
    corridor_info = corridor_manager.resolve_corridor(train_number, from_station, to_station)

    return {
        "train_number": train_number,
        "train_code": train_code,
        "halts": halts,
        "corridor_info": corridor_info,
    }

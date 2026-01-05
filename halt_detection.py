"""
Halt Detection Module

Detects where a train stopped (speed = 0) and matches those positions
with known stations from corridor data.
"""

from typing import List, Dict, Tuple, Optional, TYPE_CHECKING
import polars as pl

if TYPE_CHECKING:
    from corridor_loader import CorridorData


class HaltDetector:
    """Detect train halts and match them to stations"""

    def __init__(self, speed_threshold: float = 5.0, min_halt_duration_seconds: int = 10):
        """
        Initialize halt detector.

        Args:
            speed_threshold: Speed below this is considered a halt (km/h)
            min_halt_duration_seconds: Minimum duration to count as a halt
        """
        self.speed_threshold = speed_threshold
        self.min_halt_duration_seconds = min_halt_duration_seconds

    def detect_halts(
        self,
        spm_data: pl.DataFrame,
        speed_col: str = 'Speed',
        cum_dist_col: str = 'cumulative_distance'
    ) -> List[Dict]:
        """
        Detect halts in SPM data.

        Simple logic: Find all rows where speed = 0, then get unique cumulative distances.
        This handles cases where SPM instruments skip recording during halts.

        Args:
            spm_data: Polars DataFrame with speed and distance data
            speed_col: Name of speed column
            cum_dist_col: Name of cumulative distance column

        Returns:
            List of halt dictionaries with cumulative_distance
        """
        if speed_col not in spm_data.columns or cum_dist_col not in spm_data.columns:
            return []

        # Find all rows where speed = 0
        halt_rows = spm_data.filter(pl.col(speed_col) == 0)

        if len(halt_rows) == 0:
            return []

        # Get unique (distinct) cumulative distances where halts occurred
        unique_halt_distances = halt_rows.select(cum_dist_col).unique().sort(cum_dist_col)

        # Convert to list of dicts
        halts = []
        for row in unique_halt_distances.iter_rows():
            halt_dist = float(row[0])
            halts.append({
                'cumulative_distance': halt_dist
            })

        return halts

    def match_halts_to_stations(
        self,
        halts: List[Dict],
        station_positions: Dict[str, float],
        max_distance_tolerance: float = 500.0
    ) -> Dict[str, float]:
        """
        Match detected halts to known station positions.

        Args:
            halts: List of detected halts from detect_halts()
            station_positions: Dict of {station_name: official_km_or_meters}
            max_distance_tolerance: Maximum distance (meters) to match halt to station

        Returns:
            Dict of {station_name: actual_cumulative_distance}

        Example:
            halts = [
                {'cumulative_distance': 0.05, ...},
                {'cumulative_distance': 4.12, ...},
                {'cumulative_distance': 9.02, ...}
            ]

            station_positions = {
                'CSMT': 0.1,
                'BY': 4.04,
                'DR': 8.85
            }

            Returns: {
                'CSMT': 0.05,
                'BY': 4.12,
                'DR': 9.02
            }
        """
        halting_station_map = {}
        unmatched_halts = []

        for halt in halts:
            halt_dist = halt['cumulative_distance']

            # Find nearest station
            best_match = None
            best_distance = float('inf')
            nearest_station_info = None

            for station_name, official_km in station_positions.items():
                # Calculate distance between halt and official station position
                # (This is approximate since actual vs official distances differ)
                distance = abs(halt_dist - official_km)

                if distance < best_distance:
                    best_distance = distance
                    nearest_station_info = (station_name, official_km, distance)

                    if distance <= max_distance_tolerance:
                        best_match = station_name

            if best_match:
                halting_station_map[best_match] = halt_dist
            else:
                unmatched_halts.append({
                    'halt_dist': halt_dist,
                    'nearest_station': nearest_station_info[0] if nearest_station_info else None,
                    'nearest_official': nearest_station_info[1] if nearest_station_info else None,
                    'distance_to_nearest': nearest_station_info[2] if nearest_station_info else None
                })

        # Debug: Log unmatched halts
        if unmatched_halts:
            print(f"[DEBUG HALT] {len(unmatched_halts)} unmatched halts (tolerance={max_distance_tolerance}m):")
            for um in unmatched_halts[:5]:  # Show first 5
                print(f"  Halt at {um['halt_dist']:.0f}m → nearest: {um['nearest_station']} at {um['nearest_official']:.0f}m (Δ={um['distance_to_nearest']:.0f}m)")

        return halting_station_map

    def match_halts_using_isd(
        self,
        halts: List[Dict],
        corridor_data: 'CorridorData',
        from_station: Optional[str] = None,
        to_station: Optional[str] = None,
        max_isd_diff: float = 100.0,
        max_cd_diff: float = 300.0,
        fast_train_halts: Optional[List[str]] = None,
        slow_corridor_data: Optional['CorridorData'] = None,
        semi_fast_info: Optional[Dict] = None
    ) -> Dict[str, float]:
        """
        Match halts to stations using ISD (Inter-Station Distance) pattern matching.

        This is the GAS-style approach that handles GPS drift better than absolute
        position matching. Based on routeselector.js matchHaltsWithStations().

        Args:
            halts: List of detected halts from detect_halts()
            corridor_data: CorridorData with stations and ISDs
            from_station: Optional starting station (if not provided, uses first halt)
            to_station: Optional ending station (for validation)
            max_isd_diff: Maximum ISD difference tolerance (meters) - default 100m
            max_cd_diff: Maximum cumulative distance difference (meters) - default 300m
            fast_train_halts: Optional list of stations for fast trains
            slow_corridor_data: Optional slow corridor for semi-fast trains
            semi_fast_info: Optional dict with change_point for semi-fast switching

        Returns:
            Dict of {station_name: actual_cumulative_distance}

        Algorithm:
            1. First halt is ALWAYS matched to from_station (or first station if not provided)
            2. Calculate ISDs from SPM halts
            3. Match subsequent halts by comparing SPM ISD pattern vs corridor ISD pattern
            4. Accumulate unmatched ISDs when stations are skipped

        Example:
            SPM halts at: [0m, 4120m, 9020m] → ISDs: [4120m, 4900m]
            Corridor ISDs: [0, 4040m, 4850m] → ISDs: [4040m, 4850m]

            Match 1: 0m → from_station (always)
            Match 2: 4120m ISD ≈ 4040m corridor ISD (Δ=80m < 100m) ✓
            Match 3: 4900m ISD ≈ 4850m corridor ISD (Δ=50m < 100m) ✓
        """
        if not halts:
            return {}

        # Get corridor stations and all records (for ISDs)
        all_stations = corridor_data.stations
        if not corridor_data.records:
            print("[DEBUG ISD] No corridor records found")
            return {}

        # Keep all records for best-match ISD lookup
        all_records = corridor_data.records
        # Use first record for cumulative distances (station positions)
        corridor_cumulative = all_records[0].cumulative_distances
        print(f"[DEBUG ISD] Loaded {len(all_records)} corridor records for ISD matching")

        # Setup slow corridor data for semi-fast trains
        slow_all_stations = None
        slow_all_records = None
        change_point = None
        if slow_corridor_data and semi_fast_info and semi_fast_info.get('change_point'):
            slow_all_stations = slow_corridor_data.stations
            slow_all_records = slow_corridor_data.records
            change_point = semi_fast_info['change_point'].upper()
            print(f"[DEBUG ISD] SEMI-FAST: Using slow corridor after {change_point}")
            print(f"[DEBUG ISD] SEMI-FAST: Slow corridor has {len(slow_all_stations)} stations, {len(slow_all_records)} records")

        # Calculate ISDs from SPM halts
        halt_cumulative = [h['cumulative_distance'] for h in halts]
        halt_isds = []
        for i in range(1, len(halt_cumulative)):
            isd = halt_cumulative[i] - halt_cumulative[i-1]
            halt_isds.append(isd)

        print(f"[DEBUG ISD] Detected {len(halts)} halts with {len(halt_isds)} ISDs")
        print(f"[DEBUG ISD] SPM ISDs (first 5): {[f'{isd:.0f}m' for isd in halt_isds[:5]]}")

        # Determine starting station
        if from_station:
            start_station = from_station.upper()
            if start_station not in all_stations:
                print(f"[DEBUG ISD] from_station '{start_station}' not in corridor, using first halt as unknown start")
                start_station = None
        else:
            start_station = None

        # Build ordered station list (from start to end)
        if start_station:
            try:
                start_idx = all_stations.index(start_station)
            except ValueError:
                print(f"[DEBUG ISD] Station {start_station} not found in corridor")
                return {}
        else:
            start_idx = 0
            start_station = all_stations[0]
            print(f"[DEBUG ISD] No from_station specified, assuming first station: {start_station}")

        if to_station:
            end_station = to_station.upper()
            try:
                end_idx = all_stations.index(end_station)
            except ValueError:
                print(f"[DEBUG ISD] to_station '{end_station}' not found in corridor")
                end_idx = len(all_stations) - 1
        else:
            end_idx = len(all_stations) - 1

        # Determine direction
        if end_idx >= start_idx:
            direction = "forward"
        else:
            direction = "reverse"

        # For FAST trains, use provided halt list instead of all stations
        if fast_train_halts:
            # Filter halts to only those in corridor
            nominated_halts = []
            for station in fast_train_halts:
                station_upper = station.upper()
                if station_upper in all_stations:
                    nominated_halts.append(station_upper)

            # Check if from_station is in nominated halts
            # If not, prepend corridor stations from from_station to first nominated halt
            # (Branch stations like TLA, ABY, SHD are local - all trains stop there)
            ordered_stations = nominated_halts

            if start_station and nominated_halts and start_station not in nominated_halts:
                first_nominated = nominated_halts[0]
                if first_nominated in all_stations:
                    first_nom_idx = all_stations.index(first_nominated)
                    # Add all corridor stations from start to first nominated halt
                    if direction == "forward":
                        branch_stations = all_stations[start_idx:first_nom_idx]
                    else:
                        branch_stations = list(reversed(all_stations[first_nom_idx+1:start_idx+1]))
                    ordered_stations = branch_stations + ordered_stations
                    print(f"[DEBUG ISD] FAST TRAIN: Prepended {len(branch_stations)} branch stations")
                    print(f"[DEBUG ISD] Branch (start): {', '.join(branch_stations)}")

            # Check if to_station is in nominated halts
            # If not, append corridor stations from last nominated halt to to_station
            # (Branch stations beyond KYN like SHD, ABY, TLA are local - all trains stop there)
            end_station = to_station.upper() if to_station else None
            if end_station and nominated_halts and end_station not in nominated_halts:
                last_nominated = nominated_halts[-1]
                if last_nominated in all_stations and end_station in all_stations:
                    last_nom_idx = all_stations.index(last_nominated)
                    end_idx_actual = all_stations.index(end_station)
                    # Add all corridor stations from last nominated halt to end
                    if direction == "forward":
                        branch_stations_end = all_stations[last_nom_idx+1:end_idx_actual+1]
                    else:
                        branch_stations_end = list(reversed(all_stations[end_idx_actual:last_nom_idx]))
                    ordered_stations = ordered_stations + branch_stations_end
                    print(f"[DEBUG ISD] FAST TRAIN: Appended {len(branch_stations_end)} branch stations")
                    print(f"[DEBUG ISD] Branch (end): {', '.join(branch_stations_end)}")

            print(f"[DEBUG ISD] FAST TRAIN: Using {len(ordered_stations)} total halts")
            print(f"[DEBUG ISD] Halts: {', '.join(ordered_stations)}")
        else:
            # LOCAL trains: use all stations in range
            if direction == "forward":
                ordered_stations = all_stations[start_idx:end_idx + 1]
            else:
                ordered_stations = list(reversed(all_stations[end_idx:start_idx + 1]))

        print(f"[DEBUG ISD] Route: {ordered_stations[0]} → {ordered_stations[-1]} ({len(ordered_stations)} stations, {direction})")

        # Build station_km_map from corridor cumulative distances
        station_km_map = {}
        for i, station in enumerate(all_stations):
            if i < len(corridor_cumulative):
                station_km_map[station] = corridor_cumulative[i]

        # Smart matching: Check if recording starts at from_station or before it
        matched_stations = {}
        start_halt_idx = 0

        if from_station and to_station and from_station in station_km_map and to_station in station_km_map:
            # User provided both stations - check if SPM data matches expected corridor distance
            from_station_km = station_km_map[from_station]
            to_station_km = station_km_map[to_station]

            # Expected distance from corridor
            expected_distance = abs(to_station_km - from_station_km)

            # Actual distance from SPM data
            spm_total_distance = halt_cumulative[-1] - halt_cumulative[0]

            # Compare distances (tolerance: 20% or 3000m, whichever is larger)
            distance_tolerance = max(expected_distance * 0.2, 3000.0)
            distance_diff = abs(spm_total_distance - expected_distance)

            print(f"[DEBUG ISD] Corridor distance {from_station}→{to_station}: {expected_distance:.0f}m")
            print(f"[DEBUG ISD] SPM total distance: {spm_total_distance:.0f}m")
            print(f"[DEBUG ISD] Difference: {distance_diff:.0f}m (tolerance: {distance_tolerance:.0f}m)")

            if distance_diff <= distance_tolerance:
                # SPM data matches corridor distance - recording starts AT from_station
                matched_stations[start_station] = halt_cumulative[0]
                start_halt_idx = 0
                print(f"[DEBUG ISD] Match 1/{len(halts)}: First halt at {halt_cumulative[0]:.0f}m → {start_station} (recording starts here)")
            else:
                # SPM data is longer - recording starts BEFORE from_station
                # Find halt near from_station's corridor position
                best_halt_idx = 0
                best_diff = float('inf')

                for i, halt_dist in enumerate(halt_cumulative):
                    diff = abs(halt_dist - from_station_km)
                    if diff < best_diff:
                        best_diff = diff
                        best_halt_idx = i

                # Match if within 250m tolerance
                if best_diff <= 250:
                    matched_stations[start_station] = halt_cumulative[best_halt_idx]
                    start_halt_idx = best_halt_idx
                    print(f"[DEBUG ISD] Match 1/{len(halts)}: Halt at {halt_cumulative[best_halt_idx]:.0f}m → {start_station} (found in middle, Δ={best_diff:.0f}m)")
                else:
                    print(f"[DEBUG ISD] Warning: from_station {start_station} not found within 250m of any halt (closest: {best_diff:.0f}m)")
                    return {}
        else:
            # No from/to provided or not in corridor - first halt matches first station
            matched_stations[start_station] = halt_cumulative[0]
            start_halt_idx = 0
            print(f"[DEBUG ISD] Match 1/{len(halts)}: First halt at {halt_cumulative[0]:.0f}m → {start_station} (auto-detected)")

        # If only one halt or we're at the last halt, return early
        if len(halts) == 1 or start_halt_idx >= len(halt_cumulative) - 1:
            return {
                'halting_stations': matched_stations,
                'ordered_stations': ordered_stations
            }

        # Match subsequent halts using ISD pattern with forward-looking best-match
        # When a halt matches, look forward 200m for potentially better matches (smaller ISD diff)
        # Find actual index of start_station in ordered_stations (not always 0 for partial journeys)
        try:
            current_station_idx = ordered_stations.index(start_station)
        except ValueError:
            current_station_idx = 0  # Fallback to first station if not found
        FORWARD_WINDOW = 200.0  # Look ahead 200m for better matches

        # Helper function to check if we're past change point (for semi-fast trains)
        def is_after_change_point(station_name: str) -> bool:
            if not change_point or not slow_all_stations:
                return False
            # Find change point in ordered_stations
            try:
                cp_idx = [s.upper() for s in ordered_stations].index(change_point)
                stn_idx = [s.upper() for s in ordered_stations].index(station_name.upper())
                return stn_idx >= cp_idx
            except ValueError:
                return False

        # Helper function to calculate expected ISD for a candidate station
        # Returns list of all valid (expected_isd, record_idx) pairs for best-match searching
        def get_all_expected_isds_for_station(from_station_idx: int, to_station_idx: int) -> list:
            """
            Returns list of (expected_isd, record_idx) tuples for all valid records.

            For fast trains that skip intermediate stations, we sum ALL corridor ISDs
            between from_station and to_station, not just the halt pattern stations.

            Example: BL45 halts at GC→TNA (skipping VK, BND, MLND)
            - Corridor: [..., GC, VK, BND, MLND, TNA, ...]
            - We sum: VK_isd + BND_isd + MLND_isd + TNA_isd
            - Only use records where from_station (GC) has a valid ISD value
            """
            valid_isds = []

            # Determine which corridor to use for this segment
            # For semi-fast trains, use slow corridor after change_point
            station_to_check = ordered_stations[to_station_idx] if to_station_idx < len(ordered_stations) else ordered_stations[-1]
            use_slow = is_after_change_point(station_to_check)

            active_stations = slow_all_stations if use_slow else all_stations
            active_records = slow_all_records if use_slow else all_records

            if use_slow and slow_all_records:
                # Debug: only log once per segment type
                pass  # Will log in main loop if needed

            # Get station names from halt pattern
            from_station = ordered_stations[from_station_idx]
            to_station = ordered_stations[to_station_idx]

            # Get their indices in the CORRIDOR (all stations, not just halts)
            try:
                corridor_idx_from = active_stations.index(from_station)
                corridor_idx_to = active_stations.index(to_station)
            except ValueError:
                # Station not in this corridor - try the other one
                alt_stations = all_stations if use_slow else slow_all_stations
                if alt_stations:
                    try:
                        corridor_idx_from = alt_stations.index(from_station)
                        corridor_idx_to = alt_stations.index(to_station)
                        active_stations = alt_stations
                        active_records = all_records if use_slow else slow_all_records
                    except ValueError:
                        return valid_isds  # Cannot find stations in any corridor
                else:
                    return valid_isds

            for record_idx, record in enumerate(active_records):
                corridor_isds = record.inter_station_distances
                expected_isd = 0.0
                valid_record = True

                try:
                    # CHECK 1: Starting station must have a valid ISD in this record
                    # If from_station's ISD is 0/empty, this record is for a train that skipped it
                    from_station_isd = corridor_isds[corridor_idx_from] if corridor_idx_from < len(corridor_isds) else 0
                    if not from_station_isd or from_station_isd == 0:
                        # Exception: CSMT (first station) always has ISD=0, which is valid
                        if from_station.upper() != "CSMT" and corridor_idx_from != 0:
                            valid_record = False
                            continue

                    # CHECK 2: Sum ALL corridor ISDs between from_station and to_station
                    # This includes all intermediate stations (even ones the train skips)
                    if direction == "forward":
                        # Forward: sum from (corridor_idx_from + 1) to corridor_idx_to (inclusive)
                        for idx in range(corridor_idx_from + 1, corridor_idx_to + 1):
                            if idx < len(corridor_isds):
                                isd_value = corridor_isds[idx]
                                if isd_value and isd_value > 0:
                                    expected_isd += isd_value
                    else:
                        # Reverse: sum from corridor_idx_to to (corridor_idx_from - 1) (inclusive)
                        for idx in range(corridor_idx_to, corridor_idx_from):
                            if idx < len(corridor_isds):
                                isd_value = corridor_isds[idx]
                                if isd_value and isd_value > 0:
                                    expected_isd += isd_value

                except (ValueError, IndexError):
                    valid_record = False

                if valid_record and expected_isd > 0:
                    valid_isds.append((expected_isd, record_idx))

            return valid_isds

        # Start from the halt after the matched start_halt
        halt_idx = start_halt_idx + 1
        last_matched_halt_idx = start_halt_idx

        while halt_idx < len(halt_cumulative):
            # Calculate accumulated ISD from last matched halt
            accumulated_isd = halt_cumulative[halt_idx] - halt_cumulative[last_matched_halt_idx]

            # Try to match with next corridor station(s)
            max_lookahead = min(5, len(ordered_stations) - current_station_idx)
            candidates_tried = []
            best_match = None  # Will store best match found

            for lookahead in range(1, max_lookahead):
                candidate_idx = current_station_idx + lookahead
                candidate_station = ordered_stations[candidate_idx]

                # Get ALL valid ISDs from all records
                all_isds = get_all_expected_isds_for_station(current_station_idx, candidate_idx)

                if not all_isds:
                    continue

                # Find the record with smallest ISD difference
                best_expected_isd = None
                best_isd_diff = float('inf')
                best_record_idx = None

                for expected_isd, record_idx in all_isds:
                    isd_diff = abs(accumulated_isd - expected_isd)
                    if isd_diff < best_isd_diff:
                        best_isd_diff = isd_diff
                        best_expected_isd = expected_isd
                        best_record_idx = record_idx

                candidates_tried.append({
                    'station': candidate_station,
                    'expected_isd': best_expected_isd,
                    'isd_diff': best_isd_diff,
                    'record_idx': best_record_idx
                })

                if best_isd_diff <= max_isd_diff:
                    # Potential match found - store as candidate
                    if best_match is None or best_isd_diff < best_match['isd_diff']:
                        best_match = {
                            'halt_idx': halt_idx,
                            'station_idx': candidate_idx,
                            'station': candidate_station,
                            'isd_diff': best_isd_diff,
                            'expected_isd': best_expected_isd,
                            'accumulated_isd': accumulated_isd,
                            'record_idx': best_record_idx,
                            'halt_position': halt_cumulative[halt_idx]
                        }
                    break  # Found match for this halt, check forward window

            if best_match:
                # Forward-looking: check next halts within 200m for better match
                first_match_position = best_match['halt_position']
                forward_halt_idx = halt_idx + 1

                while forward_halt_idx < len(halt_cumulative):
                    forward_position = halt_cumulative[forward_halt_idx]

                    # Stop if beyond forward window
                    if forward_position - first_match_position > FORWARD_WINDOW:
                        break

                    # Calculate ISD for this forward halt
                    forward_accumulated = forward_position - halt_cumulative[last_matched_halt_idx]
                    forward_diff = abs(forward_accumulated - best_match['expected_isd'])

                    # If this halt has smaller ISD diff, it's a better match
                    if forward_diff < best_match['isd_diff'] and forward_diff <= max_isd_diff:
                        print(f"[DEBUG ISD] Forward-look: Better match at {forward_position:.0f}m (Δ={forward_diff:.0f}m) vs {best_match['halt_position']:.0f}m (Δ={best_match['isd_diff']:.0f}m)")
                        best_match['halt_idx'] = forward_halt_idx
                        best_match['isd_diff'] = forward_diff
                        best_match['accumulated_isd'] = forward_accumulated
                        best_match['halt_position'] = forward_position

                    forward_halt_idx += 1

                # Accept the best match
                actual_cd = best_match['halt_position']
                matched_stations[best_match['station']] = actual_cd

                print(f"[DEBUG ISD] Match {len(matched_stations)}/{len(halts)}: Halt at {actual_cd:.0f}m → {best_match['station']} (ISD Δ={best_match['isd_diff']:.0f}m, expected={best_match['expected_isd']:.0f}m, actual={best_match['accumulated_isd']:.0f}m, record={best_match['record_idx'] + 1})")

                if best_match['station_idx'] > current_station_idx + 1:
                    skipped = ordered_stations[current_station_idx + 1:best_match['station_idx']]
                    print(f"[DEBUG ISD]   (Skipped stations: {', '.join(skipped)})")

                # Update state - skip to halt after the matched one
                current_station_idx = best_match['station_idx']
                last_matched_halt_idx = best_match['halt_idx']
                halt_idx = best_match['halt_idx'] + 1
            else:
                # No match found - log and move to next halt
                halt_isd = halt_cumulative[halt_idx] - halt_cumulative[halt_idx - 1]
                print(f"[DEBUG ISD] Halt {halt_idx + 1}/{len(halts)} at {halt_cumulative[halt_idx]:.0f}m: No match (ISD={halt_isd:.0f}m, accumulated={accumulated_isd:.0f}m)")

                if candidates_tried:
                    print(f"[DEBUG ISD]   Tried candidates (best match from {len(all_records)} records):")
                    for c in candidates_tried:
                        rec_info = f", record={c['record_idx'] + 1}" if c.get('record_idx') is not None else ""
                        print(f"[DEBUG ISD]     - {c['station']}: expected={c['expected_isd']:.0f}m, diff={c['isd_diff']:.0f}m (max allowed={max_isd_diff:.0f}m{rec_info})")

                halt_idx += 1

        print(f"[DEBUG ISD] ✓ Matched {len(matched_stations)}/{len(halts)} halts to stations")
        print(f"[DEBUG ISD] Stations matched: {list(matched_stations.keys())}")

        # Return both matched stations and ordered station list (for platform entry calculations)
        return {
            'halting_stations': matched_stations,
            'ordered_stations': ordered_stations
        }

    def detect_and_match(
        self,
        spm_data: pl.DataFrame,
        station_positions: Dict[str, float],
        speed_col: str = 'Speed',
        cum_dist_col: str = 'cumulative_distance',
        max_distance_tolerance: float = 350.0
    ) -> Tuple[List[Dict], Dict[str, float]]:
        """
        Convenience method: detect halts and match to stations in one call.

        Args:
            max_distance_tolerance: Maximum distance (meters) to match halt to station (default: 350m)

        Returns:
            Tuple of (halts_list, halting_station_map)
        """
        halts = self.detect_halts(spm_data, speed_col, cum_dist_col)
        halting_station_map = self.match_halts_to_stations(halts, station_positions, max_distance_tolerance)

        return halts, halting_station_map


def calculate_cumulative_distance(df: pl.DataFrame, distance_col: str = 'Distance') -> pl.DataFrame:
    """
    Calculate cumulative distance from individual distance measurements.

    Args:
        df: Polars DataFrame with distance column
        distance_col: Name of distance column

    Returns:
        DataFrame with added 'cumulative_distance' column
    """
    # Calculate cumulative sum of distances
    df = df.with_columns([
        pl.col(distance_col).cum_sum().alias('cumulative_distance')
    ])

    return df

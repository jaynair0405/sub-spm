# spm_db.py
from typing import Any, Dict, List, Optional, Tuple
from db_config import get_db_connection, init_connection_pool

# Optional: initialize pool once at import time (safe)
init_connection_pool(pool_size=5)

def insert_run(run: Dict[str, Any]) -> None:
    sql = """
    INSERT INTO div_sub_spm_runs (
      run_id, uploaded_by_user_id, original_filename,
      date_of_working, train_number, unit_no, from_station, to_station,
      motorman_hrms_id, motorman_cms_id,
      nom_cli_cms_id, done_by_cli_cms_id,
      abnormality_noticed,
      max_speed, avg_speed, total_distance
    )
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """
    vals = (
        run.get("run_id"),
        run.get("uploaded_by_user_id"),
        run.get("original_filename"),
        run.get("date_of_working"),
        run.get("train_number"),
        run.get("unit_no"),
        run.get("from_station"),
        run.get("to_station"),
        run.get("motorman_hrms_id"),
        run.get("motorman_cms_id"),
        run.get("nom_cli_cms_id"),
        run.get("done_by_cli_cms_id"),
        run.get("abnormality_noticed"),
        run.get("max_speed"),
        run.get("avg_speed"),
        run.get("total_distance"),
    )

    cn = get_db_connection()
    try:
        cur = cn.cursor()
        cur.execute(sql, vals)
        cn.commit()
        cur.close()
    finally:
        cn.close()

def insert_points(run_id: str, points: List[Dict[str, Any]]) -> None:
    sql = """
    INSERT INTO div_sub_spm_points
    (run_id, seq, date_str, time_str, speed, distance_step, cumulative_distance, psr)
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    """
    rows: List[Tuple[Any, ...]] = []
    for i, p in enumerate(points):
        rows.append((
            run_id,
            i,
            p.get("Date"),
            p.get("Time"),
            float(p["Speed"]),
            float(p["Distance"]),
            float(p.get("CumulativeDistance", 0.0)),
            None if p.get("PSR") is None else float(p["PSR"]),
        ))

    cn = get_db_connection()
    try:
        cur = cn.cursor()
        cur.executemany(sql, rows)
        cn.commit()
        cur.close()
    finally:
        cn.close()

def insert_station_windows(rows: List[Tuple[Any, ...]]) -> None:
    """
    Bulk insert rows into div_sub_spm_station_windows.
    """
    if not rows:
        return

    sql = """
    INSERT INTO div_sub_spm_station_windows
    (run_id, station_code, halt_km,
     platform_length_m, platform_length_source, section_key_used,
     entry_speed, mid_platform_speed, one_coach_speed,
     entry_gap_m, mid_gap_m, one_coach_gap_m,
     train_type)
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """
    cn = get_db_connection()
    try:
        cur = cn.cursor()
        cur.executemany(sql, rows)
        cn.commit()
        cur.close()
    finally:
        cn.close()

def insert_window_points(rows: List[Tuple[Any, ...]]) -> None:
    """
    Bulk insert rows into div_sub_spm_window_points.
    """
    if not rows:
        return

    sql = """
    INSERT INTO div_sub_spm_window_points
    (run_id, station_code, seq, cumulative_distance, speed, psr, time_str)
    VALUES (%s,%s,%s,%s,%s,%s,%s)
    """
    cn = get_db_connection()
    try:
        cur = cn.cursor()
        cur.executemany(sql, rows)
        cn.commit()
        cur.close()
    finally:
        cn.close()

def get_run(run_id: str) -> Optional[Dict[str, Any]]:
    cn = get_db_connection()
    try:
        cur = cn.cursor(dictionary=True)
        cur.execute("SELECT * FROM div_sub_spm_runs WHERE run_id=%s", (run_id,))
        row = cur.fetchone()
        cur.close()
        return row
    finally:
        cn.close()

def get_points(run_id: str) -> List[Dict[str, Any]]:
    cn = get_db_connection()
    try:
        cur = cn.cursor(dictionary=True)
        cur.execute(
            """
            SELECT seq, date_str, time_str, speed, distance_step, cumulative_distance, psr
            FROM div_sub_spm_points
            WHERE run_id=%s
            ORDER BY seq
            """,
            (run_id,),
        )
        rows = cur.fetchall()
        cur.close()
    finally:
        cn.close()

    out: List[Dict[str, Any]] = []
    for r in rows:
        out.append({
            "Date": r["date_str"],
            "Time": r["time_str"],
            "Speed": float(r["speed"]),
            "Distance": float(r["distance_step"]),
            "CumulativeDistance": float(r["cumulative_distance"]),
            "PSR": None if r["psr"] is None else float(r["psr"]),
        })
    return out
def list_runs(limit: int = 50):
    cn = get_db_connection()
    try:
        cur = cn.cursor(dictionary=True)
        cur.execute(
            """
            SELECT *
            FROM div_sub_spm_runs
            ORDER BY analysis_date DESC
            LIMIT %s
            """,
            (limit,),
        )
        rows = cur.fetchall()
        cur.close()
        return rows
    finally:
        cn.close()


def get_runs_by_date(date_str: str) -> List[Dict[str, Any]]:
    """
    Get all runs for a specific analysis date with joined staff/CLI names.

    Args:
        date_str: Date in YYYY-MM-DD format

    Returns:
        List of run records with motorman_name, nominated_cli_name, done_by_cli_name
    """
    cn = get_db_connection()
    try:
        cur = cn.cursor(dictionary=True)
        cur.execute(
            """
            SELECT
                r.*,
                s.name as motorman_name,
                r.motorman_cms_id,
                nc.cli_name as nominated_cli_name,
                dc.cli_name as done_by_cli_name
            FROM div_sub_spm_runs r
            LEFT JOIN div_staff_master s ON r.motorman_hrms_id = s.hrms_id
            LEFT JOIN div_cli_master nc ON r.nom_cli_cms_id = nc.cmsid
            LEFT JOIN div_cli_master dc ON r.done_by_cli_cms_id = dc.cmsid
            WHERE DATE(r.analysis_date) = %s
            ORDER BY r.analysis_date ASC
            """,
            (date_str,),
        )
        rows = cur.fetchall()
        cur.close()
        return rows
    finally:
        cn.close()


def get_staff_list(designation_id: int = 8) -> List[Dict[str, Any]]:
    """
    Get list of staff (motormen) from div_staff_master.
    Default designation_id=8 for Motormen.
    """
    cn = get_db_connection()
    try:
        cur = cn.cursor(dictionary=True)
        cur.execute(
            """
            SELECT hrms_id, current_cms_id as cms_id, name as staff_name, current_cli_id as nominated_cli_id
            FROM div_staff_master
            WHERE designation_id = %s
            ORDER BY name
            """,
            (designation_id,),
        )
        rows = cur.fetchall()
        cur.close()
        return rows
    finally:
        cn.close()


def get_cli_list() -> List[Dict[str, Any]]:
    """
    Get list of CLI from div_cli_master.
    """
    cn = get_db_connection()
    try:
        cur = cn.cursor(dictionary=True)
        cur.execute(
            """
            SELECT cli_id, cmsid as cms_id, cli_name
            FROM div_cli_master
            WHERE is_active = 1
            ORDER BY cli_name
            """
        )
        rows = cur.fetchall()
        cur.close()
        return rows
    finally:
        cn.close()


def get_cli_by_id(cli_id: int) -> Optional[Dict[str, Any]]:
    """
    Get CLI details by cli_id.
    """
    cn = get_db_connection()
    try:
        cur = cn.cursor(dictionary=True)
        cur.execute(
            """
            SELECT cli_id, cmsid as cms_id, cli_name
            FROM div_cli_master
            WHERE cli_id = %s
            """,
            (cli_id,),
        )
        row = cur.fetchone()
        cur.close()
        return row
    finally:
        cn.close()


def get_cli_by_cms_id(cms_id: str) -> Optional[Dict[str, Any]]:
    """
    Get CLI details by CMS ID (e.g., CSTM0103).
    """
    cn = get_db_connection()
    try:
        cur = cn.cursor(dictionary=True)
        cur.execute(
            """
            SELECT cli_id, cmsid as cms_id, cli_name
            FROM div_cli_master
            WHERE cmsid = %s
            """,
            (cms_id,),
        )
        row = cur.fetchone()
        cur.close()
        return row
    finally:
        cn.close()


def find_existing_run(date_of_working: str, train_number: str, from_station: str, to_station: str) -> Optional[str]:
    """
    Check if a run already exists with the same date, train, from, to.
    Returns the existing run_id if found, None otherwise.
    """
    cn = get_db_connection()
    try:
        cur = cn.cursor(buffered=True)
        cur.execute(
            """
            SELECT run_id FROM div_sub_spm_runs
            WHERE date_of_working = %s
              AND train_number = %s
              AND from_station = %s
              AND to_station = %s
            LIMIT 1
            """,
            (date_of_working, train_number, from_station, to_station),
        )
        row = cur.fetchone()
        cur.close()
        return row[0] if row else None
    finally:
        cn.close()


def delete_run_cascade(run_id: str) -> bool:
    """
    Delete a run and all related data (points, station_windows, window_points).
    Returns True if deleted, False if not found.
    """
    cn = get_db_connection()
    try:
        cur = cn.cursor(buffered=True)

        # Delete in order: child tables first, then parent
        cur.execute("DELETE FROM div_sub_spm_window_points WHERE run_id = %s", (run_id,))
        cur.execute("DELETE FROM div_sub_spm_station_windows WHERE run_id = %s", (run_id,))
        # Note: div_sub_spm_points not used (raw data not stored)
        cur.execute("DELETE FROM div_sub_spm_runs WHERE run_id = %s", (run_id,))

        deleted = cur.rowcount > 0
        cn.commit()
        cur.close()
        return deleted
    finally:
        cn.close()


def get_staff_by_hrms(hrms_id: str) -> Optional[Dict[str, Any]]:
    """
    Get staff details by HRMS ID, including nominated CLI info.
    """
    cn = get_db_connection()
    try:
        cur = cn.cursor(dictionary=True)
        cur.execute(
            """
            SELECT s.hrms_id, s.current_cms_id as cms_id, s.name as staff_name,
                   s.current_cli_id as nominated_cli_id, c.cli_name as nominated_cli_name, c.cmsid as cli_cms_id
            FROM div_staff_master s
            LEFT JOIN div_cli_master c ON s.current_cli_id = c.cli_id
            WHERE s.hrms_id = %s
            """,
            (hrms_id,),
        )
        row = cur.fetchone()
        cur.close()
        return row
    finally:
        cn.close()


def _load_train_corridor_map() -> Dict[str, Dict[str, str]]:
    """
    Load train_corridor_map.csv and return a dict mapping train code to its info.
    Returns: {train_code: {'direction': 'UP'/'DN', 'route': 'HARBOUR'/'SE'/etc, 'type': '0'/'1'/'2', 'to_station': 'TNA'/etc}}
    """
    import csv
    from pathlib import Path

    map_path = Path(__file__).parent / "train_corridor_map.csv"
    result = {}

    try:
        with open(map_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                train_code = row.get('Train', '').strip()
                if train_code:
                    result[train_code] = {
                        'direction': row.get('Direction', '').strip(),
                        'route': row.get('Route', '').strip(),
                        'type': row.get('Type', '').strip(),
                        'to_station': row.get('ToExpected', '').strip(),
                    }
    except Exception as e:
        print(f"[WARNING] Could not load train_corridor_map.csv: {e}")

    return result


# Cache the train corridor map
_TRAIN_CORRIDOR_MAP: Optional[Dict[str, Dict[str, str]]] = None

def get_train_corridor_map() -> Dict[str, Dict[str, str]]:
    """Get cached train corridor map."""
    global _TRAIN_CORRIDOR_MAP
    if _TRAIN_CORRIDOR_MAP is None:
        _TRAIN_CORRIDOR_MAP = _load_train_corridor_map()
    return _TRAIN_CORRIDOR_MAP


def get_braking_analysis_data(station_code: str, direction: str, start_date: str, end_date: str, limit: int = 20) -> Dict[str, Any]:
    """
    Get braking pattern data for a station within a date range.
    Auto-selects runs with similar halt_km to ensure same track/platform.
    Returns up to 'limit' random runs with their window points.

    Args:
        station_code: Station code (e.g., 'TNA')
        direction: 'UP' or 'DN'
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        limit: Max number of runs to return (default 20)

    Returns:
        Dict with route info and list of runs with braking points
    """
    import random

    train_map = get_train_corridor_map()
    cn = get_db_connection()

    HALT_KM_TOLERANCE = 1.0  # km - runs within this range are on same track

    try:
        cur = cn.cursor(dictionary=True)

        # Step 1: Get all runs for this station and date range
        cur.execute(
            """
            SELECT DISTINCT r.run_id, r.train_number, r.date_of_working,
                   r.motorman_hrms_id, s.name as motorman_name,
                   sw.halt_km, sw.platform_length_m
            FROM div_sub_spm_runs r
            JOIN div_sub_spm_station_windows sw ON r.run_id = sw.run_id
            LEFT JOIN div_staff_master s ON r.motorman_hrms_id = s.hrms_id
            WHERE sw.station_code = %s
              AND r.date_of_working BETWEEN %s AND %s
              AND r.train_number IS NOT NULL
              AND r.train_number != ''
            """,
            (station_code, start_date, end_date),
        )
        all_runs = cur.fetchall()

        if not all_runs:
            cur.close()
            return {'route': None, 'runs': [], 'message': 'No data found for this station and date range'}

        # Step 2: Filter by direction, exclude terminating trains, get train type
        filtered_runs = []
        for run in all_runs:
            train_code = run['train_number']
            train_info = train_map.get(train_code, {})
            train_direction = train_info.get('direction', '')
            to_station = train_info.get('to_station', '')
            train_type = train_info.get('type', '')  # '1'=Slow, '2'=Fast

            # Filter by direction
            if train_direction != direction:
                continue

            # Exclude terminating trains (they use different platforms)
            if to_station == station_code:
                continue

            run['route'] = train_info.get('route', 'UNKNOWN')
            run['train_type'] = train_type
            filtered_runs.append(run)

        if not filtered_runs:
            cur.close()
            return {'route': None, 'runs': [], 'message': f'No through-running {direction} trains found (terminating trains excluded)'}

        # Step 3: Group by train type (Fast/Slow) first
        type_groups = {}  # {'1': [runs], '2': [runs]}
        for run in filtered_runs:
            t = run.get('train_type', 'UNKNOWN')
            if t not in type_groups:
                type_groups[t] = []
            type_groups[t].append(run)

        # Select the type with most runs
        best_type = max(type_groups.keys(), key=lambda t: len(type_groups[t]))
        type_filtered_runs = type_groups[best_type]

        # Type label: 2=Fast, 1=Slow, 0/others=use route name
        if best_type == '2':
            type_label = 'Fast'
        elif best_type == '1':
            type_label = 'Slow'
        else:
            # For Type 0 (Harbour/THB), use the route name
            routes = [r.get('route', '') for r in type_filtered_runs if r.get('route')]
            type_label = max(set(routes), key=routes.count) if routes else 'Local'

        # Step 4: Group by halt_km similarity (within tolerance)
        # This ensures all selected runs are on the same physical track
        halt_km_groups = {}  # {rounded_halt_km: [runs]}

        for run in type_filtered_runs:
            halt_km = run['halt_km']
            # Round to nearest km for grouping
            group_key = round(halt_km)
            if group_key not in halt_km_groups:
                halt_km_groups[group_key] = []
            halt_km_groups[group_key].append(run)

        # Step 5: Select the halt_km group with most runs
        best_group_key = max(halt_km_groups.keys(), key=lambda k: len(halt_km_groups[k]))
        selected_runs = halt_km_groups[best_group_key]

        # Get the dominant route in this group
        route_counts = {}
        for run in selected_runs:
            route = run.get('route', 'UNKNOWN')
            route_counts[route] = route_counts.get(route, 0) + 1
        best_route = max(route_counts.keys(), key=lambda r: route_counts[r])

        # Step 6: Random selection up to limit
        if len(selected_runs) > limit:
            selected_runs = random.sample(selected_runs, limit)

        # Step 7: Get window points for each selected run
        results = []
        for run in selected_runs:
            cur.execute(
                """
                SELECT seq, cumulative_distance, speed, time_str
                FROM div_sub_spm_window_points
                WHERE run_id = %s AND station_code = %s
                ORDER BY seq
                """,
                (run['run_id'], station_code),
            )
            points = cur.fetchall()

            results.append({
                'run_id': run['run_id'],
                'train_number': run['train_number'],
                'date_of_working': str(run['date_of_working']),
                'motorman_name': run['motorman_name'] or 'Unknown',
                'halt_km': run['halt_km'],
                'points': points
            })

        # Get platform length (most common among selected runs)
        pf_lengths = [r.get('platform_length_m') for r in selected_runs if r.get('platform_length_m')]
        platform_length = max(set(pf_lengths), key=pf_lengths.count) if pf_lengths else 270  # default 270m

        cur.close()
        return {
            'route': best_route,
            'train_type': type_label,
            'halt_km_group': best_group_key,
            'platform_length': platform_length,
            'total_available': len(halt_km_groups[best_group_key]),
            'runs': results
        }
    finally:
        cn.close()


def get_stations_with_braking_data(start_date: str, end_date: str) -> List[str]:
    """
    Get list of stations that have braking data in the given date range.
    """
    cn = get_db_connection()
    try:
        cur = cn.cursor()
        cur.execute(
            """
            SELECT DISTINCT sw.station_code
            FROM div_sub_spm_station_windows sw
            JOIN div_sub_spm_runs r ON sw.run_id = r.run_id
            WHERE r.date_of_working BETWEEN %s AND %s
            ORDER BY sw.station_code
            """,
            (start_date, end_date),
        )
        rows = cur.fetchall()
        cur.close()
        return [row[0] for row in rows]
    finally:
        cn.close()

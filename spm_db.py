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


def get_max_safe_speed(dist_from_halt: float, platform_length: float = 270) -> float:
    """
    Calculate max allowed speed at given distance from halt.
    Uses linear interpolation between threshold points:
    - Platform entry (platform_length): 45 km/h
    - Mid-platform (130m): 30 km/h
    - One coach (20m): 15 km/h
    - Halt (0m): 5 km/h (tolerance for final stopping)

    The 5 km/h tolerance at halt allows for normal train creeping to stop.
    """
    if dist_from_halt >= platform_length:
        return 45
    elif dist_from_halt >= 130:
        return 30 + (dist_from_halt - 130) * (45 - 30) / (platform_length - 130)
    elif dist_from_halt >= 20:
        return 15 + (dist_from_halt - 20) * (30 - 15) / (130 - 20)
    else:
        # Linear from (20m, 15) to (0m, 5) - tolerance for final stopping
        return 5 + dist_from_halt * (15 - 5) / 20


def is_run_within_safe_zone(points: list, halt_km: float, platform_length: float = 270) -> bool:
    """
    Check if all points of a run are within the safe zone.
    Returns True if all points have speed <= max allowed at that distance.
    """
    for point in points:
        dist_from_halt = (halt_km - point['cumulative_distance']) * 1000  # meters
        if dist_from_halt < 0:
            continue  # past halt, skip
        max_speed = get_max_safe_speed(dist_from_halt, platform_length)
        if point['speed'] > max_speed:
            return False
    return True


def get_braking_analysis_data(station_code: str, direction: str, start_date: str, end_date: str, limit: int = 20, safe_zone_only: bool = True, motorman_hrms_id: str = None) -> Dict[str, Any]:
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
        safe_zone_only: If True, only include runs within safe braking zone (default True)
        motorman_hrms_id: Optional - filter for specific motorman (returns all their runs)

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

        # Step 2b: Filter by specific motorman if provided
        if motorman_hrms_id:
            filtered_runs = [r for r in filtered_runs if r.get('motorman_hrms_id') == motorman_hrms_id]
            if not filtered_runs:
                cur.close()
                return {'route': None, 'runs': [], 'message': f'No runs found for this motorman at {station_code}'}

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

        # Step 4: Use all runs of selected train type (no halt_km grouping)
        # Note: halt_km varies by train origin station, not by platform
        # All same-type (Fast/Slow) trains use the same platform regardless of origin
        selected_runs = type_filtered_runs

        # Get the dominant route in this group
        route_counts = {}
        for run in selected_runs:
            route = run.get('route', 'UNKNOWN')
            route_counts[route] = route_counts.get(route, 0) + 1
        best_route = max(route_counts.keys(), key=lambda r: route_counts[r])

        # Get platform length (most common among selected runs) - needed for safe zone check
        pf_lengths = [r.get('platform_length_m') for r in selected_runs if r.get('platform_length_m')]
        platform_length = max(set(pf_lengths), key=pf_lengths.count) if pf_lengths else 270  # default 270m

        # Step 6: Random shuffle (only for "All Motormen" mode)
        if not motorman_hrms_id:
            random.shuffle(selected_runs)

        # Step 7: Get window points for each run and apply safe zone filter
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

            # Safe zone filter: skip runs with any point above threshold
            if safe_zone_only:
                if not is_run_within_safe_zone(points, run['halt_km'], platform_length):
                    continue  # Skip this run

            results.append({
                'run_id': run['run_id'],
                'train_number': run['train_number'],
                'date_of_working': str(run['date_of_working']),
                'motorman_name': run['motorman_name'] or 'Unknown',
                'motorman_hrms_id': run.get('motorman_hrms_id'),
                'halt_km': run['halt_km'],
                'points': points
            })

            # Stop once we have enough runs (only for "All Motormen" mode)
            if not motorman_hrms_id and len(results) >= limit:
                break

        cur.close()
        return {
            'route': best_route,
            'train_type': type_label,
            'platform_length': platform_length,
            'total_available': len(selected_runs),
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


def get_motormen_for_station(station_code: str, direction: str, start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """
    Get list of motormen who have braking data at a station within the date range.
    Used for "Specific Motorman" filter in braking report.
    """
    train_map = get_train_corridor_map()
    cn = get_db_connection()
    try:
        cur = cn.cursor(dictionary=True)

        # Get all runs for this station
        cur.execute(
            """
            SELECT DISTINCT r.motorman_hrms_id, s.name as motorman_name, r.train_number,
                   COUNT(DISTINCT r.run_id) as run_count
            FROM div_sub_spm_runs r
            JOIN div_sub_spm_station_windows sw ON r.run_id = sw.run_id
            LEFT JOIN div_staff_master s ON r.motorman_hrms_id = s.hrms_id
            WHERE sw.station_code = %s
              AND r.date_of_working BETWEEN %s AND %s
              AND r.motorman_hrms_id IS NOT NULL
              AND r.motorman_hrms_id != ''
            GROUP BY r.motorman_hrms_id, s.name, r.train_number
            """,
            (station_code, start_date, end_date),
        )
        rows = cur.fetchall()
        cur.close()

        # Filter by direction using train corridor map
        motorman_runs = {}
        for row in rows:
            train_code = row['train_number']
            train_info = train_map.get(train_code, {})
            train_direction = train_info.get('direction', '')

            if train_direction != direction:
                continue

            hrms_id = row['motorman_hrms_id']
            if hrms_id not in motorman_runs:
                motorman_runs[hrms_id] = {
                    'motorman_hrms_id': hrms_id,
                    'motorman_name': row['motorman_name'] or 'Unknown',
                    'run_count': 0
                }
            motorman_runs[hrms_id]['run_count'] += row['run_count']

        # Sort by run count descending
        result = sorted(motorman_runs.values(), key=lambda x: x['run_count'], reverse=True)
        return result
    finally:
        cn.close()


# ============ REPORTS: Not Analyzed Features ============

def get_motorman_report_kpi_stats() -> Dict[str, Any]:
    """
    Get KPI stats for motorman analysis reports.
    Returns: total analyses, distinct motormen analyzed, this month count,
             not analyzed > 3 months, not analyzed > 15 days
    """
    cn = get_db_connection()
    try:
        cur = cn.cursor(dictionary=True)

        # Total unique runs analyzed (unique by train+date+from+to)
        cur.execute("""
            SELECT COUNT(DISTINCT CONCAT(train_number, '|', date_of_working, '|', from_station, '|', to_station)) as count
            FROM div_sub_spm_runs
        """)
        total_result = cur.fetchone()
        total_count = total_result['count'] if total_result else 0

        # Distinct motormen analyzed (all time)
        cur.execute("SELECT COUNT(DISTINCT motorman_hrms_id) as count FROM div_sub_spm_runs WHERE motorman_hrms_id IS NOT NULL")
        distinct_result = cur.fetchone()
        distinct_count = distinct_result['count'] if distinct_result else 0

        # Unique runs this month - using IST (UTC+5:30)
        cur.execute("""
            SELECT COUNT(DISTINCT CONCAT(train_number, '|', date_of_working, '|', from_station, '|', to_station)) as count
            FROM div_sub_spm_runs
            WHERE YEAR(CONVERT_TZ(analysis_date, '+00:00', '+05:30')) = YEAR(CURDATE())
              AND MONTH(CONVERT_TZ(analysis_date, '+00:00', '+05:30')) = MONTH(CURDATE())
        """)
        month_result = cur.fetchone()
        month_count = month_result['count'] if month_result else 0

        # Motormen not analyzed > 3 months (90 days) - including never analyzed
        cur.execute("""
            SELECT COUNT(*) as count
            FROM div_staff_master sm
            LEFT JOIN (
                SELECT motorman_hrms_id, MAX(analysis_date) as last_analysis
                FROM div_sub_spm_runs
                GROUP BY motorman_hrms_id
            ) a ON sm.hrms_id = a.motorman_hrms_id
            WHERE sm.designation_id = 8
              AND sm.status = 'Active'
              AND (a.motorman_hrms_id IS NULL OR DATEDIFF(CURDATE(), a.last_analysis) > 90)
        """)
        three_month_result = cur.fetchone()
        three_month_count = three_month_result['count'] if three_month_result else 0

        # Motormen not analyzed > 15 days (only those who have been analyzed before)
        cur.execute("""
            SELECT COUNT(*) as count
            FROM div_staff_master sm
            INNER JOIN (
                SELECT motorman_hrms_id, MAX(analysis_date) as last_analysis
                FROM div_sub_spm_runs
                GROUP BY motorman_hrms_id
            ) a ON sm.hrms_id = a.motorman_hrms_id
            WHERE sm.designation_id = 8
              AND sm.status = 'Active'
              AND DATEDIFF(CURDATE(), a.last_analysis) > 15
        """)
        fifteen_day_result = cur.fetchone()
        fifteen_day_count = fifteen_day_result['count'] if fifteen_day_result else 0

        # Total active motormen
        cur.execute("""
            SELECT COUNT(*) as count
            FROM div_staff_master
            WHERE designation_id = 8 AND status = 'Active'
        """)
        total_motormen_result = cur.fetchone()
        total_motormen = total_motormen_result['count'] if total_motormen_result else 0

        cur.close()
        return {
            "success": True,
            "total_analyses": total_count,
            "distinct_motormen_analyzed": distinct_count,
            "this_month": month_count,
            "not_analyzed_3_months": three_month_count,
            "not_analyzed_15_days": fifteen_day_count,
            "total_active_motormen": total_motormen
        }
    finally:
        cn.close()


def get_not_analyzed_3_months() -> List[Dict[str, Any]]:
    """
    Get list of motormen not analyzed in last 3 months (90 days) or never analyzed.
    """
    cn = get_db_connection()
    try:
        cur = cn.cursor(dictionary=True)

        query = """
            SELECT
                sm.name as motorman_name,
                sm.hrms_id,
                sm.current_cms_id as cms_id,
                a.last_analysis,
                CASE
                    WHEN a.last_analysis IS NULL THEN NULL
                    ELSE DATEDIFF(CURDATE(), a.last_analysis)
                END as days_since,
                a.analysis_count
            FROM div_staff_master sm
            LEFT JOIN (
                SELECT motorman_hrms_id,
                       MAX(analysis_date) as last_analysis,
                       COUNT(*) as analysis_count
                FROM div_sub_spm_runs
                GROUP BY motorman_hrms_id
            ) a ON sm.hrms_id = a.motorman_hrms_id
            WHERE sm.designation_id = 8
              AND sm.status = 'Active'
              AND (a.motorman_hrms_id IS NULL OR DATEDIFF(CURDATE(), a.last_analysis) > 90)
            ORDER BY a.last_analysis IS NULL DESC, a.last_analysis ASC, sm.name
        """

        cur.execute(query)
        results = cur.fetchall()
        cur.close()
        return results
    finally:
        cn.close()


def get_daily_analysis_trend(year: int = None, month: int = None) -> List[Dict[str, Any]]:
    """
    Get day-wise unique run count for a given month.
    Counts unique runs (train+date_of_working+from+to) per day.
    Defaults to current month.
    Uses IST (UTC+5:30) for date conversion since users work in IST.
    """
    from datetime import datetime
    if year is None:
        year = datetime.now().year
    if month is None:
        month = datetime.now().month

    cn = get_db_connection()
    try:
        cur = cn.cursor(dictionary=True)
        cur.execute("""
            SELECT
                DAY(CONVERT_TZ(analysis_date, '+00:00', '+05:30')) as day,
                COUNT(DISTINCT CONCAT(train_number, '|', date_of_working, '|', from_station, '|', to_station)) as count
            FROM div_sub_spm_runs
            WHERE YEAR(CONVERT_TZ(analysis_date, '+00:00', '+05:30')) = %s
              AND MONTH(CONVERT_TZ(analysis_date, '+00:00', '+05:30')) = %s
            GROUP BY DAY(CONVERT_TZ(analysis_date, '+00:00', '+05:30'))
            ORDER BY day
        """, (year, month))
        results = cur.fetchall()
        cur.close()
        return results
    finally:
        cn.close()


def get_month_comparison() -> Dict[str, Any]:
    """
    Compare current month's unique run count (up to today's date)
    with last month's same period.
    Uses IST (UTC+5:30) for date conversion since users work in IST.
    """
    cn = get_db_connection()
    try:
        cur = cn.cursor(dictionary=True)

        # Current month unique runs (up to today) - using IST
        cur.execute("""
            SELECT COUNT(DISTINCT CONCAT(train_number, '|', date_of_working, '|', from_station, '|', to_station)) as count
            FROM div_sub_spm_runs
            WHERE YEAR(CONVERT_TZ(analysis_date, '+00:00', '+05:30')) = YEAR(CURDATE())
              AND MONTH(CONVERT_TZ(analysis_date, '+00:00', '+05:30')) = MONTH(CURDATE())
              AND DAY(CONVERT_TZ(analysis_date, '+00:00', '+05:30')) <= DAY(CURDATE())
        """)
        current_result = cur.fetchone()
        current_count = current_result['count'] if current_result else 0

        # Last month same period unique runs (up to same day number) - using IST
        cur.execute("""
            SELECT COUNT(DISTINCT CONCAT(train_number, '|', date_of_working, '|', from_station, '|', to_station)) as count
            FROM div_sub_spm_runs
            WHERE YEAR(CONVERT_TZ(analysis_date, '+00:00', '+05:30')) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
              AND MONTH(CONVERT_TZ(analysis_date, '+00:00', '+05:30')) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
              AND DAY(CONVERT_TZ(analysis_date, '+00:00', '+05:30')) <= DAY(CURDATE())
        """)
        last_result = cur.fetchone()
        last_count = last_result['count'] if last_result else 0

        cur.close()

        difference = current_count - last_count
        return {
            "current_month": current_count,
            "last_month_same_period": last_count,
            "difference": difference
        }
    finally:
        cn.close()


def get_not_analyzed_15_days() -> List[Dict[str, Any]]:
    """
    Get list of motormen not analyzed in last 15 days.
    Only includes motormen who have been analyzed at least once.
    """
    cn = get_db_connection()
    try:
        cur = cn.cursor(dictionary=True)

        query = """
            SELECT
                sm.hrms_id,
                sm.name as motorman_name,
                sm.current_cms_id as cms_id,
                a.last_analysis,
                DATEDIFF(CURDATE(), a.last_analysis) as days_since,
                a.last_train,
                a.analysis_count
            FROM div_staff_master sm
            INNER JOIN (
                SELECT
                    motorman_hrms_id,
                    MAX(analysis_date) as last_analysis,
                    COUNT(*) as analysis_count,
                    (SELECT train_number FROM div_sub_spm_runs
                     WHERE motorman_hrms_id = r.motorman_hrms_id
                     ORDER BY analysis_date DESC LIMIT 1) as last_train
                FROM div_sub_spm_runs r
                GROUP BY motorman_hrms_id
            ) a ON sm.hrms_id = a.motorman_hrms_id
            WHERE sm.designation_id = 8
              AND sm.status = 'Active'
              AND DATEDIFF(CURDATE(), a.last_analysis) > 15
            ORDER BY days_since DESC
        """

        cur.execute(query)
        results = cur.fetchall()
        cur.close()
        return results
    finally:
        cn.close()

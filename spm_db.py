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

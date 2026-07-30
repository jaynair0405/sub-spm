"""
Shape a stored run into the flat dict the PDF renderer consumes.

Pure functions only — no FastAPI, no database, no matplotlib. That makes the whole
report reproducible from a pickled fixture, which is how the layout gets iterated
without running the server (see scripts/render_sample_pdf.py).

Several helpers here are ports of JavaScript in ui/spm.html. The screen remains the
specification of record, so each port names the exact line range it mirrors. If you
change one side, change the other.
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple

# Thresholds for the platform-entry exception table (ui/spm.html:1080-1089).
PF_ENTRY_LIMIT = 45
MID_PF_LIMIT = 30
ONE_COACH_LIMIT = 15

# Speed at or below which a station dot is drawn green (ui/spm.html:2211).
STATION_LINE_SPEED_THRESHOLD = 45

_SHEDS_CACHE: Optional[Dict[str, Any]] = None


# --- ports of ui/spm.html helpers --------------------------------------------

def get_rake_type(unit_number: Any) -> Optional[str]:
    """Port of getRakeType (ui/spm.html:1872-1886)."""
    try:
        num = int(str(unit_number).strip())
    except (TypeError, ValueError):
        return None

    if 240000 <= num <= 249999:
        return "Alstom"
    if 8000 <= num <= 8099:
        return "Medha U/S"
    if (1000 <= num <= 2999) or (10000 <= num <= 23999) or (25000 <= num <= 29999):
        return "Siemens"
    if 4000 <= num <= 4999:
        return "AC Retro"
    if 5000 <= num <= 5999:
        return "Bombardier"
    if 6000 <= num <= 6999:
        return "Medha"
    if 7000 <= num <= 7999:
        return "AC BHEL"
    return None


def load_sheds(reference_data_dir: Path) -> Dict[str, Any]:
    """Read reference_data/sheds.json once and memoise it."""
    global _SHEDS_CACHE
    if _SHEDS_CACHE is None:
        path = Path(reference_data_dir) / "sheds.json"
        try:
            _SHEDS_CACHE = json.loads(path.read_text())
        except (OSError, ValueError):
            _SHEDS_CACHE = {}
    return _SHEDS_CACHE


def get_shed_from_unit(unit_number: Any, sheds: Dict[str, Any]) -> Optional[str]:
    """
    Port of getShedFromUnit (ui/spm.html:1889-1904).

    sheds.json is {shed: {rake_type: ["6001-6002-6003-6004", ...]}}; a unit matches
    when it appears as one of the hyphen-separated coach numbers.
    """
    if not sheds or not unit_number:
        return None
    unit_str = str(unit_number).strip()

    for shed_name, rake_types in sheds.items():
        for rakes in (rake_types or {}).values():
            for rake in rakes or []:
                if unit_str in str(rake).split("-"):
                    return shed_name
    return None


def get_unit_rake_shed_string(unit_number: Any, sheds: Dict[str, Any]) -> str:
    """Port of getUnitRakeShedString (ui/spm.html:1907-1912)."""
    if not unit_number:
        return "-"
    rake_type = get_rake_type(unit_number) or "Unknown"
    shed = get_shed_from_unit(unit_number, sheds) or "Unknown"
    return f"{unit_number}/{rake_type}/{shed}"


def get_train_service(train_number: Any, train_type: Optional[str] = None) -> str:
    """
    Fast / Slow / THB for the "Train Service" metadata field.

    DELIBERATE DIVERGENCE from getTrainService (ui/spm.html:1915-1927). The JS tests
    whether the *train number* starts with "95" — but train numbers are values like
    "A 59" and "TL 20"; the 95xxx values are train *codes*. So the screen labels
    A 59 as "Slow" when it is in fact a fast service (code 95335).

    The server already resolves this correctly: corridor_manager derives train_type
    from the code prefix against FAST_PREFIXES, which is the same logic that decides
    which corridor the analysis runs against. Prefer it, and only fall back to the
    JS rule when train_type is absent.
    """
    if train_type:
        t = str(train_type).strip().lower()
        if t == "fast":
            return "Fast"
        if t == "thb":
            return "Trans-Harbour"
        if t == "slow":
            return "Slow"

    if not train_number:
        return "Unknown"
    return "Fast" if str(train_number).strip().startswith("95") else "Slow"


def normalise_distances(
    values: Sequence[Any], threshold: float = 200.0
) -> Tuple[List[float], bool]:
    """
    Convert cumulative distances to km, sniffing whether they arrived in metres.

    The JS repeats this per chart with a max() test — ui/spm.html:2344-2349 (main),
    1298-1301 (segments), 1642-1646 (brake feel) all use 200, while the platform
    entry renderer at 1440-1441 uses **100**. The thresholds genuinely differ; do
    not harmonise them or short runs mis-scale.

    Returns (values_in_km, was_in_metres).
    """
    nums = [float(v) for v in values if v is not None]
    if not nums:
        return [], False
    in_metres = max(nums) > threshold
    divisor = 1000.0 if in_metres else 1.0
    return [float(v or 0.0) / divisor for v in values], in_metres


# --- report assembly ---------------------------------------------------------

def build_pf_exceptions(station_markers: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    """
    Port of renderExceptionsTable (ui/spm.html:1071-1107).

    Three independent lists, later zipped by row index with "-" padding — so a row
    does not represent one station, it represents one *index* across three lists.
    Preserved deliberately: it is what the screen shows.
    """
    pf: List[str] = []
    mid: List[str] = []
    one: List[str] = []

    for marker in station_markers or []:
        station = marker.get("station", "")
        entry = marker.get("platform_entry_speed")
        mid_pf = marker.get("mid_platform_speed")
        one_coach = marker.get("one_coach_speed")

        if entry is not None and entry > PF_ENTRY_LIMIT:
            pf.append(f"{station} · {entry} km/h")
        if mid_pf is not None and mid_pf > MID_PF_LIMIT:
            mid.append(f"{station} · {mid_pf} km/h")
        if one_coach is not None and one_coach > ONE_COACH_LIMIT:
            one.append(f"{station} · {one_coach} km/h")

    return {"pf": pf, "mid": mid, "one": one}


def build_bft_rows(
    brake_tests: List[Dict[str, Any]], samples: List[Dict[str, Any]]
) -> Tuple[List[Tuple[str, str]], str]:
    """
    Port of renderTripSummary's brake-feel block (ui/spm.html:1735-1755).

    Returns (label/value rows, observation string).
    """
    first_ts = (samples[0].get("timestamp") if samples else None) or "-"

    if not brake_tests:
        observation = "No brake feel test detected"
        return (
            [
                ("Train start time", first_ts),
                ("Test time", "-"),
                ("Test speed", "-"),
                ("Speed dropped to", "-"),
                ("Observation", observation),
            ],
            observation,
        )

    test = brake_tests[0]
    idx = test.get("max_speed_index")
    if idx is None or idx >= len(samples):
        idx = test.get("braking_start_index")
    start_sample = samples[idx] if idx is not None and 0 <= idx < len(samples) else {}

    braking_speed = test.get("braking_start_speed")
    lowest = test.get("lowest_speed")
    observation = "Brake feel test detected"

    return (
        [
            ("Train start time", first_ts),
            ("Test time", start_sample.get("timestamp") or "-"),
            ("Test speed", f"{braking_speed} km/h" if braking_speed is not None else "-"),
            ("Speed dropped to", f"{lowest} km/h" if lowest is not None else "-"),
            ("Observation", observation),
        ],
        observation,
    )


def build_station_line(
    station_markers: List[Dict[str, Any]], samples: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Port of the stationHaltData mapping (ui/spm.html:2317-2331).

    Uses raw cumulative_distance — the renderer scales by max, so units cancel.
    Falls back to the sample's own speed when platform_entry_speed is absent.
    """
    out: List[Dict[str, Any]] = []
    for marker in station_markers or []:
        idx = marker.get("sample_index")
        sample = samples[idx] if idx is not None and 0 <= idx < len(samples) else None
        speed = marker.get("platform_entry_speed")
        if speed is None:
            speed = sample.get("speed", 0) if sample else 0
        distance = sample.get("cumulative_distance", 0) if sample else 0
        if distance is None or distance < 0:
            continue
        out.append({
            "station": marker.get("station", ""),
            "distance": float(distance),
            "speed": float(speed or 0),
        })
    return out


def _format_working_date(value: Any) -> str:
    """YYYY-MM-DD -> dd/mm/yyyy, matching ui/spm.html:2648-2656."""
    if not value:
        return "-"
    text = str(value)
    try:
        return datetime.strptime(text[:10], "%Y-%m-%d").strftime("%d/%m/%Y")
    except ValueError:
        return text


def build_report_model(
    meta: Dict[str, Any],
    payload: Dict[str, Any],
    *,
    analysis_dt: datetime,
    reference_data_dir: Path,
) -> Dict[str, Any]:
    """
    Combine a run_store meta dict and a build_chart_payload result into the flat
    structure pdf_report.build_report_pdf consumes.

    `analysis_dt` must already be in IST — the caller owns timezone conversion.
    """
    samples = payload.get("samples") or []
    station_markers = payload.get("station_markers") or []
    sheds = load_sheds(reference_data_dir)

    total_distance = meta.get("total_distance")
    if total_distance is not None:
        total_distance = float(total_distance)
        # ui/spm.html:2692 applies the same >200 sniff to this single scalar.
        if total_distance > 200:
            total_distance /= 1000.0
        distance_text = f"{total_distance:.2f} km"
    else:
        distance_text = "-"

    max_speed = meta.get("max_speed")
    train_number = meta.get("train_number") or "-"
    service = get_train_service(train_number, meta.get("train_type"))

    # Order matches the on-screen .meta-grid exactly (ui/spm.html:900-951).
    meta_items: List[Tuple[str, str]] = [
        ("Date of Working", _format_working_date(meta.get("date_of_working"))),
        ("Train Service", f"{train_number} / {service}"),
        ("LP / Staff Name", meta.get("motorman_name") or "-"),
        ("Nominated CLI", meta.get("nominated_cli_name") or "Not Assigned"),
        ("Departure", meta.get("start_time") or "-"),
        ("Arrival", meta.get("end_time") or "-"),
        ("Total Distance", distance_text),
        ("Running Time", meta.get("duration") or "-"),
        ("Route", f"{meta.get('from_station') or '-'} ➝ {meta.get('to_station') or '-'}"),
        ("Unit / Rake / Shed", get_unit_rake_shed_string(meta.get("unit_number"), sheds)),
        ("Max Speed", f"{max_speed:g} km/h" if max_speed is not None else "-"),
        ("Analysed By", meta.get("analysed_by_name") or "Admin"),
    ]

    bft_rows, bft_observation = build_bft_rows(payload.get("brake_tests") or [], samples)
    abnormality_text = meta.get("abnormality_text") or "-"

    reanalysis = None
    if meta.get("existing_run_id"):
        reanalysis = {"prev_analysis_date": meta.get("existing_analysis_date") or "-"}

    return {
        "run_id": meta.get("run_id"),
        "letterhead": {"analysis_date": analysis_dt.strftime("%d/%m/%Y")},
        "reanalysis": reanalysis,
        "meta_items": meta_items,
        "station_line": build_station_line(station_markers, samples),
        "samples": samples,
        "station_markers": station_markers,
        "brake_tests": payload.get("brake_tests") or [],
        "platform_entry_data": payload.get("platform_entry_data") or {},
        "violations": payload.get("violations") or [],
        "overspeed_events": payload.get("overspeed_events") or [],
        "overspeed_summary": payload.get("overspeed_summary") or {},
        "first_halt_index": payload.get("first_halt_index"),
        "pf_exceptions": build_pf_exceptions(station_markers),
        "bft_rows": bft_rows,
        "bft_observation": bft_observation,
        "abnormality_text": abnormality_text,
        "abnormality_is_clean": abnormality_text.strip() == "NO ABNORMALITY",
        "footer": {
            "left": "@CR Sr.DEE TRSO-BB Division",
            "center": "Analyzed: " + analysis_dt.strftime("%d/%m/%Y, %I:%M %p").lower()
                      .replace("am", "am").replace("pm", "pm"),
            "right": "Developed by Jayakumar M D Mman Kyn",
        },
    }

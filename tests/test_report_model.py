"""Tests for report_model — especially the helpers ported from ui/spm.html."""

from datetime import datetime
from pathlib import Path

import pytest

import report_model as rm


# --- get_rake_type (ui/spm.html:1872-1886) -----------------------------------

@pytest.mark.parametrize("unit,expected", [
    (240000, "Alstom"), (249999, "Alstom"),
    (8000, "Medha U/S"), (8099, "Medha U/S"),
    (1000, "Siemens"), (2999, "Siemens"),
    (10000, "Siemens"), (23999, "Siemens"),
    (25000, "Siemens"), (29999, "Siemens"),
    (4000, "AC Retro"), (4999, "AC Retro"),
    (5000, "Bombardier"), (5999, "Bombardier"),
    (6000, "Medha"), (6999, "Medha"),
    (7000, "AC BHEL"), (7999, "AC BHEL"),
])
def test_rake_type_ranges(unit, expected):
    assert rm.get_rake_type(unit) == expected


@pytest.mark.parametrize("unit", [999, 3000, 3999, 9000, 250000, None, "", "abc"])
def test_rake_type_outside_ranges(unit):
    assert rm.get_rake_type(unit) is None


def test_rake_type_accepts_string_and_whitespace():
    assert rm.get_rake_type(" 6001 ") == "Medha"


# --- get_shed_from_unit (ui/spm.html:1889-1904) ------------------------------

SHEDS = {"NCS": {"medha": ["6001-6002-6003-6004", "6005-6006-6007-6008"]},
         "KCS": {"siemens": ["1001-1002-1003-1004"]}}


def test_shed_matches_any_coach_in_the_rake():
    assert rm.get_shed_from_unit("6003", SHEDS) == "NCS"
    assert rm.get_shed_from_unit("6008", SHEDS) == "NCS"
    assert rm.get_shed_from_unit("1002", SHEDS) == "KCS"


def test_shed_requires_a_whole_coach_match_not_a_substring():
    """600 must not match inside 6001 — the JS splits on '-' and compares whole values."""
    assert rm.get_shed_from_unit("600", SHEDS) is None


def test_shed_missing_returns_none():
    assert rm.get_shed_from_unit("9999", SHEDS) is None
    assert rm.get_shed_from_unit("6001", {}) is None
    assert rm.get_shed_from_unit(None, SHEDS) is None


def test_unit_rake_shed_string():
    assert rm.get_unit_rake_shed_string("6001", SHEDS) == "6001/Medha/NCS"
    assert rm.get_unit_rake_shed_string("9999", SHEDS) == "9999/Unknown/Unknown"
    assert rm.get_unit_rake_shed_string("", SHEDS) == "-"


# --- get_train_service -------------------------------------------------------

def test_train_service_prefers_server_train_type():
    """
    The screen's getTrainService tests the train NUMBER for a '95' prefix, but 95xxx
    values are train CODES. A 59 is a fast service (code 95335) that the JS labels
    Slow. The PDF uses the server's train_type instead.
    """
    assert rm.get_train_service("A 59", "fast") == "Fast"
    assert rm.get_train_service("A 59", None) == "Slow"     # the JS behaviour
    assert rm.get_train_service("TL 20", "fast") == "Fast"


def test_train_service_maps_all_train_types():
    assert rm.get_train_service("X", "slow") == "Slow"
    assert rm.get_train_service("X", "thb") == "Trans-Harbour"
    assert rm.get_train_service("X", "FAST") == "Fast"


def test_train_service_falls_back_to_number_prefix():
    assert rm.get_train_service("95101", None) == "Fast"
    assert rm.get_train_service("96341", None) == "Slow"
    assert rm.get_train_service(None, None) == "Unknown"


# --- normalise_distances -----------------------------------------------------

def test_metre_sniff_boundary_at_200():
    """>200 means metres. 200 exactly is treated as km."""
    km, was_m = rm.normalise_distances([0, 199.0])
    assert was_m is False and km[1] == 199.0

    km, was_m = rm.normalise_distances([0, 200.0])
    assert was_m is False and km[1] == 200.0

    km, was_m = rm.normalise_distances([0, 201.0])
    assert was_m is True and km[1] == pytest.approx(0.201)


def test_platform_entry_uses_a_100_threshold():
    """ui/spm.html:1440 sniffs at 100, not 200. The difference is deliberate."""
    _, was_m = rm.normalise_distances([0, 150.0], threshold=100.0)
    assert was_m is True

    _, was_m = rm.normalise_distances([0, 150.0], threshold=200.0)
    assert was_m is False


def test_normalise_handles_empty_and_none():
    assert rm.normalise_distances([]) == ([], False)
    km, _ = rm.normalise_distances([None, 10.0])
    assert km[0] == 0.0


# --- build_pf_exceptions (ui/spm.html:1071-1107) -----------------------------

def _marker(station, entry=None, mid=None, one=None):
    return {"station": station, "platform_entry_speed": entry,
            "mid_platform_speed": mid, "one_coach_speed": one}


def test_pf_exceptions_thresholds_are_strict():
    markers = [_marker("A", entry=45, mid=30, one=15),      # all exactly at limit
               _marker("B", entry=46, mid=31, one=16)]      # all over
    ex = rm.build_pf_exceptions(markers)

    assert ex["pf"] == ["B · 46 km/h"]
    assert ex["mid"] == ["B · 31 km/h"]
    assert ex["one"] == ["B · 16 km/h"]


def test_pf_exceptions_lists_are_independent():
    """Lists are built separately then zipped by index — a row is not one station."""
    markers = [_marker("A", entry=50), _marker("B", mid=40), _marker("C", one=20)]
    ex = rm.build_pf_exceptions(markers)

    assert ex["pf"] == ["A · 50 km/h"]
    assert ex["mid"] == ["B · 40 km/h"]
    assert ex["one"] == ["C · 20 km/h"]


def test_pf_exceptions_ignores_none_speeds():
    assert rm.build_pf_exceptions([_marker("A")]) == {"pf": [], "mid": [], "one": []}
    assert rm.build_pf_exceptions([]) == {"pf": [], "mid": [], "one": []}


# --- build_bft_rows ----------------------------------------------------------

SAMPLES = [{"timestamp": "14:48:52"}, {"timestamp": "14:49:00"}, {"timestamp": "14:50:00"}]


def test_bft_rows_when_test_detected():
    tests = [{"max_speed_index": 2, "braking_start_index": 1,
              "braking_start_speed": 62.0, "lowest_speed": 30.0}]
    rows, observation = rm.build_bft_rows(tests, SAMPLES)

    assert observation == "Brake feel test detected"
    assert dict(rows)["Train start time"] == "14:48:52"
    assert dict(rows)["Test time"] == "14:50:00"       # from max_speed_index
    assert dict(rows)["Test speed"] == "62.0 km/h"
    assert dict(rows)["Speed dropped to"] == "30.0 km/h"


def test_bft_rows_when_no_test():
    rows, observation = rm.build_bft_rows([], SAMPLES)

    assert observation == "No brake feel test detected"
    assert dict(rows)["Train start time"] == "14:48:52"
    assert dict(rows)["Test time"] == "-"


def test_bft_rows_survive_out_of_range_index():
    """A stale index must not IndexError the whole report."""
    tests = [{"max_speed_index": 999, "braking_start_index": 1, "lowest_speed": 20}]
    rows, _ = rm.build_bft_rows(tests, SAMPLES)
    assert dict(rows)["Test time"] == "14:49:00"


def test_bft_rows_with_no_samples():
    rows, _ = rm.build_bft_rows([], [])
    assert dict(rows)["Train start time"] == "-"


# --- build_station_line ------------------------------------------------------

def test_station_line_falls_back_to_sample_speed():
    samples = [{"cumulative_distance": 0.0, "speed": 12.0},
               {"cumulative_distance": 500.0, "speed": 40.0}]
    markers = [{"station": "TNA", "sample_index": 0, "platform_entry_speed": None},
               {"station": "KYN", "sample_index": 1, "platform_entry_speed": 38.0}]

    line = rm.build_station_line(markers, samples)

    assert line[0] == {"station": "TNA", "distance": 0.0, "speed": 12.0}
    assert line[1] == {"station": "KYN", "distance": 500.0, "speed": 38.0}


# --- build_report_model ------------------------------------------------------

def _minimal(meta_over=None, payload_over=None):
    meta = {"run_id": "R1", "train_number": "A 59", "train_type": "fast",
            "date_of_working": "2025-11-30", "from_station": "TNA", "to_station": "KYN",
            "unit_number": "6001", "max_speed": 100.0, "total_distance": 20151.0,
            "start_time": "14:48:52", "end_time": "15:19:49", "duration": "00:30:57",
            "abnormality_text": "NO ABNORMALITY"}
    meta.update(meta_over or {})
    payload = {"samples": SAMPLES, "station_markers": [], "brake_tests": []}
    payload.update(payload_over or {})
    return meta, payload


def _model(meta_over=None, payload_over=None):
    meta, payload = _minimal(meta_over, payload_over)
    return rm.build_report_model(meta, payload,
                                 analysis_dt=datetime(2026, 7, 29, 16, 12),
                                 reference_data_dir=Path("reference_data"))


def test_model_meta_grid_order_matches_the_screen():
    labels = [label for label, _ in _model()["meta_items"]]
    assert labels == [
        "Date of Working", "Train Service", "LP / Staff Name", "Nominated CLI",
        "Departure", "Arrival", "Total Distance", "Running Time",
        "Route", "Unit / Rake / Shed", "Max Speed", "Analysed By",
    ]


def test_model_total_distance_metre_sniff():
    assert dict(_model()["meta_items"])["Total Distance"] == "20.15 km"
    assert dict(_model({"total_distance": 150.0})["meta_items"])["Total Distance"] == "150.00 km"


def test_model_abnormality_clean_flag():
    assert _model()["abnormality_is_clean"] is True
    assert _model({"abnormality_text": "PSR VIOLATION AT TNA"})["abnormality_is_clean"] is False


def test_model_reanalysis_banner_only_when_duplicate():
    assert _model()["reanalysis"] is None
    m = _model({"existing_run_id": "R0", "existing_analysis_date": "15-07-2026 10:22"})
    assert m["reanalysis"]["prev_analysis_date"] == "15-07-2026 10:22"


def test_model_handles_missing_optional_fields():
    """Degenerate meta must produce a model, not an exception."""
    model = rm.build_report_model({"run_id": "R1"}, {"samples": [], "station_markers": []},
                                  analysis_dt=datetime(2026, 7, 29, 16, 12),
                                  reference_data_dir=Path("reference_data"))
    values = dict(model["meta_items"])
    assert values["Total Distance"] == "-"
    assert values["Max Speed"] == "-"
    assert values["Nominated CLI"] == "Not Assigned"

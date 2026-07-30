"""Tests for pdf_report — chart renderers and document assembly."""

import gzip
import json
from datetime import datetime
from pathlib import Path

import pytest

import pdf_report as pr
from report_model import build_report_model

ROOT = Path(__file__).resolve().parent.parent
FIXTURES = ROOT / "tests" / "fixtures"
PNG_MAGIC = b"\x89PNG"


def _fixture(name):
    """Load a captured (meta, payload) pair. See tests/fixtures/README.md."""
    path = FIXTURES / f"report_fixture_{name}.json.gz"
    if not path.exists():
        pytest.skip(f"fixture missing: {path}")
    return json.loads(gzip.decompress(path.read_bytes()))


def _model(name="small"):
    data = _fixture(name)
    return build_report_model(data["meta"], data["payload"],
                              analysis_dt=datetime(2026, 7, 29, 16, 12),
                              reference_data_dir=ROOT / "reference_data")


# --- build_station_groups: the port most likely to drift ---------------------

def _markers(n):
    return [{"station": f"S{i}", "sample_index": i * 100} for i in range(n)]


@pytest.mark.parametrize("count,expected_groups", [
    (0, 0), (1, 0),      # a single station cannot form a segment
    (2, 1), (5, 1),
    (6, 2), (9, 2),
    (11, 3), (12, 3),
    (19, 5),             # matches the large fixture
])
def test_station_group_counts(count, expected_groups):
    assert len(pr.build_station_groups(_markers(count))) == expected_groups


def test_consecutive_groups_share_one_station():
    """The stride is chunk_size - 1, so each group overlaps the next by one."""
    groups = pr.build_station_groups(_markers(9))
    assert groups[0][-1]["station"] == groups[1][0]["station"]


def test_groups_are_sorted_by_sample_index():
    shuffled = [{"station": "C", "sample_index": 300},
                {"station": "A", "sample_index": 100},
                {"station": "B", "sample_index": 200}]
    groups = pr.build_station_groups(shuffled)
    assert [m["station"] for m in groups[0]] == ["A", "B", "C"]


def test_trailing_single_station_is_merged_backwards():
    for count in range(2, 25):
        groups = pr.build_station_groups(_markers(count))
        assert all(len(g) >= 2 for g in groups), f"count={count} produced a 1-station group"


# --- renderers return real PNGs ----------------------------------------------

def test_station_line_renders():
    model = _model()
    buf = pr.render_station_line(model["station_line"])
    assert buf.getvalue().startswith(PNG_MAGIC)


def test_speed_profile_renders():
    m = _model()
    buf = pr.render_speed_profile(m["samples"], m["station_markers"],
                                  m["brake_tests"], m["violations"])
    assert buf.getvalue().startswith(PNG_MAGIC)


def test_segment_charts_render_with_captions():
    m = _model("large")
    charts = pr.render_segment_charts(m["samples"], m["station_markers"], m["brake_tests"])
    assert len(charts) == 5
    for caption, buf in charts:
        assert "→" in caption
        assert buf.getvalue().startswith(PNG_MAGIC)
    assert charts[0][0].startswith("1. ")


def test_platform_entry_charts_render():
    m = _model("large")
    charts = pr.render_platform_entry_charts(m["samples"], m["station_markers"],
                                             m["platform_entry_data"])
    assert len(charts) >= 1
    for _, buf in charts:
        assert buf.getvalue().startswith(PNG_MAGIC)


def test_brake_feel_chart_renders():
    m = _model()
    buf = pr.render_brake_feel_chart(m["samples"], m["brake_tests"], m["first_halt_index"])
    assert buf.getvalue().startswith(PNG_MAGIC)


def test_platform_entry_ignores_zero_entry_speed():
    """
    main.py adds a synthetic start-station marker with platform_entry_speed 0.0;
    the JS filters it on `!== 0` and so must the renderer.
    """
    samples = [{"cumulative_distance": i, "speed": 30.0} for i in range(300)]
    markers = [{"station": "SYNTH", "sample_index": 0, "platform_entry_speed": 0.0}]
    entry = {"SYNTH": {"halt_distance": 0.2, "entry_distance": 0.05}}
    assert pr.render_platform_entry_charts(samples, markers, entry) == []


# --- document assembly --------------------------------------------------------

def test_build_report_pdf_produces_a_pdf():
    pdf = pr.build_report_pdf(_model())
    assert pdf.startswith(b"%PDF")
    assert len(pdf) > 10_000


def test_large_report_has_more_pages_than_small():
    small = pr.build_report_pdf(_model("small"))
    large = pr.build_report_pdf(_model("large"))
    assert large.count(b"/Type /Page") >= small.count(b"/Type /Page")


def test_dejavu_font_is_registered():
    """Without it the ➝ in Route and segment captions renders as a black box."""
    pr._register_fonts()
    assert pr._FONTS_READY, "DejaVu registration failed; arrows will not render"
    assert pr.FONT == "SPMSans"


# --- degenerate inputs must degrade, not explode ------------------------------

EMPTY_MODEL = {
    "run_id": "R0",
    "letterhead": {"analysis_date": "29/07/2026"},
    "reanalysis": None,
    "meta_items": [("Date of Working", "-"), ("Train Service", "-")],
    "station_line": [], "samples": [], "station_markers": [], "brake_tests": [],
    "platform_entry_data": {}, "violations": [], "overspeed_events": [],
    "overspeed_summary": {}, "first_halt_index": None,
    "pf_exceptions": {"pf": [], "mid": [], "one": []},
    "bft_rows": [("Train start time", "-")],
    "bft_observation": "No brake feel test detected",
    "abnormality_text": "NO ABNORMALITY", "abnormality_is_clean": True,
    "footer": {"left": "L", "center": "C", "right": "R"},
}


def test_pdf_with_no_data_at_all():
    pdf = pr.build_report_pdf(dict(EMPTY_MODEL))
    assert pdf.startswith(b"%PDF")


def test_renderers_tolerate_empty_samples():
    assert pr.render_station_line([]) is None
    assert pr.render_speed_profile([], [], [], []) is None
    assert pr.render_segment_charts([], [], []) == []
    assert pr.render_platform_entry_charts([], [], {}) == []
    assert pr.render_brake_feel_chart([], [], None) is None


def test_pdf_without_psr_column():
    m = _model()
    for s in m["samples"]:
        s.pop("psr", None)
    assert pr.build_report_pdf(m).startswith(b"%PDF")


def test_pdf_with_no_brake_test():
    m = _model()
    m["brake_tests"] = []
    m["bft_observation"] = "No brake feel test detected"
    assert pr.build_report_pdf(m).startswith(b"%PDF")


def test_pdf_with_violations_and_overspeed_events():
    """Exercises the severity-coloured rows and the TOTAL row."""
    m = _model()
    m["overspeed_events"] = [
        {"event_number": 1, "start_time": "10:00:00", "end_time": "10:00:12",
         "start_km": 1.2, "end_km": 1.6, "max_speed": 88, "psr_value": 60,
         "max_excess": 28, "severity": "critical"},
        {"event_number": 2, "start_time": "10:05:00", "end_time": "10:05:09",
         "start_km": 4.2, "end_km": 4.4, "max_speed": 68, "psr_value": 60,
         "max_excess": 8, "severity": "minor"},
    ]
    m["overspeed_summary"] = {"total_events": 2, "max_speed_overall": 88,
                              "max_excess_overall": 28,
                              "by_severity": {"critical": 1, "severe": 0,
                                              "moderate": 0, "minor": 1}}
    assert pr.build_report_pdf(m).startswith(b"%PDF")


def test_pdf_with_pf_exceptions_of_unequal_lengths():
    """The three lists zip by index with '-' padding; uneven lengths must not crash."""
    m = _model()
    m["pf_exceptions"] = {"pf": ["A · 50 km/h", "B · 48 km/h"],
                          "mid": ["A · 33 km/h"],
                          "one": []}
    assert pr.build_report_pdf(m).startswith(b"%PDF")


def test_pdf_with_reanalysis_banner():
    m = _model()
    m["reanalysis"] = {"prev_analysis_date": "15-07-2026 10:22"}
    assert pr.build_report_pdf(m).startswith(b"%PDF")


def test_pdf_with_multiline_abnormality():
    m = _model()
    m["abnormality_text"] = "PSR VIOLATION AT TNA\nPF ENTRY HIGH AT KYN"
    m["abnormality_is_clean"] = False
    assert pr.build_report_pdf(m).startswith(b"%PDF")

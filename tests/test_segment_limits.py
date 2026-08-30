"""Structural checks on the PSR/MPS segment limit files.

These guard the invariant that get_speed_limit() in psr_mps.py depends on:
every segment must be covered from 0.0 to 1.0 by contiguous ranges. That
function walks the ranges and returns the *first* one containing the
position, with a fallthrough only for the last range -- so a gap silently
yields no speed limit (no PSR line, no violation ever flagged over that
stretch), and an overlap silently hands the earlier range priority,
truncating the later one.

Both failure modes were live in production and invisible until someone
diffed the numbers by hand: OMB-KE and ASO-VSD each had a range starting
before the previous one ended, and SNPD-VSH had a range running to 1.0 that
swallowed the two after it.
"""

import json
from pathlib import Path

import pytest

REFERENCE_DATA = Path(__file__).resolve().parents[1] / "reference_data"
SEGMENT_FILES = ["fast_segments.json", "slow_segments.json", "thb_segments.json"]

# Ranges are authored to 1-2 decimal places, so compare with a tolerance well
# below that rather than trusting float equality.
TOL = 1e-9


def load(filename):
    with open(REFERENCE_DATA / filename) as fh:
        return json.load(fh)


@pytest.fixture(scope="module", params=SEGMENT_FILES)
def segment_file(request):
    return request.param, load(request.param)


def test_segments_are_well_formed(segment_file):
    """Each segment has a name and at least one limit range."""
    filename, segments = segment_file
    assert segments, f"{filename} is empty"

    for i, seg in enumerate(segments):
        assert seg.get("segment"), f"{filename}[{i}] has no segment name"
        assert seg.get("limits"), f"{filename} {seg.get('segment')} has no limits"


def test_ranges_are_ordered_and_positive(segment_file):
    """startPct < endPct, and limit is a positive speed."""
    filename, segments = segment_file

    for seg in segments:
        for r in seg["limits"]:
            where = f"{filename} {seg['segment']} {r['startPct']}-{r['endPct']}"
            assert r["startPct"] < r["endPct"], f"{where}: range is empty or reversed"
            assert r["limit"] > 0, f"{where}: limit must be positive"


def test_segments_span_zero_to_one(segment_file):
    """Coverage starts at 0.0 and reaches 1.0.

    A segment starting above 0.0 leaves its opening stretch with no limit;
    one ending below 1.0 is saved only by get_speed_limit()'s last-range
    fallthrough, which is a coincidence rather than a guarantee.
    """
    filename, segments = segment_file
    bad = []

    for seg in segments:
        limits = seg["limits"]
        if abs(limits[0]["startPct"]) > TOL:
            bad.append(f"{seg['segment']} starts at {limits[0]['startPct']}")
        if abs(limits[-1]["endPct"] - 1.0) > TOL:
            bad.append(f"{seg['segment']} ends at {limits[-1]['endPct']}")

    assert not bad, f"{filename}: segments not spanning 0.0-1.0: " + "; ".join(bad)


def test_ranges_are_contiguous(segment_file):
    """No gaps and no overlaps between consecutive ranges.

    This is the check that would have caught the OMB-KE, ASO-VSD and
    MBQ-KLVA overlaps, and the SNPD-VSH range that ran to 1.0.
    """
    filename, segments = segment_file
    bad = []

    for seg in segments:
        for a, b in zip(seg["limits"], seg["limits"][1:]):
            if abs(a["endPct"] - b["startPct"]) > TOL:
                kind = "gap" if b["startPct"] > a["endPct"] else "overlap"
                bad.append(
                    f"{seg['segment']}: {kind} -- range ends {a['endPct']}, "
                    f"next starts {b['startPct']}"
                )

    assert not bad, f"{filename}: " + "; ".join(bad)


def test_report_duplicate_segment_names(segment_file, capsys):
    """Report duplicated names -- informational, never fails.

    Duplicates are expected and legitimate. fast_segments.json holds the 32
    genuine fast-corridor segments (CSMT-Kalyan, where fast and slow run on
    separate tracks) followed by slow-line definitions covering the Kasara
    and Karjat sections, where there is no separate fast track and fast
    trains need those limits. Where a name appears twice the lookup takes
    the first, which is the fast one -- so the correct definition wins.

    Printed rather than asserted because the counts are load-bearing data,
    not a defect: deleting the extras would leave fast trains with no limits
    beyond Kalyan.
    """
    filename, segments = segment_file
    seen = {}
    for seg in segments:
        seen.setdefault(seg["segment"], []).append(seg["limits"])

    disagreeing = [n for n, defs in seen.items() if len(defs) > 1 and any(d != defs[0] for d in defs)]
    identical = [n for n, defs in seen.items() if len(defs) > 1 and all(d == defs[0] for d in defs)]

    with capsys.disabled():
        print(
            f"\n{filename}: {len(segments)} segments, "
            f"{len(disagreeing)} duplicated names with differing definitions, "
            f"{len(identical)} with identical copies"
        )

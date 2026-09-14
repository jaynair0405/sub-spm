"""locate_overspeed_events: km-run-from-start -> section name + official km post."""

from psr_mps import PSRMPSCalculator, detect_overspeed_events, locate_overspeed_events


def _stations():
    # Official posts in metres, actual run scaled 2 % long (worn wheels).
    return [
        {"name": "CSMT", "actualCumDist": 0.0, "officialKM": 100.0},
        {"name": "BY", "actualCumDist": 4018.8, "officialKM": 4040.0},
        {"name": "PR", "actualCumDist": 7701.0, "officialKM": 7650.0},
        {"name": "DR", "actualCumDist": 8925.0, "officialKM": 8850.0},
    ]


def test_event_inside_one_segment_gets_section_and_posts():
    ev = {"start_dist": 5000.0, "end_dist": 6000.0, "start_km": 5.0, "end_km": 6.0}
    locate_overspeed_events([ev], _stations())
    assert ev["section"] == "BY-PR"
    # BY at 4.04 km, PR at 7.65 km; 5000 m is 26.6 % through the 3682 m segment.
    assert 4.9 < ev["start_post_km"] < 5.1
    assert 5.9 < ev["end_post_km"] < 6.1
    assert ev["location"] == f"BY-PR (km {ev['start_post_km']}-{ev['end_post_km']})"


def test_event_spanning_segments_names_outer_stations():
    ev = {"start_dist": 7500.0, "end_dist": 8000.0, "start_km": 7.5, "end_km": 8.0}
    locate_overspeed_events([ev], _stations())
    assert ev["section"] == "BY-DR"


def test_event_past_last_station_clamps_to_last_segment():
    ev = {"start_dist": 8900.0, "end_dist": 9500.0, "start_km": 8.9, "end_km": 9.5}
    locate_overspeed_events([ev], _stations())
    assert ev["section"] == "PR-DR"
    assert ev["end_post_km"] == 8.85


def test_unresolvable_event_keeps_km_run_only():
    ev = {"start_dist": -50.0, "end_dist": -10.0, "start_km": 0, "end_km": 0}
    locate_overspeed_events([ev], _stations())
    assert "location" not in ev and "section" not in ev
    assert locate_overspeed_events([], _stations()) == []
    assert locate_overspeed_events([ev], []) == [ev]


def test_detected_events_carry_raw_distances_for_locating():
    rows = [{"Time": f"10:00:{i:02d}", "Speed": 70, "cumulative_distance": 5000 + 20 * i} for i in range(12)]
    rows.append({"Time": "10:00:12", "Speed": 40, "cumulative_distance": 5240})
    events = detect_overspeed_events(rows, [60] * len(rows), threshold_offset=3)
    assert len(events) == 1
    assert events[0]["start_dist"] == 5000 and events[0]["end_dist"] == 5240
    locate_overspeed_events(events, _stations())
    assert events[0]["section"] == "BY-PR"


def test_enhanced_stations_for_matches_process_defaults():
    calc = PSRMPSCalculator()
    rows = [{"cumulative_distance": 0.0}, {"cumulative_distance": 8925.0}]
    km = {"CSMT": 100.0, "BY": 4040.0, "PR": 7650.0, "DR": 8850.0}
    out = calc.enhanced_stations_for(rows, ["CSMT", "BY", "PR", "DR"], km, {"CSMT": 0.0, "DR": 8925.0})
    assert [s["name"] for s in out] == ["CSMT", "BY", "PR", "DR"]
    assert out[-1]["actualCumDist"] == 8925.0
    assert calc.enhanced_stations_for([], ["CSMT"], km, {}) == []

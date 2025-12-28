from pathlib import Path

import pytest

from platform_entry_speed import PlatformEntryCalculator

REFERENCE_DIR = Path(__file__).parent / "reference_data"


def test_entry_speed_uses_meter_scale_when_needed():
    calculator = PlatformEntryCalculator(reference_data_dir=str(REFERENCE_DIR))

    halting_stations = {"MNKD": 250.0, "VSH": 500.0, "SNPD": 750.0}  # meters from origin
    ordered_stations = ["MNKD", "VSH", "SNPD"]
    spm_data = [
        {"cumulative_distance": 200.0, "speed": 40.0},
        {"cumulative_distance": 232.0, "speed": 27.0},
        {"cumulative_distance": 260.0, "speed": 10.0},
        {"cumulative_distance": 500.0, "speed": 0.0},
    ]

    result = calculator.calculate_platform_entry_speeds(
        halting_stations,
        ordered_stations,
        spm_data,
        train_type="slow",
    )

    assert "VSH" in result
    vsh_data = result["VSH"]

    assert pytest.approx(vsh_data["entry_speed"], rel=1e-3) == 27.0
    # Platform length 0.268km => 268m entry offset; expect 0.232km entry distance
    assert pytest.approx(vsh_data["entry_distance"], rel=1e-3) == 0.232
    assert vsh_data["section"] == "VSH-SNPD"


def test_entry_speed_handles_kilometer_scale():
    calculator = PlatformEntryCalculator(reference_data_dir=str(REFERENCE_DIR))

    halting_stations = {"MNKD": 12.0, "VSH": 12.5, "SNPD": 13.0}
    ordered_stations = ["MNKD", "VSH", "SNPD"]
    spm_data = [
        {"cumulative_distance": 12.0, "speed": 45.0},
        {"cumulative_distance": 12.232, "speed": 33.0},
        {"cumulative_distance": 12.5, "speed": 5.0},
    ]

    result = calculator.calculate_platform_entry_speeds(
        halting_stations,
        ordered_stations,
        spm_data,
        train_type="slow",
    )

    assert "VSH" in result
    vsh_data = result["VSH"]

    assert pytest.approx(vsh_data["entry_speed"], rel=1e-3) == 33.0
    assert pytest.approx(vsh_data["entry_distance"], rel=1e-3) == pytest.approx(
        12.5 - 0.268, rel=1e-3
    )
    assert vsh_data["section"] == "VSH-SNPD"

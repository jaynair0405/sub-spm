from brakefeel_detector import BrakeFeelDetector


def build_sequence():
    speeds = [0] * 5
    speeds.extend(range(0, 45, 3))  # accelerate to > 40
    speeds.extend(range(45, 10, -4))  # brake to near 10
    speeds.extend([12] * 15)  # maintain/recover
    return speeds


def test_brakefeel_detects_sequence():
    detector = BrakeFeelDetector()
    speeds = build_sequence()
    samples = [
        {
            "speed": speed,
            "timestamp": f"10:00:{idx:02d}",
            "distance": idx * 0.05,
            "cumulative_distance": idx * 0.05,
        }
        for idx, speed in enumerate(speeds)
    ]

    results = detector.detect_from_samples(samples)

    assert len(results) == 1
    test = results[0]
    assert test.max_speed > test.start_speed
    assert test.start_speed >= 0
    assert test.lowest_speed < test.braking_start_speed
    assert test.speed_drop >= detector.min_speed_drop


def test_brakefeel_no_detection_without_braking():
    detector = BrakeFeelDetector()
    speeds = list(range(0, 50, 2))  # only acceleration
    samples = [
        {
            "speed": speed,
            "timestamp": f"10:00:{idx:02d}",
            "distance": idx * 0.05,
            "cumulative_distance": idx * 0.05,
        }
        for idx, speed in enumerate(speeds)
    ]

    assert detector.detect_from_samples(samples) == []

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Sequence
from datetime import datetime


@dataclass
class BrakeFeelTest:
    start_index: int
    end_index: int
    max_speed_index: int
    braking_start_index: int
    lowest_speed_index: int
    recovery_index: int
    start_speed: float
    max_speed: float
    braking_start_speed: float
    lowest_speed: float
    recovery_speed: float
    speed_drop: float
    duration: float


class BrakeFeelDetector:
    """Detects brake feel tests based on speed/time profiles."""

    def __init__(
        self,
        min_speed_for_test: float = 20.0,
        min_speed_drop: float = 8.0,
        max_speed_variation: float = 3.0,
        stabilization_period: float = 5.0,
        braking_noise_tolerance: int = 3,
    ) -> None:
        self.min_speed_for_test = min_speed_for_test
        self.min_speed_drop = min_speed_drop
        self.max_speed_variation = max_speed_variation
        self.stabilization_period = stabilization_period
        self.braking_noise_tolerance = max(0, int(braking_noise_tolerance))

    def detect_from_samples(self, samples: Sequence[dict]) -> List[BrakeFeelTest]:
        speeds = [float(s.get("speed", 0.0) or 0.0) for s in samples]
        times = [s.get("timestamp") for s in samples]
        distances = [float(s.get("distance", 0.0) or 0.0) for s in samples]
        cumulative = [float(s.get("cumulative_distance", 0.0) or 0.0) for s in samples]
        return self.detect(speeds, times, distances, cumulative)

    def detect(
        self,
        speeds: Sequence[float],
        times: Sequence[Optional[str]],
        distances: Sequence[float],
        cumulative: Sequence[float],
    ) -> List[BrakeFeelTest]:
        if not speeds:
            return []

        end_idx = self._find_analysis_end_index(speeds, distances, cumulative)
        sliced_speeds = list(map(float, speeds[:end_idx]))
        sliced_times = list(times[:end_idx])
        times_sec = self._convert_times_to_seconds(sliced_times)
        cleaned = self._clean_speed_data(sliced_speeds, times_sec)

        if not cleaned["speeds"]:
            return []

        tests: List[BrakeFeelTest] = []
        i = 0
        speeds_clean = cleaned["speeds"]
        times_clean = cleaned["times"]
        original_idx = cleaned["indices"]

        while i < len(speeds_clean) - 30:
            accel = self._find_acceleration_phase(speeds_clean, i)
            if not accel or accel.end_speed < self.min_speed_for_test:
                i += 1
                continue

            i = accel.end_index
            braking = self._find_braking_phase(speeds_clean, i)
            if not braking:
                i = accel.end_index + 10
                continue

            recovery = self._find_recovery_phase(speeds_clean, braking.end_index, braking.end_speed)
            if not recovery:
                i = braking.end_index
                continue

            start_idx = original_idx[accel.start_index]
            end_idx = original_idx[recovery.end_index]

            tests.append(
                BrakeFeelTest(
                    start_index=start_idx,
                    end_index=end_idx,
                    max_speed_index=original_idx[accel.end_index],
                    braking_start_index=original_idx[braking.start_index],
                    lowest_speed_index=original_idx[braking.end_index],
                    recovery_index=end_idx,
                    start_speed=accel.start_speed,
                    max_speed=accel.end_speed,
                    braking_start_speed=braking.start_speed,
                    lowest_speed=braking.end_speed,
                    recovery_speed=recovery.end_speed,
                    speed_drop=braking.start_speed - braking.end_speed,
                    duration=times_clean[recovery.end_index] - times_clean[accel.start_index],
                )
            )

            i = recovery.end_index

        return tests

    def _find_analysis_end_index(
        self,
        speeds: Sequence[float],
        distances: Sequence[float],
        cumulative: Sequence[float],
    ) -> int:
        min_distance = 0.7
        use_meters = max(cumulative or [0]) > 100
        threshold = 700.0 if use_meters else min_distance
        last_cum = None

        padding = max(10, self.braking_noise_tolerance + int(self.stabilization_period) + 5)
        total_len = len(speeds)

        for idx, (speed, distance, cum) in enumerate(zip(speeds, distances, cumulative)):
            speed = float(speed or 0)
            distance = float(distance or 0)
            cum = float(cum or 0)
            if speed == 0 and distance == 0:
                if (use_meters and cum >= threshold) or (not use_meters and cum >= threshold):
                    if last_cum is None or abs(cum - last_cum) > (200 if use_meters else 0.2):
                        return min(total_len, idx + 1 + padding)
                    last_cum = cum
        return total_len

    def _convert_times_to_seconds(self, times: Sequence[Optional[str]]) -> List[float]:
        seconds = []
        base_time = None
        for entry in times:
            if entry is None:
                seconds.append(float(len(seconds)))
                continue
            if isinstance(entry, (int, float)):
                sec = float(entry)
            else:
                text = str(entry)
                if text.startswith("T+"):
                    try:
                        sec = float(text[2:-1])
                    except ValueError:
                        sec = float(len(seconds))
                else:
                    try:
                        parsed = datetime.strptime(text.strip(), "%H:%M:%S")
                        if base_time is None:
                            base_time = parsed
                        delta = parsed - base_time
                        sec = delta.total_seconds()
                    except ValueError:
                        sec = float(len(seconds))
            seconds.append(sec)
        return seconds

    def _clean_speed_data(self, speeds: Sequence[float], times: Sequence[float]):
        cleaned = {"speeds": [], "times": [], "indices": []}
        for idx, (speed, time) in enumerate(zip(speeds, times)):
            if speed is None or time is None:
                continue
            try:
                speed = float(speed)
                time = float(time)
            except (TypeError, ValueError):
                continue
            if speed < 0:
                continue
            cleaned["speeds"].append(speed)
            cleaned["times"].append(time)
            cleaned["indices"].append(idx)
        return cleaned

    def _find_acceleration_phase(self, speeds: Sequence[float], start_index: int):
        min_increase = 15
        plateau_tol = 0.01
        max_time = 120
        current = start_index
        start_speed = speeds[start_index]
        max_speed = start_speed
        max_index = start_index
        plateau_count = 0

        while current < len(speeds) - 1 and (current - start_index) < max_time:
            curr = speeds[current]
            nxt = speeds[current + 1]

            if nxt > curr:
                plateau_count = 0
                if nxt > max_speed:
                    max_speed = nxt
                    max_index = current + 1
            elif nxt < curr - plateau_tol:
                if max_speed - start_speed >= min_increase:
                    break
                plateau_count = 0
            else:
                plateau_count = min(plateau_count + 1, 100)
            current += 1

        if max_speed - start_speed >= min_increase:
            return Phase(start_index, max_index, start_speed, max_speed)
        return None

    def _find_braking_phase(self, speeds: Sequence[float], start_index: int):
        plateau_tol = 0.01
        max_time = 150
        current = start_index
        start_speed = speeds[start_index]
        lowest_speed = start_speed
        lowest_index = start_index
        hit_target = False
        noise_allowance = self.braking_noise_tolerance
        noise_count = 0

        while current < len(speeds) - 1 and (current - start_index) < max_time:
            curr = speeds[current]
            nxt = speeds[current + 1]

            if nxt < curr - plateau_tol:
                noise_count = 0
                if nxt < lowest_speed:
                    lowest_speed = nxt
                    lowest_index = current + 1
                if start_speed - lowest_speed >= self.min_speed_drop:
                    hit_target = True
            elif nxt > curr + plateau_tol:
                if hit_target:
                    noise_count += 1
                    if noise_count > noise_allowance:
                        return Phase(start_index, lowest_index, start_speed, lowest_speed)
                else:
                    noise_count = min(noise_count + 1, noise_allowance)
            else:
                noise_count = max(0, noise_count - 1)
            current += 1

        if hit_target:
            return Phase(start_index, lowest_index, start_speed, lowest_speed)
        return None

    def _find_recovery_phase(self, speeds: Sequence[float], start_index: int, base_speed: float):
        max_var = self.max_speed_variation
        acceleration_threshold = 5
        max_time = 40
        maintain_count = 0
        current = start_index

        while current < len(speeds) and (current - start_index) < max_time:
            curr = speeds[current]
            if abs(curr - base_speed) <= max_var:
                maintain_count += 1
                if maintain_count >= self.stabilization_period:
                    return Phase(start_index, current, base_speed, curr)
            elif curr > base_speed + acceleration_threshold:
                return Phase(start_index, current, base_speed, curr)
            else:
                maintain_count = max(0, maintain_count - 1)
            current += 1

        return None


@dataclass
class Phase:
    start_index: int
    end_index: int
    start_speed: float
    end_speed: float

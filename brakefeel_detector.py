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
    """
    Detects brake feel tests based on speed/time profiles.

    Simplified approach:
    - Looks for speed in valid range (15-40 kmph)
    - Detects significant speed drop (>= 5 kmph)
    - Confirms recovery after braking

    No acceleration phase required - handles BFT from any cruising speed.
    """

    def __init__(
        self,
        min_speed_for_test: float = 15.0,
        max_speed_for_test: float = 40.0,
        min_speed_drop: float = 5.0,
        max_speed_variation: float = 3.0,
        stabilization_period: float = 5.0,
        braking_noise_tolerance: int = 3,
    ) -> None:
        self.min_speed_for_test = min_speed_for_test
        self.max_speed_for_test = max_speed_for_test
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
        speeds_clean = cleaned["speeds"]
        times_clean = cleaned["times"]
        original_idx = cleaned["indices"]

        # Scan for BFT pattern: find where speed drops significantly within a short window
        # BFT characteristics:
        # 1. Speed is in valid range (15-40 kmph) before braking
        # 2. Rapid drop of >= 5 kmph within ~15 seconds
        # 3. Recovery after the drop

        i = 0
        bft_window_passed = False  # Track if we've passed the BFT window (speed exceeded 40)

        while i < len(speeds_clean) - 20:
            current_speed = speeds_clean[i]

            # Skip if speed not in valid range (below 15)
            if current_speed < self.min_speed_for_test:
                i += 1
                continue

            # If speed exceeds max (40 kmph), BFT window has passed
            # Once speed crosses 40, BFT should have been done - stop searching entirely
            if current_speed > self.max_speed_for_test:
                if not bft_window_passed:
                    bft_window_passed = True
                    # BFT not done before 40 kmph - no valid BFT in this run
                    break
                i += 1
                continue

            # Look ahead for a rapid speed drop pattern
            # Follow the rising trend until speed actually starts dropping (find true peak)
            peak_speed = current_speed
            peak_index = i
            exceeded_max = False
            found_peak = False

            # Follow speed until it stops rising (no artificial limit - follow until drop detected)
            drop_start_index = i
            for j in range(i, len(speeds_clean) - 15):  # Need 15 samples after for braking check
                if speeds_clean[j] > self.max_speed_for_test:
                    # Speed exceeded max limit - BFT should have happened before this
                    exceeded_max = True
                    break
                if speeds_clean[j] > peak_speed:
                    peak_speed = speeds_clean[j]
                    peak_index = j
                elif speeds_clean[j] < peak_speed - 2:
                    # Speed dropped by more than 2 kmph from peak, we found the peak
                    found_peak = True
                    drop_start_index = j  # Remember where the drop started
                    break

            # Skip if speed exceeded max (BFT didn't happen in time)
            if exceeded_max:
                i += 1
                continue

            # Skip if no clear peak found (still rising at end of data)
            if not found_peak:
                i += 1
                continue

            # Now follow the drop from where it started until speed recovers
            # Start from drop_start_index (where we detected the drop), not peak_index
            lowest_speed = speeds_clean[drop_start_index]
            lowest_index = drop_start_index
            max_braking_window = 30  # Safety limit

            for j in range(drop_start_index, min(drop_start_index + max_braking_window, len(speeds_clean))):
                if speeds_clean[j] < lowest_speed:
                    lowest_speed = speeds_clean[j]
                    lowest_index = j
                elif speeds_clean[j] > lowest_speed + 2:
                    # Speed started recovering (increased by more than 2 kmph), stop tracking
                    break

            speed_drop = peak_speed - lowest_speed

            # Check if this is a valid BFT drop
            if speed_drop < self.min_speed_drop:
                i += 1
                continue

            # Verify it's a real braking event (not just noise)
            # Check that drop happened continuously, not scattered
            drop_duration = lowest_index - peak_index
            if drop_duration < 3:  # Too fast, might be noise
                i += 1
                continue

            # Look for recovery after braking OR train came to halt
            recovery = self._find_recovery_phase(speeds_clean, lowest_index, lowest_speed)

            # Check if train came to halt (speed = 0) after braking
            came_to_halt = False
            halt_index = lowest_index
            if not recovery:
                # Look for halt within a few samples after lowest point
                for j in range(lowest_index, min(lowest_index + 10, len(speeds_clean))):
                    if speeds_clean[j] == 0:
                        came_to_halt = True
                        halt_index = j
                        break

            # Valid BFT if either recovery or halt
            if not recovery and not came_to_halt:
                i = lowest_index + 1
                continue

            # Find the start of this BFT sequence
            start_index = peak_index
            for j in range(peak_index - 1, max(-1, peak_index - 30), -1):
                if speeds_clean[j] < speeds_clean[start_index]:
                    start_index = j
                if speeds_clean[j] <= 0:
                    break

            start_idx = original_idx[start_index]

            # End index and recovery speed depend on whether recovery or halt
            if recovery:
                end_idx_final = original_idx[recovery.end_index]
                recovery_speed = recovery.end_speed
                duration = times_clean[recovery.end_index] - times_clean[start_index]
            else:
                # Came to halt
                end_idx_final = original_idx[halt_index]
                recovery_speed = 0.0
                duration = times_clean[halt_index] - times_clean[start_index]

            tests.append(
                BrakeFeelTest(
                    start_index=start_idx,
                    end_index=end_idx_final,
                    max_speed_index=original_idx[peak_index],
                    braking_start_index=original_idx[peak_index],
                    lowest_speed_index=original_idx[lowest_index],
                    recovery_index=end_idx_final,
                    start_speed=speeds_clean[start_index],
                    max_speed=peak_speed,
                    braking_start_speed=peak_speed,
                    lowest_speed=lowest_speed,
                    recovery_speed=recovery_speed,
                    speed_drop=speed_drop,
                    duration=duration,
                )
            )

            # Only detect first BFT
            break

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

"""
Platform Entry Speed Calculator

Calculates the speed at which trains enter station platforms by:
1. Identifying halt stations
2. Looking up platform lengths from ISD data (direction-aware)
3. Finding speed at (halt_distance - platform_length)
"""

import json
from typing import Dict, List, Optional
from pathlib import Path


class PlatformEntryCalculator:
    """Calculate platform entry speeds for halting stations"""

    def __init__(self, reference_data_dir: str = "reference_data"):
        """
        Initialize platform entry calculator.

        Args:
            reference_data_dir: Directory containing ISD JSON files
        """
        self.reference_data_dir = Path(reference_data_dir)
        self.isd_cache = {}

    def load_isd_data(self, train_type: str) -> Dict[str, Dict]:
        """
        Load ISD (Inter-Station Distance) reference data.

        For fast trains, loads BOTH fast and slow ISD data to support cross-corridor
        journeys (e.g., TLA→CSMT travels through NE slow stations + Main fast stations).

        Args:
            train_type: "fast" or "slow" (slow includes harbour/local lines)

        Returns:
            Dict mapping section names to platform data
            Example: {
                "VSH-MNKD": {
                    "section": "VSH-MNKD",
                    "station": "VSH",
                    "platform_length_km": 0.264
                }
            }
        """
        cache_key = train_type.lower()

        if cache_key in self.isd_cache:
            return self.isd_cache[cache_key]

        isd_data = {}

        # For fast trains, load BOTH fast and slow ISD data
        # This supports cross-corridor journeys (e.g., NE→Main, SE→Main)
        if train_type.lower() == "fast":
            # Load fast ISD first
            fast_file = self.reference_data_dir / "fast_isd.json"
            if fast_file.exists():
                with open(fast_file, 'r') as f:
                    fast_data = json.load(f)
                    isd_data.update(fast_data)

            # Load slow ISD and merge (fast ISD takes precedence for overlaps)
            slow_file = self.reference_data_dir / "slow_isd.json"
            if slow_file.exists():
                with open(slow_file, 'r') as f:
                    slow_data = json.load(f)
                    # Only add sections not already in fast data
                    for section, data in slow_data.items():
                        if section not in isd_data:
                            isd_data[section] = data

            print(f"[DEBUG ISD] Loaded {len(isd_data)} platform entries (fast + slow combined)")

        else:
            # For slow/thb/harbour trains, load only slow ISD
            slow_file = self.reference_data_dir / "slow_isd.json"
            if not slow_file.exists():
                raise FileNotFoundError(f"ISD file not found: {slow_file}")

            with open(slow_file, 'r') as f:
                isd_data = json.load(f)

            print(f"[DEBUG ISD] Loaded {len(isd_data)} platform entries for {train_type} trains")

        self.isd_cache[cache_key] = isd_data
        return isd_data

    def create_section_pairs(self, ordered_stations: List[str]) -> List[str]:
        """
        Create section pair names from ordered station list.

        Args:
            ordered_stations: List of stations in travel order
                             Example: ["CSMT", "MSD", "SNRD", "BY", "DR"]

        Returns:
            List of section names
            Example: ["CSMT-MSD", "MSD-SNRD", "SNRD-BY", "BY-DR"]
        """
        if not ordered_stations or len(ordered_stations) < 2:
            return []

        sections = []
        for i in range(len(ordered_stations) - 1):
            section = f"{ordered_stations[i]}-{ordered_stations[i+1]}"
            sections.append(section)

        return sections

    def get_platform_length(
        self,
        station: str,
        section: str,
        isd_data: Dict[str, Dict]
    ) -> Optional[float]:
        """
        Get platform length for a station in a specific section.

        Args:
            station: Station name (e.g., "VSH")
            section: Section name (e.g., "VSH-MNKD" or "MNKD-VSH")
            isd_data: ISD reference data

        Returns:
            Platform length in km, or None if not found

        Example:
            # For VSH when traveling CSMT→PNVL (section "SNPD-VSH" → "VSH-MNKD"):
            get_platform_length("VSH", "VSH-MNKD", isd_data) → 0.264

            # For VSH when traveling PNVL→CSMT (section "MNKD-VSH" → "VSH-SNPD"):
            get_platform_length("VSH", "VSH-SNPD", isd_data) → 0.268
        """
        # The section tells us the direction and which platform to use
        # First try exact section name
        if section in isd_data:
            platform_data = isd_data[section]
            # Verify this section's platform matches the station
            if platform_data['station'].strip() == station.strip():
                return platform_data['platform_length_km']
            else:
                print(f"[DEBUG ISD] Section '{section}' has platform for '{platform_data['station']}', not '{station}'")

        # If exact match not found or station doesn't match, try SECTION_STATION variant
        variant_key = f"{section}_{station}"
        if variant_key in isd_data:
            platform_data = isd_data[variant_key]
            if platform_data['station'].strip() == station.strip():
                print(f"[DEBUG ISD] Found {station} platform in variant key '{variant_key}'")
                return platform_data['platform_length_km']

        # Not found
        if section not in isd_data:
            print(f"[DEBUG ISD] Section '{section}' not found in ISD data")

        return None

    def find_speed_at_distance(
        self,
        target_distance: float,
        spm_data: List[Dict],
        return_distance: bool = False
    ) -> Optional[float]:
        """
        Find the speed at or immediately after a target cumulative distance.

        Args:
            target_distance: Target cumulative distance (same unit as SPM data)
            spm_data: List of SPM samples with 'cumulative_distance' and 'speed'

        Returns:
            Speed in km/h at the entry point. Prefers the first sample whose
            cumulative distance is >= target_distance (closer to halt). This
            approach favors the driver and accounts for platform length measurement
            errors and speedometer/GPS recording delays. If none exist (target is
            after the last sample), falls back to the closest sample overall.

            When return_distance is True, returns a tuple of (speed, actual_distance)
            so callers can understand how far the chosen sample was from the
            requested distance. The actual_distance uses the same units as the SPM
            data (meters or kilometers).
        """
        if not spm_data:
            return (None, None) if return_distance else None

        # Ensure samples are processed in order of cumulative distance
        sorted_samples = sorted(spm_data, key=lambda s: s.get('cumulative_distance', 0.0))

        best_following_sample = None
        min_negative_diff = float('inf')
        closest_sample = None
        closest_diff = float('inf')

        for sample in sorted_samples:
            distance = sample.get('cumulative_distance', 0.0)
            diff = target_distance - distance

            # Track the closest sample overall
            abs_diff = abs(diff)
            if abs_diff < closest_diff:
                closest_diff = abs_diff
                closest_sample = sample

            # Prefer the sample at or after the entry distance (closer to halt)
            # This favors the driver and accounts for measurement errors
            if diff <= 0 and abs(diff) < min_negative_diff:
                min_negative_diff = abs(diff)
                best_following_sample = sample

        chosen_sample = best_following_sample or closest_sample
        if chosen_sample:
            speed_val = chosen_sample.get('speed')
            if return_distance:
                return speed_val, chosen_sample.get('cumulative_distance')
            return speed_val

        if return_distance:
            return None, None
        return None

    def _is_meter_scale(self, distances: List[float]) -> bool:
        """
        Determine if distances are provided in meters (large values) or kilometers.

        Args:
            distances: List of distance values from SPM data/halts

        Returns:
            True if values look like meters (very large numbers), False if kilometers
        """
        if not distances:
            return False

        # Use absolute max to avoid negative values influencing detection
        max_distance = max(abs(d) for d in distances if d is not None)

        # Typical corridor lengths are < 100km, so anything larger is likely meters
        return max_distance > 100.0

    def calculate_platform_entry_speeds(
        self,
        halting_stations: Dict[str, float],
        ordered_stations: List[str],
        spm_data: List[Dict],
        train_type: str
    ) -> Dict[str, Dict]:
        """
        Calculate platform entry speeds for all halting stations.

        Args:
            halting_stations: Dict of {station_name: halt_cumulative_distance_km}
            ordered_stations: List of stations in travel order
            spm_data: List of SPM samples
            train_type: "fast" or "slow"

        Returns:
            Dict of {station_name: {
                'halt_distance': halt distance in km,
                'platform_length_km': platform length,
                'entry_distance': entry distance in km,
                'entry_speed': speed at entry point in km/h,
                'section': section name used
            }}

        Example:
            Input:
                halting_stations = {"DR": 9.02}
                ordered_stations = ["CSMT", "MSD", "SNRD", "BY", "DR"]
                train_type = "slow"

            Flow:
                1. Sections = ["CSMT-MSD", "MSD-SNRD", "SNRD-BY", "BY-DR"]
                2. DR is in section "BY-DR" (DR is 2nd station)
                3. Platform length for "BY-DR" → "DR" = 0.261 km
                4. Entry distance = 9.02 - 0.261 = 8.759 km
                5. Find speed at 8.759 km in SPM data
                6. Return entry speed
        """
        # Load ISD data
        isd_data = self.load_isd_data(train_type)

        # Create section pairs to infer travel direction
        sections = self.create_section_pairs(ordered_stations)
        if not sections:
            print("[DEBUG ISD] No sections created from ordered stations")
            return {}

        print(f"[DEBUG ISD] Sections for this trip: {sections[:5]}...")  # Show first 5

        # Determine whether halting / SPM distances are recorded in meters
        distance_samples = list(halting_stations.values())
        if not distance_samples and spm_data:
            distance_samples = [sample.get('cumulative_distance', 0.0) for sample in spm_data]
        use_meter_scale = self._is_meter_scale(distance_samples)
        distance_unit_label = "m" if use_meter_scale else "km"

        # Derive actual travel order from halting stations (based on cumulative distance)
        sorted_halts = []
        prev_halt_station = {}
        next_halt_station = {}
        if halting_stations:
            sorted_halts = sorted(halting_stations.items(), key=lambda kv: kv[1])
            for idx, (station, _) in enumerate(sorted_halts):
                if idx > 0:
                    prev_halt_station[station] = sorted_halts[idx - 1][0]
                if idx + 1 < len(sorted_halts):
                    next_halt_station[station] = sorted_halts[idx + 1][0]

        # Map each station to corridor-adjacent sections using ordered station list
        station_prev_section = {}
        station_next_section = {}
        for idx, station in enumerate(ordered_stations):
            if idx > 0:
                prev_station = ordered_stations[idx - 1]
                # Section approaching this station from previous station
                station_prev_section[station] = f"{prev_station}-{station}"
            if idx + 1 < len(ordered_stations):
                next_station = ordered_stations[idx + 1]
                # Section departing this station to next station
                station_next_section[station] = f"{station}-{next_station}"

        # Calculate entry speeds for each halt
        entry_speeds = {}

        def to_meters(value: Optional[float]) -> Optional[float]:
            if value is None:
                return None
            return value if use_meter_scale else value * 1000.0

        def calculate_gap(actual_value: Optional[float], target_value: float) -> Optional[float]:
            actual_m = to_meters(actual_value)
            target_m = to_meters(target_value)
            if actual_m is None or target_m is None:
                return None
            return abs(actual_m - target_m)

        for station, halt_distance in halting_stations.items():
            # Skip starting/terminal stations (halt distance ≈ 0)
            # Platform entry speed not applicable when train starts from station
            halt_distance_km = halt_distance / 1000.0 if use_meter_scale else halt_distance
            if halt_distance_km < 0.01:  # Less than 10 meters
                print(f"[DEBUG ISD] Skipping {station} - starting station (halt={halt_distance_km:.3f}km)")
                continue

            # Determine direction-specific section to use for this station
            platform_length = None
            station_section = None

            # Prefer approaching section (station ← prev_station)
            section_candidates = []
            if station in next_halt_station:
                section_candidates.append(f"{station}-{next_halt_station[station]}")
            if station in station_next_section:
                section_candidates.append(station_next_section[station])
            if station in station_prev_section:
                section_candidates.append(station_prev_section[station])
            if station in prev_halt_station:
                section_candidates.append(f"{station}-{prev_halt_station[station]}")

            for section_candidate in section_candidates:
                platform_length = self.get_platform_length(station, section_candidate, isd_data)
                if platform_length is not None:
                    station_section = section_candidate
                    break

            # Fallback: search all sections for this station
            if platform_length is None:
                for section_name, section_data in isd_data.items():
                    if section_data.get('station', '').strip() == station.strip():
                        platform_length = section_data.get('platform_length_km')
                        station_section = section_name
                        break

            if not station_section:
                print(f"[DEBUG ISD] Platform length not found for station '{station}' in ISD data")
                continue

            # Calculate platform entry distance
            platform_length_in_data_units = platform_length * (1000.0 if use_meter_scale else 1.0)
            entry_distance_raw = max(halt_distance - platform_length_in_data_units, 0.0)

            # Calculate additional measurement points
            # Mid-platform: 130m from halt (approximate mid-point of platform)
            mid_platform_distance_raw = max(halt_distance - (130.0 if use_meter_scale else 0.130), 0.0)

            # One coach: 20m from halt (length of one coach)
            one_coach_distance_raw = max(halt_distance - (20.0 if use_meter_scale else 0.020), 0.0)

            # Find speeds at all three points
            entry_speed, entry_sample_distance = self.find_speed_at_distance(
                entry_distance_raw, spm_data, return_distance=True
            )
            mid_platform_speed, mid_sample_distance = self.find_speed_at_distance(
                mid_platform_distance_raw, spm_data, return_distance=True
            )
            one_coach_speed, one_sample_distance = self.find_speed_at_distance(
                one_coach_distance_raw, spm_data, return_distance=True
            )

            if entry_speed is None:
                display_distance = entry_distance_raw / 1000.0 if use_meter_scale else entry_distance_raw
                print(f"[DEBUG ISD] No speed found at entry distance {display_distance:.3f} km for {station}")
                continue

            halt_distance_km = halt_distance / 1000.0 if use_meter_scale else halt_distance
            entry_distance_km = entry_distance_raw / 1000.0 if use_meter_scale else entry_distance_raw

            entry_gap_m = calculate_gap(entry_sample_distance, entry_distance_raw)
            mid_gap_m = calculate_gap(mid_sample_distance, mid_platform_distance_raw)
            one_coach_gap_m = calculate_gap(one_sample_distance, one_coach_distance_raw)

            entry_speeds[station] = {
                'halt_distance': halt_distance_km,
                'platform_length_km': platform_length,
                'entry_distance': entry_distance_km,
                'entry_speed': entry_speed,
                'mid_platform_speed': mid_platform_speed,  # Speed at 130m from halt
                'one_coach_speed': one_coach_speed,        # Speed at 20m from halt
                'section': station_section,
                'entry_gap_m': entry_gap_m,
                'mid_gap_m': mid_gap_m,
                'one_coach_gap_m': one_coach_gap_m
            }

            mid_pf_str = f"{mid_platform_speed:.1f}" if mid_platform_speed is not None else "N/A"
            one_coach_str = f"{one_coach_speed:.1f}" if one_coach_speed is not None else "N/A"
            print(f"[DEBUG ISD] {station} ({station_section}): "
                  f"PF Entry={entry_speed:.1f}km/h, "
                  f"Mid PF(130m)={mid_pf_str}km/h, "
                  f"1 Coach(20m)={one_coach_str}km/h "
                  f"[halt={halt_distance_km:.3f}km, platform={platform_length:.3f}km]")

        return entry_speeds


# Utility function for convenience
def get_platform_entry_speeds(
    halting_stations: Dict[str, float],
    ordered_stations: List[str],
    spm_data: List[Dict],
    train_type: str,
    reference_data_dir: str = "reference_data"
) -> Dict[str, Dict]:
    """
    Convenience function to calculate platform entry speeds.

    Args:
        halting_stations: Dict of {station_name: halt_distance_km}
        ordered_stations: List of stations in travel order
        spm_data: List of SPM samples
        train_type: "fast" or "slow"
        reference_data_dir: Directory with ISD JSON files

    Returns:
        Dict of {station_name: entry_speed_info}
    """
    calculator = PlatformEntryCalculator(reference_data_dir)
    return calculator.calculate_platform_entry_speeds(
        halting_stations,
        ordered_stations,
        spm_data,
        train_type
    )

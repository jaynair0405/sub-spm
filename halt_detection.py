"""
Halt Detection Module

Detects where a train stopped (speed = 0) and matches those positions
with known stations from corridor data.
"""

from typing import List, Dict, Tuple, Optional, TYPE_CHECKING
import polars as pl

if TYPE_CHECKING:
    from corridor_loader import CorridorData


class HaltDetector:
    """Detect train halts and match them to stations"""

    def __init__(self, speed_threshold: float = 5.0, min_halt_duration_seconds: int = 10):
        """
        Initialize halt detector.

        Args:
            speed_threshold: Speed below this is considered a halt (km/h)
            min_halt_duration_seconds: Minimum duration to count as a halt
        """
        self.speed_threshold = speed_threshold
        self.min_halt_duration_seconds = min_halt_duration_seconds

    def detect_halts(
        self,
        spm_data: pl.DataFrame,
        speed_col: str = 'Speed',
        cum_dist_col: str = 'cumulative_distance'
    ) -> List[Dict]:
        """
        Detect halts in SPM data.

        Simple logic: Find all rows where speed = 0, then get unique cumulative distances.
        This handles cases where SPM instruments skip recording during halts.

        Args:
            spm_data: Polars DataFrame with speed and distance data
            speed_col: Name of speed column
            cum_dist_col: Name of cumulative distance column

        Returns:
            List of halt dictionaries with cumulative_distance
        """
        if speed_col not in spm_data.columns or cum_dist_col not in spm_data.columns:
            return []

        # Find all rows where speed = 0
        halt_rows = spm_data.filter(pl.col(speed_col) == 0)

        if len(halt_rows) == 0:
            return []

        # Get unique (distinct) cumulative distances where halts occurred
        unique_halt_distances = halt_rows.select(cum_dist_col).unique().sort(cum_dist_col)

        # Convert to list of dicts
        halts = []
        for row in unique_halt_distances.iter_rows():
            halt_dist = float(row[0])
            halts.append({
                'cumulative_distance': halt_dist
            })

        return halts

    def match_halts_to_stations(
        self,
        halts: List[Dict],
        station_positions: Dict[str, float],
        max_distance_tolerance: float = 500.0
    ) -> Dict[str, float]:
        """
        Match detected halts to known station positions.

        Args:
            halts: List of detected halts from detect_halts()
            station_positions: Dict of {station_name: official_km_or_meters}
            max_distance_tolerance: Maximum distance (meters) to match halt to station

        Returns:
            Dict of {station_name: actual_cumulative_distance}

        Example:
            halts = [
                {'cumulative_distance': 0.05, ...},
                {'cumulative_distance': 4.12, ...},
                {'cumulative_distance': 9.02, ...}
            ]

            station_positions = {
                'CSMT': 0.1,
                'BY': 4.04,
                'DR': 8.85
            }

            Returns: {
                'CSMT': 0.05,
                'BY': 4.12,
                'DR': 9.02
            }
        """
        halting_station_map = {}
        unmatched_halts = []

        for halt in halts:
            halt_dist = halt['cumulative_distance']

            # Find nearest station
            best_match = None
            best_distance = float('inf')
            nearest_station_info = None

            for station_name, official_km in station_positions.items():
                # Calculate distance between halt and official station position
                # (This is approximate since actual vs official distances differ)
                distance = abs(halt_dist - official_km)

                if distance < best_distance:
                    best_distance = distance
                    nearest_station_info = (station_name, official_km, distance)

                    if distance <= max_distance_tolerance:
                        best_match = station_name

            if best_match:
                halting_station_map[best_match] = halt_dist
            else:
                unmatched_halts.append({
                    'halt_dist': halt_dist,
                    'nearest_station': nearest_station_info[0] if nearest_station_info else None,
                    'nearest_official': nearest_station_info[1] if nearest_station_info else None,
                    'distance_to_nearest': nearest_station_info[2] if nearest_station_info else None
                })

        # Debug: Log unmatched halts
        if unmatched_halts:
            print(f"[DEBUG HALT] {len(unmatched_halts)} unmatched halts (tolerance={max_distance_tolerance}m):")
            for um in unmatched_halts[:5]:  # Show first 5
                print(f"  Halt at {um['halt_dist']:.0f}m → nearest: {um['nearest_station']} at {um['nearest_official']:.0f}m (Δ={um['distance_to_nearest']:.0f}m)")

        return halting_station_map

    def match_halts_using_isd(
        self,
        halts: List[Dict],
        corridor_data: 'CorridorData',
        from_station: Optional[str] = None,
        to_station: Optional[str] = None,
        max_isd_diff: float = 100.0,
        max_cd_diff: float = 300.0
    ) -> Dict[str, float]:
        """
        Match halts to stations using ISD (Inter-Station Distance) pattern matching.

        This is the GAS-style approach that handles GPS drift better than absolute
        position matching. Based on routeselector.js matchHaltsWithStations().

        Args:
            halts: List of detected halts from detect_halts()
            corridor_data: CorridorData with stations and ISDs
            from_station: Optional starting station (if not provided, uses first halt)
            to_station: Optional ending station (for validation)
            max_isd_diff: Maximum ISD difference tolerance (meters) - default 100m
            max_cd_diff: Maximum cumulative distance difference (meters) - default 300m

        Returns:
            Dict of {station_name: actual_cumulative_distance}

        Algorithm:
            1. First halt is ALWAYS matched to from_station (or first station if not provided)
            2. Calculate ISDs from SPM halts
            3. Match subsequent halts by comparing SPM ISD pattern vs corridor ISD pattern
            4. Accumulate unmatched ISDs when stations are skipped

        Example:
            SPM halts at: [0m, 4120m, 9020m] → ISDs: [4120m, 4900m]
            Corridor ISDs: [0, 4040m, 4850m] → ISDs: [4040m, 4850m]

            Match 1: 0m → from_station (always)
            Match 2: 4120m ISD ≈ 4040m corridor ISD (Δ=80m < 100m) ✓
            Match 3: 4900m ISD ≈ 4850m corridor ISD (Δ=50m < 100m) ✓
        """
        if not halts:
            return {}

        # Get corridor stations and first record (for ISDs)
        all_stations = corridor_data.stations
        if not corridor_data.records:
            print("[DEBUG ISD] No corridor records found")
            return {}

        first_record = corridor_data.records[0]
        corridor_isds = first_record.inter_station_distances
        corridor_cumulative = first_record.cumulative_distances

        # Calculate ISDs from SPM halts
        halt_cumulative = [h['cumulative_distance'] for h in halts]
        halt_isds = []
        for i in range(1, len(halt_cumulative)):
            isd = halt_cumulative[i] - halt_cumulative[i-1]
            halt_isds.append(isd)

        print(f"[DEBUG ISD] Detected {len(halts)} halts with {len(halt_isds)} ISDs")
        print(f"[DEBUG ISD] SPM ISDs (first 5): {[f'{isd:.0f}m' for isd in halt_isds[:5]]}")

        # Determine starting station
        if from_station:
            start_station = from_station.upper()
            if start_station not in all_stations:
                print(f"[DEBUG ISD] from_station '{start_station}' not in corridor, using first halt as unknown start")
                start_station = None
        else:
            start_station = None

        # Build ordered station list (from start to end)
        if start_station:
            try:
                start_idx = all_stations.index(start_station)
            except ValueError:
                print(f"[DEBUG ISD] Station {start_station} not found in corridor")
                return {}
        else:
            start_idx = 0
            start_station = all_stations[0]
            print(f"[DEBUG ISD] No from_station specified, assuming first station: {start_station}")

        if to_station:
            end_station = to_station.upper()
            try:
                end_idx = all_stations.index(end_station)
            except ValueError:
                print(f"[DEBUG ISD] to_station '{end_station}' not found in corridor")
                end_idx = len(all_stations) - 1
        else:
            end_idx = len(all_stations) - 1

        # Determine direction
        if end_idx >= start_idx:
            ordered_stations = all_stations[start_idx:end_idx + 1]
            direction = "forward"
        else:
            ordered_stations = list(reversed(all_stations[end_idx:start_idx + 1]))
            direction = "reverse"

        print(f"[DEBUG ISD] Route: {ordered_stations[0]} → {ordered_stations[-1]} ({len(ordered_stations)} stations, {direction})")

        # Build station_km_map from corridor cumulative distances
        station_km_map = {}
        for i, station in enumerate(all_stations):
            if i < len(corridor_cumulative):
                station_km_map[station] = corridor_cumulative[i]

        # Smart matching: Check if recording starts at from_station or before it
        matched_stations = {}
        start_halt_idx = 0

        if from_station and to_station and from_station in station_km_map and to_station in station_km_map:
            # User provided both stations - check if SPM data matches expected corridor distance
            from_station_km = station_km_map[from_station]
            to_station_km = station_km_map[to_station]

            # Expected distance from corridor
            expected_distance = abs(to_station_km - from_station_km)

            # Actual distance from SPM data
            spm_total_distance = halt_cumulative[-1] - halt_cumulative[0]

            # Compare distances (tolerance: 20% or 3000m, whichever is larger)
            distance_tolerance = max(expected_distance * 0.2, 3000.0)
            distance_diff = abs(spm_total_distance - expected_distance)

            print(f"[DEBUG ISD] Corridor distance {from_station}→{to_station}: {expected_distance:.0f}m")
            print(f"[DEBUG ISD] SPM total distance: {spm_total_distance:.0f}m")
            print(f"[DEBUG ISD] Difference: {distance_diff:.0f}m (tolerance: {distance_tolerance:.0f}m)")

            if distance_diff <= distance_tolerance:
                # SPM data matches corridor distance - recording starts AT from_station
                matched_stations[start_station] = halt_cumulative[0]
                start_halt_idx = 0
                print(f"[DEBUG ISD] Match 1/{len(halts)}: First halt at {halt_cumulative[0]:.0f}m → {start_station} (recording starts here)")
            else:
                # SPM data is longer - recording starts BEFORE from_station
                # Find halt near from_station's corridor position
                best_halt_idx = 0
                best_diff = float('inf')

                for i, halt_dist in enumerate(halt_cumulative):
                    diff = abs(halt_dist - from_station_km)
                    if diff < best_diff:
                        best_diff = diff
                        best_halt_idx = i

                # Match if within 250m tolerance
                if best_diff <= 250:
                    matched_stations[start_station] = halt_cumulative[best_halt_idx]
                    start_halt_idx = best_halt_idx
                    print(f"[DEBUG ISD] Match 1/{len(halts)}: Halt at {halt_cumulative[best_halt_idx]:.0f}m → {start_station} (found in middle, Δ={best_diff:.0f}m)")
                else:
                    print(f"[DEBUG ISD] Warning: from_station {start_station} not found within 250m of any halt (closest: {best_diff:.0f}m)")
                    return {}
        else:
            # No from/to provided or not in corridor - first halt matches first station
            matched_stations[start_station] = halt_cumulative[0]
            start_halt_idx = 0
            print(f"[DEBUG ISD] Match 1/{len(halts)}: First halt at {halt_cumulative[0]:.0f}m → {start_station} (auto-detected)")

        # If only one halt or we're at the last halt, return early
        if len(halts) == 1 or start_halt_idx >= len(halt_cumulative) - 1:
            return {
                'halting_stations': matched_stations,
                'ordered_stations': ordered_stations
            }

        # Match subsequent halts using ISD pattern (simplified algorithm)
        current_station_idx = 0  # Index in ordered_stations (0 = start_station)
        accumulated_isd = 0.0  # Accumulated ISD from unmatched halts/signal stops

        # Start from the halt after the matched start_halt
        for halt_idx in range(start_halt_idx + 1, len(halt_cumulative)):
            halt_isd = halt_cumulative[halt_idx] - halt_cumulative[halt_idx - 1]  # ISD from previous halt to this halt
            accumulated_isd += halt_isd

            # Try to match with next corridor station(s)
            matched = False

            # Look ahead up to 5 stations (handles skipped stations)
            max_lookahead = min(5, len(ordered_stations) - current_station_idx)

            # Debug: track all candidates tried for this halt
            candidates_tried = []

            for lookahead in range(1, max_lookahead):
                candidate_idx = current_station_idx + lookahead
                candidate_station = ordered_stations[candidate_idx]

                # Calculate expected corridor ISD from current to candidate station
                # CSV structure: each column shows ISD FROM previous station TO that station
                expected_isd = 0.0
                try:
                    for i in range(current_station_idx, candidate_idx):
                        station_from = ordered_stations[i]
                        station_to = ordered_stations[i + 1]

                        # Get indices in original corridor
                        idx_from = all_stations.index(station_from)
                        idx_to = all_stations.index(station_to)

                        # ISD is stored at the DESTINATION station (not source)
                        if direction == "forward":
                            # Forward: use ISD at destination station
                            expected_isd += corridor_isds[idx_to]
                        else:
                            # Reverse: use ISD at destination (which has lower index)
                            expected_isd += corridor_isds[idx_from]
                except (ValueError, IndexError) as e:
                    print(f"[DEBUG ISD] Warning: Error calculating corridor ISD: {e}")
                    continue

                # Compare accumulated ISD with expected corridor ISD
                isd_diff = abs(accumulated_isd - expected_isd)

                # Track this candidate for debugging
                candidates_tried.append({
                    'station': candidate_station,
                    'expected_isd': expected_isd,
                    'isd_diff': isd_diff
                })

                if isd_diff <= max_isd_diff:
                    # Match found!
                    actual_cd = halt_cumulative[halt_idx]
                    matched_stations[candidate_station] = actual_cd

                    print(f"[DEBUG ISD] Match {len(matched_stations)}/{len(halts)}: Halt at {actual_cd:.0f}m → {candidate_station} (ISD Δ={isd_diff:.0f}m, expected={expected_isd:.0f}m, actual={accumulated_isd:.0f}m)")

                    if lookahead > 1:
                        skipped = ordered_stations[current_station_idx + 1:candidate_idx]
                        print(f"[DEBUG ISD]   (Skipped stations: {', '.join(skipped)})")

                    # Update state
                    current_station_idx = candidate_idx
                    accumulated_isd = 0.0
                    matched = True
                    break

            if not matched:
                # No match found - keep accumulating (signal stop or GPS drift)
                print(f"[DEBUG ISD] Halt {halt_idx + 1}/{len(halts)} at {halt_cumulative[halt_idx]:.0f}m: No match (ISD={halt_isd:.0f}m, accumulated={accumulated_isd:.0f}m)")

                # Show what candidates were tried and why they didn't match
                if candidates_tried:
                    print(f"[DEBUG ISD]   Tried candidates:")
                    for c in candidates_tried:
                        print(f"[DEBUG ISD]     - {c['station']}: expected={c['expected_isd']:.0f}m, diff={c['isd_diff']:.0f}m (max allowed={max_isd_diff:.0f}m)")

        print(f"[DEBUG ISD] ✓ Matched {len(matched_stations)}/{len(halts)} halts to stations")
        print(f"[DEBUG ISD] Stations matched: {list(matched_stations.keys())}")

        # Return both matched stations and ordered station list (for platform entry calculations)
        return {
            'halting_stations': matched_stations,
            'ordered_stations': ordered_stations
        }

    def detect_and_match(
        self,
        spm_data: pl.DataFrame,
        station_positions: Dict[str, float],
        speed_col: str = 'Speed',
        cum_dist_col: str = 'cumulative_distance',
        max_distance_tolerance: float = 350.0
    ) -> Tuple[List[Dict], Dict[str, float]]:
        """
        Convenience method: detect halts and match to stations in one call.

        Args:
            max_distance_tolerance: Maximum distance (meters) to match halt to station (default: 350m)

        Returns:
            Tuple of (halts_list, halting_station_map)
        """
        halts = self.detect_halts(spm_data, speed_col, cum_dist_col)
        halting_station_map = self.match_halts_to_stations(halts, station_positions, max_distance_tolerance)

        return halts, halting_station_map


def calculate_cumulative_distance(df: pl.DataFrame, distance_col: str = 'Distance') -> pl.DataFrame:
    """
    Calculate cumulative distance from individual distance measurements.

    Args:
        df: Polars DataFrame with distance column
        distance_col: Name of distance column

    Returns:
        DataFrame with added 'cumulative_distance' column
    """
    # Calculate cumulative sum of distances
    df = df.with_columns([
        pl.col(distance_col).cum_sum().alias('cumulative_distance')
    ])

    return df

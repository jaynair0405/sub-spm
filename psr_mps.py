"""
PSR/MPS (Permanent Speed Restrictions / Maximum Permissible Speed) Module

This module implements percentage-based speed restriction calculations that
handle wheel diameter variations elegantly by converting absolute kilometer
positions to percentages within station segments.

Key Innovation: The percentage-based approach solves the wheel diameter problem:
- Worn wheels (larger diameter): Travel 2% more distance for same track
- New wheels (smaller diameter): Travel 2% less distance for same track
- PSR at "54% through segment" works correctly for ALL trains!

Based on: modifiedscripts.js (Google Apps Script implementation)
"""

import json
from typing import Dict, List, Tuple, Optional
from pathlib import Path


class PSRMPSCalculator:
    """
    Calculate Permanent Speed Restrictions (PSR) and Maximum Permissible Speed (MPS)
    for train speed analysis.
    """

    def __init__(self, reference_data_dir: str = "reference_data"):
        """
        Initialize the PSR/MPS calculator.

        Args:
            reference_data_dir: Directory containing segment JSON files
        """
        self.reference_data_dir = Path(reference_data_dir)
        self.segment_limits_cache = {}

    def load_segment_limits(self, train_type: str, corridor: str = None) -> List[Dict]:
        """
        Load segment speed limits based on train type and corridor.

        Args:
            train_type: "fast", "slow", or "thb"
            corridor: Corridor type (future use for more granular selection)

        Returns:
            List of segment limit definitions
        """
        cache_key = f"{train_type}_{corridor or 'default'}"

        if cache_key in self.segment_limits_cache:
            return self.segment_limits_cache[cache_key]

        # Map train type to JSON file
        file_map = {
            "fast": "fast_segments.json",
            "slow": "slow_segments.json",
            "thb": "thb_segments.json",
        }

        if train_type not in file_map:
            raise ValueError(f"Unknown train type: {train_type}. Must be 'fast', 'slow', or 'thb'")

        json_file = self.reference_data_dir / file_map[train_type]

        if not json_file.exists():
            raise FileNotFoundError(f"Segment limits file not found: {json_file}")

        with open(json_file, 'r') as f:
            limits = json.load(f)
        print(f"[DEBUG PSR] Loaded {len(limits)} segments from {json_file.name}")

        self.segment_limits_cache[cache_key] = limits
        return limits

    def calculate_directional_distances(
        self,
        ordered_stations: List[str],
        station_km_map: Dict[str, float],
        halting_station_map: Dict[str, float],
        start_distance: float,
        end_distance: float
    ) -> List[Dict]:
        """
        Calculate enhanced station positions with scaling factor to handle wheel diameter variations.

        This is THE KEY INNOVATION that solves the wheel diameter problem!

        Args:
            ordered_stations: List of station names in route order
            station_km_map: Official kilometer posts for each station
            halting_station_map: Actual detected halt positions {station_name: cumulative_distance}
            start_distance: Actual start distance from SPM data
            end_distance: Actual end distance from SPM data

        Returns:
            List of enhanced station dictionaries with:
                - name: Station name
                - actualCumDist: Actual cumulative distance (scaled)
                - officialKM: Official kilometer post

        Example:
            Official: CSMT=0.1 km, BY=4.04 km, DR=8.85 km (8.75 km span)
            Actual:   CSMT=0 km,   BY=4.12 km, DR=9.02 km (9.02 km span)

            Scaling factor = 9.02 / 8.75 = 1.0309 (3.09% longer - worn wheels!)

            For non-halting station PR (official 7.65 km):
              Official offset: 7.65 - 0.1 = 7.55 km
              Scaled offset: 7.55 × 1.0309 = 7.78 km
              Actual PR position: 0 + 7.78 = 7.78 km ✓
        """
        if not ordered_stations:
            return []

        # Get official kilometer posts for start and end stations
        start_station = ordered_stations[0]
        end_station = ordered_stations[-1]

        start_official_km = station_km_map.get(start_station, 0)
        end_official_km = station_km_map.get(end_station, 0)

        # Calculate scaling factor
        journey_distance = end_distance - start_distance  # Actual distance from SPM data
        official_distance = abs(end_official_km - start_official_km)  # Official distance

        if official_distance == 0:
            scaling_factor = 1.0
        else:
            scaling_factor = journey_distance / official_distance

        # Determine direction (UP or DN based on official KM)
        is_ascending = end_official_km >= start_official_km

        # Get actual start position
        start_actual_dist = halting_station_map.get(start_station, start_distance)

        # Build enhanced stations list
        enhanced_stations = []

        for station_name in ordered_stations:
            official_km = station_km_map.get(station_name, 0)

            # If train actually stopped here, use detected distance
            if station_name in halting_station_map:
                actual_cum_dist = halting_station_map[station_name]
            else:
                # Interpolate using scaling factor
                if is_ascending:
                    official_dist_from_start = official_km - start_official_km
                else:
                    official_dist_from_start = start_official_km - official_km

                scaled_dist_from_start = official_dist_from_start * scaling_factor
                actual_cum_dist = start_actual_dist + scaled_dist_from_start

            enhanced_stations.append({
                'name': station_name,
                'actualCumDist': actual_cum_dist,
                'officialKM': official_km
            })

        return enhanced_stations

    def normalize_position(
        self,
        cum_dist: float,
        enhanced_stations: List[Dict]
    ) -> Optional[Dict[str, any]]:
        """
        Convert absolute cumulative distance to percentage within segment.

        Args:
            cum_dist: Cumulative distance from SPM data (km)
            enhanced_stations: List of enhanced station positions

        Returns:
            Dictionary with:
                - segment: Segment name (e.g., "BY-PR")
                - percentage: Position as percentage (0.0 to 1.0)
            Returns None if position not found

        Example:
            Input: cum_dist = 6.5 km
            Enhanced stations: [CSMT:0, BY:4.12, PR:7.85, DR:9.02, ...]

            Step 1: Find segment - 6.5 is between BY (4.12) and PR (7.85)
                    → segment = "BY-PR"

            Step 2: Calculate percentage
                    segmentLength = 7.85 - 4.12 = 3.73 km
                    positionInSegment = 6.5 - 4.12 = 2.38 km
                    percentage = 2.38 / 3.73 = 0.638 (63.8%)

            Output: {segment: "BY-PR", percentage: 0.638}
        """
        if not enhanced_stations or len(enhanced_stations) < 2:
            return None

        # Find which segment this position falls into
        for i in range(len(enhanced_stations) - 1):
            current = enhanced_stations[i]
            next_station = enhanced_stations[i + 1]

            current_dist = current['actualCumDist']
            next_dist = next_station['actualCumDist']

            # Check if position is in this segment
            if current_dist <= cum_dist < next_dist:
                # Calculate percentage within segment
                segment_length = next_dist - current_dist

                if segment_length == 0:
                    percentage = 0.0
                else:
                    position_in_segment = cum_dist - current_dist
                    percentage = position_in_segment / segment_length

                return {
                    'segment': f"{current['name']}-{next_station['name']}",
                    'percentage': percentage
                }

        # Handle edge case: position is at or after last station
        if cum_dist >= enhanced_stations[-1]['actualCumDist']:
            # Return last segment with percentage 1.0
            if len(enhanced_stations) >= 2:
                return {
                    'segment': f"{enhanced_stations[-2]['name']}-{enhanced_stations[-1]['name']}",
                    'percentage': 1.0
                }

        return None

    def get_speed_limit(
        self,
        position: Dict[str, any],
        segment_limits: List[Dict],
        debug_segments: set = None
    ) -> Optional[int]:
        """
        Get speed limit for a percentage position within a segment.

        Args:
            position: Dictionary with 'segment' and 'percentage' keys
            segment_limits: List of segment limit definitions
            debug_segments: Optional set to track segments with multiple limits

        Returns:
            Speed limit in km/h, or None if not found

        Example:
            Input: position = {segment: "BY-PR", percentage: 0.62}

            Segment limits for "BY-PR":
              { startPct: 0.00, endPct: 0.54, limit: 105 }
              { startPct: 0.54, endPct: 0.64, limit: 70 }  ← 0.62 is here!
              { startPct: 0.64, endPct: 0.91, limit: 105 }
              { startPct: 0.91, endPct: 1.00, limit: 80 }

            Output: 70 km/h
        """
        if not position or 'segment' not in position:
            return None

        segment_name = position['segment']
        percentage = position.get('percentage', 0.0)

        # Find segment definition
        segment_def = None
        for seg in segment_limits:
            if seg['segment'] == segment_name:
                segment_def = seg
                break

        if not segment_def:
            # Segment not found in limits data
            return None

        # Track segments with varying limits (for debugging complex restrictions)
        if debug_segments is not None and len(segment_def['limits']) > 1:
            debug_segments.add(segment_name)

        # Find applicable limit for this percentage
        for limit_range in segment_def['limits']:
            start_pct = limit_range['startPct']
            end_pct = limit_range['endPct']
            limit = limit_range['limit']

            # Check if percentage falls within this range
            # Use >= for start and < for end to handle boundaries correctly
            if start_pct <= percentage < end_pct:
                return limit

            # Special case: handle exactly at end of last range
            if percentage >= end_pct and limit_range == segment_def['limits'][-1]:
                return limit

        return None

    def process_train_speed_limits(
        self,
        spm_data: List[Dict],
        ordered_stations: List[str],
        station_km_map: Dict[str, float],
        halting_station_map: Dict[str, float],
        train_type: str,
        start_distance: float = None,
        end_distance: float = None
    ) -> List[int]:
        """
        Process entire SPM dataset and calculate PSR/MPS for each data point.

        This is the main orchestrator function that ties everything together.

        Args:
            spm_data: List of SPM data rows (each row is a dict with 'cumulative_distance', etc.)
            ordered_stations: List of station names in route order
            station_km_map: Official kilometer posts
            halting_station_map: Detected halt positions
            train_type: "fast", "slow", or "thb"
            start_distance: Override start distance (default: use first row)
            end_distance: Override end distance (default: use last row)

        Returns:
            List of speed limits (PSR/MPS) for each data point

        Flow:
            1. Load segment speed limits for train type
            2. Calculate enhanced stations (with scaling)
            3. For each SPM data point:
               a. Find which segment it's in
               b. Calculate percentage position in segment
               c. Look up speed limit for that percentage
        """
        if not spm_data:
            return []

        # Load segment limits
        segment_limits = self.load_segment_limits(train_type)

        # Get start and end distances
        if start_distance is None:
            start_distance = spm_data[0].get('cumulative_distance', 0)
        if end_distance is None:
            end_distance = spm_data[-1].get('cumulative_distance', 0)

        # Calculate enhanced stations with scaling
        enhanced_stations = self.calculate_directional_distances(
            ordered_stations,
            station_km_map,
            halting_station_map,
            start_distance,
            end_distance
        )

        print(f"[DEBUG PSR] Processing {len(enhanced_stations)} stations from {enhanced_stations[0]['name']} to {enhanced_stations[-1]['name']}")

        # Process each data point
        psr_values = []

        # Debug: Track unique segments and their limits
        segments_found = {}
        debug_segments = set()

        for i, row in enumerate(spm_data):
            cum_dist = row.get('cumulative_distance', 0)

            # Get position as percentage
            position = self.normalize_position(cum_dist, enhanced_stations)

            # Get speed limit
            if position:
                speed_limit = self.get_speed_limit(position, segment_limits, debug_segments)

                # Debug: Log first occurrence of each segment
                seg_name = position.get('segment')
                if seg_name not in segments_found:
                    segments_found[seg_name] = {
                        'first_index': i,
                        'percentage': position.get('percentage'),
                        'limit': speed_limit
                    }
            else:
                speed_limit = None

            psr_values.append(speed_limit)

        # Debug: Print segment summary
        print(f"[DEBUG PSR] Found {len(segments_found)} unique segments, {len(debug_segments)} with variable limits")

        return psr_values


# Utility functions

def detect_violations(spm_data: List[Dict], psr_values: List[int]) -> List[Dict]:
    """
    Detect speed violations where actual speed exceeds PSR/MPS.

    Args:
        spm_data: SPM data with 'speed' and 'cumulative_distance' fields
        psr_values: Calculated PSR/MPS values

    Returns:
        List of violation dictionaries
    """
    violations = []

    for i, (row, psr) in enumerate(zip(spm_data, psr_values)):
        if psr is None:
            continue

        speed = row.get('speed', 0)
        cum_dist = row.get('cumulative_distance', 0)

        if speed > psr:
            overspeed = speed - psr

            # Determine severity
            if overspeed < 5:
                severity = 'minor'
            elif overspeed < 10:
                severity = 'moderate'
            elif overspeed < 20:
                severity = 'severe'
            else:
                severity = 'critical'

            violations.append({
                'index': i,
                'location_km': cum_dist,
                'speed_recorded': speed,
                'speed_limit': psr,
                'overspeed_amount': overspeed,
                'severity': severity
            })

    return violations


def get_severity_color(severity: str) -> str:
    """Get color code for violation severity."""
    colors = {
        'minor': '#FFA500',      # Orange
        'moderate': '#FF6B00',   # Dark Orange
        'severe': '#FF0000',     # Red
        'critical': '#8B0000'    # Dark Red
    }
    return colors.get(severity, '#FF0000')


def detect_overspeed_events(
    spm_data: List[Dict],
    psr_values: List[int],
    threshold_offset: int = 3,
    min_duration: int = 7
) -> List[Dict]:
    """
    Detect overspeed events by grouping consecutive violations.

    Ported from GAS overspeed.js - detectOverspeedingEvents()

    Key features:
    - Groups consecutive overspeed samples into single events
    - Uses threshold = PSR/MPS + offset (default 3 km/h tolerance)
    - Requires minimum consecutive samples to count as event
    - Handles momentary drops (brief compliance within 3 samples)

    Args:
        spm_data: SPM data with 'speed', 'cumulative_distance', 'Time' fields
        psr_values: Calculated PSR/MPS values for each data point
        threshold_offset: Tolerance above PSR/MPS (default 3 km/h)
        min_duration: Minimum consecutive samples for an event (default 7)

    Returns:
        List of overspeed event dictionaries with:
        - event_number: Sequential event number
        - start_time, end_time: Time range of violation
        - start_km, end_km: Distance range of violation
        - duration: Number of samples in event
        - max_speed: Peak speed reached
        - max_excess: Maximum amount over limit
        - psr_value: The speed limit that was exceeded
        - threshold: Actual threshold used (PSR + offset)
        - severity: minor/moderate/severe/critical
    """
    if not spm_data or not psr_values:
        return []

    overspeed_events = []
    current_event = None

    def create_new_event(row, psr, threshold, index):
        """Start tracking a new overspeed event."""
        return {
            'start_index': index,
            'start_time': row.get('Time', ''),
            'start_km': row.get('cumulative_distance', 0),
            'overspeed_values': [row.get('speed', 0)],
            'psr_value': psr,
            'threshold': threshold,
            'times': [row.get('Time', '')],
            'kms': [row.get('cumulative_distance', 0)]
        }

    def extend_event(event, row):
        """Add a sample to the current event."""
        event['overspeed_values'].append(row.get('speed', 0))
        event['times'].append(row.get('Time', ''))
        event['kms'].append(row.get('cumulative_distance', 0))

    def check_for_momentary_drop(data, psr_values, current_index, threshold_offset):
        """Check if overspeed resumes within next 3 samples."""
        check_rows = min(3, len(data) - current_index - 1)
        for j in range(1, check_rows + 1):
            next_psr = psr_values[current_index + j] if current_index + j < len(psr_values) else None
            if next_psr is None:
                continue
            next_threshold = next_psr + threshold_offset
            next_speed = data[current_index + j].get('speed', 0)
            if next_speed > next_threshold:
                return True
        return False

    def finalize_event(event, end_row, event_number):
        """Calculate final stats for a completed event."""
        max_speed = max(event['overspeed_values'])
        excess_speeds = [s - event['psr_value'] for s in event['overspeed_values']]
        max_excess = max(excess_speeds)

        # Determine severity based on max excess
        if max_excess < 5:
            severity = 'minor'
        elif max_excess < 10:
            severity = 'moderate'
        elif max_excess < 20:
            severity = 'severe'
        else:
            severity = 'critical'

        # Convert km if in meters
        start_km = event['start_km']
        end_km = end_row.get('cumulative_distance', 0)
        if start_km > 200:  # Assume meters
            start_km = start_km / 1000
            end_km = end_km / 1000

        return {
            'event_number': event_number,
            'start_time': event['start_time'],
            'end_time': end_row.get('Time', ''),
            'start_km': round(start_km, 2),
            'end_km': round(end_km, 2),
            'duration': len(event['overspeed_values']),
            'max_speed': round(max_speed, 1),
            'max_excess': round(max_excess, 1),
            'psr_value': event['psr_value'],
            'threshold': event['threshold'],
            'severity': severity,
            'start_index': event['start_index'],
            'end_index': event['start_index'] + len(event['overspeed_values']) - 1
        }

    # Main detection loop
    i = 0
    while i < len(spm_data):
        row = spm_data[i]
        speed = row.get('speed', 0)
        psr = psr_values[i] if i < len(psr_values) else None

        if psr is None:
            i += 1
            continue

        threshold = psr + threshold_offset

        if speed > threshold:
            if current_event is None:
                # Start new event
                current_event = create_new_event(row, psr, threshold, i)
            else:
                # Extend current event
                extend_event(current_event, row)
        else:
            # Speed is within limits
            if current_event is not None:
                # Check if event meets minimum duration
                if len(current_event['overspeed_values']) >= min_duration:
                    # Check for momentary drop
                    if not check_for_momentary_drop(spm_data, psr_values, i, threshold_offset):
                        # Finalize event
                        event = finalize_event(current_event, row, len(overspeed_events) + 1)
                        overspeed_events.append(event)
                    else:
                        # Extend through momentary drop
                        for j in range(1, 4):
                            if i + j < len(spm_data):
                                extend_event(current_event, spm_data[i + j])
                        i += 2  # Skip checked rows
                # Reset current event
                current_event = None
        i += 1

    # Handle event at end of data
    if current_event is not None and len(current_event['overspeed_values']) >= min_duration:
        event = finalize_event(current_event, spm_data[-1], len(overspeed_events) + 1)
        overspeed_events.append(event)

    print(f"[DEBUG OVERSPEED] Detected {len(overspeed_events)} overspeed events (threshold: PSR+{threshold_offset}, min samples: {min_duration})")

    return overspeed_events


def get_overspeed_summary(events: List[Dict]) -> Dict:
    """
    Generate summary statistics for overspeed events.

    Args:
        events: List of overspeed event dictionaries

    Returns:
        Summary dictionary with counts and stats
    """
    if not events:
        return {
            'total_events': 0,
            'by_severity': {'minor': 0, 'moderate': 0, 'severe': 0, 'critical': 0},
            'max_excess_overall': 0,
            'max_speed_overall': 0,
            'total_duration': 0
        }

    severity_counts = {'minor': 0, 'moderate': 0, 'severe': 0, 'critical': 0}
    for event in events:
        severity = event.get('severity', 'minor')
        severity_counts[severity] = severity_counts.get(severity, 0) + 1

    return {
        'total_events': len(events),
        'by_severity': severity_counts,
        'max_excess_overall': max(e['max_excess'] for e in events),
        'max_speed_overall': max(e['max_speed'] for e in events),
        'total_duration': sum(e['duration'] for e in events)
    }

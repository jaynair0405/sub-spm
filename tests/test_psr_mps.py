"""
Test script for PSR/MPS implementation
"""

from psr_mps import PSRMPSCalculator, detect_violations

# Initialize calculator
calculator = PSRMPSCalculator()

# Test Case 1: Load segment limits
print("=" * 60)
print("TEST 1: Load Segment Limits")
print("=" * 60)

fast_limits = calculator.load_segment_limits("fast")
print(f"✓ Loaded {len(fast_limits)} fast segments")
print(f"  First segment: {fast_limits[0]['segment']}")
print(f"  Limits: {len(fast_limits[0]['limits'])} speed ranges")

slow_limits = calculator.load_segment_limits("slow")
print(f"✓ Loaded {len(slow_limits)} slow segments")
print(f"  First segment: {slow_limits[0]['segment']}")

thb_limits = calculator.load_segment_limits("thb")
print(f"✓ Loaded {len(thb_limits)} THB segments")
print(f"  First segment: {thb_limits[0]['segment']}")

# Test Case 2: Calculate Directional Distances
print("\n" + "=" * 60)
print("TEST 2: Calculate Directional Distances (Wheel Diameter Scaling)")
print("=" * 60)

# Mock data: CSMT → BY → PR → DR
ordered_stations = ["CSMT", "BY", "PR", "DR"]
station_km_map = {
    "CSMT": 0.1,
    "BY": 4.04,
    "PR": 7.65,
    "DR": 8.85
}

# Simulated actual halts (worn wheels - 2% longer)
halting_station_map = {
    "CSMT": 0.0,
    "BY": 4.12,    # Actually detected at 4.12 km
    "DR": 9.02     # Actually detected at 9.02 km
}

start_distance = 0.0
end_distance = 9.02

enhanced_stations = calculator.calculate_directional_distances(
    ordered_stations,
    station_km_map,
    halting_station_map,
    start_distance,
    end_distance
)

print("Official vs Actual positions:")
for station in enhanced_stations:
    print(f"  {station['name']:6s}: Official={station['officialKM']:5.2f} km, "
          f"Actual={station['actualCumDist']:5.2f} km")

# Calculate scaling factor
official_distance = abs(station_km_map["DR"] - station_km_map["CSMT"])
actual_distance = end_distance - start_distance
scaling_factor = actual_distance / official_distance
print(f"\nScaling factor: {scaling_factor:.4f} ({(scaling_factor-1)*100:+.2f}% wheel wear)")

# Test Case 3: Normalize Position
print("\n" + "=" * 60)
print("TEST 3: Normalize Position (km → percentage)")
print("=" * 60)

test_positions = [
    0.0,   # At CSMT
    2.0,   # Between CSMT-BY
    4.12,  # At BY
    6.5,   # Between BY-PR
    7.81,  # Near PR
    9.02   # At DR
]

for cum_dist in test_positions:
    position = calculator.normalize_position(cum_dist, enhanced_stations)
    if position:
        print(f"  {cum_dist:5.2f} km → {position['segment']:10s} at {position['percentage']*100:5.1f}%")
    else:
        print(f"  {cum_dist:5.2f} km → Not found")

# Test Case 4: Get Speed Limit
print("\n" + "=" * 60)
print("TEST 4: Get Speed Limit for Positions")
print("=" * 60)

# Load fast segment limits
segment_limits = calculator.load_segment_limits("fast")

# Test specific positions
test_cases = [
    {"segment": "CSMT-BY", "percentage": 0.05, "expected": 30},
    {"segment": "CSMT-BY", "percentage": 0.50, "expected": 105},
    {"segment": "BY-PR", "percentage": 0.30, "expected": 105},
    {"segment": "BY-PR", "percentage": 0.60, "expected": 70},   # PSR dip!
    {"segment": "BY-PR", "percentage": 0.80, "expected": 105},
]

for test in test_cases:
    limit = calculator.get_speed_limit(test, segment_limits)
    status = "✓" if limit == test['expected'] else "✗"
    print(f"  {status} {test['segment']:10s} at {test['percentage']*100:5.1f}% "
          f"→ {limit} km/h (expected {test['expected']})")

# Test Case 5: Process Full SPM Data
print("\n" + "=" * 60)
print("TEST 5: Process Full SPM Data")
print("=" * 60)

# Mock SPM data
spm_data = [
    {'cumulative_distance': 0.0, 'speed': 15},
    {'cumulative_distance': 0.5, 'speed': 25},
    {'cumulative_distance': 1.0, 'speed': 35},
    {'cumulative_distance': 2.0, 'speed': 65},
    {'cumulative_distance': 3.0, 'speed': 95},
    {'cumulative_distance': 4.0, 'speed': 105},
    {'cumulative_distance': 5.0, 'speed': 110},  # Might violate
    {'cumulative_distance': 6.0, 'speed': 75},   # Within PSR dip
    {'cumulative_distance': 7.0, 'speed': 100},
    {'cumulative_distance': 8.0, 'speed': 105},
    {'cumulative_distance': 9.0, 'speed': 80},
]

psr_values = calculator.process_train_speed_limits(
    spm_data,
    ordered_stations,
    station_km_map,
    halting_station_map,
    train_type="fast",
    start_distance=0.0,
    end_distance=9.02
)

print("SPM Data with PSR/MPS:")
print(f"  {'Dist (km)':>10s} {'Speed':>8s} {'PSR/MPS':>8s} {'Status':>10s}")
print("  " + "-" * 40)
for row, psr in zip(spm_data, psr_values):
    dist = row['cumulative_distance']
    speed = row['speed']
    status = "OK" if psr and speed <= psr else "VIOLATION!" if psr else "N/A"
    psr_str = str(psr) if psr else "N/A"
    print(f"  {dist:10.2f} {speed:8d} {psr_str:>8s} {status:>10s}")

# Test Case 6: Detect Violations
print("\n" + "=" * 60)
print("TEST 6: Violation Detection")
print("=" * 60)

violations = detect_violations(spm_data, psr_values)
print(f"Found {len(violations)} violations:")

for v in violations:
    print(f"  • At {v['location_km']:.2f} km: {v['speed_recorded']} km/h "
          f"(limit: {v['speed_limit']}) → +{v['overspeed_amount']} km/h "
          f"[{v['severity'].upper()}]")

print("\n" + "=" * 60)
print("✅ ALL TESTS COMPLETED!")
print("=" * 60)
print("\nNext steps:")
print("1. Integrate with halt detection logic")
print("2. Add PSR column to analysis results in main.py")
print("3. Update ECharts config to show green PSR/MPS area")
print("4. Test with real SPM data from sample files")

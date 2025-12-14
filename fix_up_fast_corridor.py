#!/usr/bin/env python3
"""
Fix UPFASTLOCALS.csv by filling in missing inter-station distances from UPSLOWLOCALS.csv
"""

import csv

# Read slow corridor data
with open('Sub  SPM Data Analysis - UPSLOWLOCALS.csv', 'r') as f:
    reader = csv.reader(f)
    slow_header = next(reader)
    slow_stations = slow_header[1:]  # Skip 'Record Number'
    slow_records = list(reader)

# Read fast corridor data
with open('UPFASTLOCALS.csv', 'r') as f:
    reader = csv.reader(f)
    fast_header = next(reader)
    fast_stations = fast_header[1:]  # Skip 'Record Number'
    fast_records = list(reader)

print(f"Slow corridor has {len(slow_stations)} stations")
print(f"Fast corridor has {len(fast_stations)} stations")

# Create station index map for slow corridor
slow_idx = {station: i for i, station in enumerate(slow_stations)}

# Process each fast record
corrected_records = []
for record_idx, fast_record in enumerate(fast_records):
    record_num = fast_record[0]
    fast_isds = [float(val) if val.strip() else 0.0 for val in fast_record[1:]]

    # Get corresponding slow record
    slow_record = slow_records[record_idx] if record_idx < len(slow_records) else slow_records[0]
    slow_isds = [float(val) if val.strip() else 0.0 for val in slow_record[1:]]

    # Build corrected ISDs for fast corridor
    corrected_isds = []

    for i, fast_station in enumerate(fast_stations):
        fast_isd = fast_isds[i]

        # First station is always 0 (starting point)
        if i == 0:
            corrected_isds.append(0.0)
        elif fast_isd != 0.0:
            # Fast corridor has a value, use it
            corrected_isds.append(fast_isd)
        else:
            # Fast corridor has empty cell (0), calculate from slow corridor
            # The column value is the distance FROM the previous station TO this station
            prev_fast_station = fast_stations[i - 1] if i > 0 else None

            if prev_fast_station and prev_fast_station in slow_idx and fast_station in slow_idx:
                start_idx = slow_idx[prev_fast_station]
                end_idx = slow_idx[fast_station]

                # Sum all ISDs between these stations in slow corridor
                # Use [start_idx+1:end_idx+1] to get the correct range
                total_distance = sum(slow_isds[start_idx+1:end_idx+1])
                corrected_isds.append(total_distance)
            else:
                corrected_isds.append(0.0)

    corrected_records.append([record_num] + corrected_isds)

# Write corrected file
with open('UPFASTLOCALS_corrected.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(fast_header)
    for record in corrected_records:
        # Format distances as integers
        formatted = [record[0]] + [str(int(val)) if val != 0 else '' for val in record[1:]]
        writer.writerow(formatted)

print("\nCorrected file written to UPFASTLOCALS_corrected.csv")

#!/usr/bin/env python3
"""
Merge SE and Main line corridors at KYN junction to create full SE-CSMT corridors.

Creates 4 combined corridor files:
1. UPFULLSE_LOCAL.csv = UPLOCALSSE + UPSLOWLOCALS
2. UPFULLSE_FAST.csv = UPLOCALSSE + UPFASTLOCALS
3. DNFULLSE_LOCAL.csv = DNSLOWLOCALS + DNLOCALSSE
4. DNFULLSE_FAST.csv = DNFASTLOCALS + DNLOCALSSE
"""

import csv
from pathlib import Path
from typing import List, Tuple


def read_corridor_csv(filepath: Path) -> Tuple[List[str], List[List[str]]]:
    """Read corridor CSV and return headers and data rows."""
    with open(filepath, 'r', newline='') as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        raise ValueError(f"{filepath} is empty")

    headers = rows[0]
    data_rows = rows[1:]

    return headers, data_rows


def merge_corridors_at_junction(
    regional_file: Path,
    main_file: Path,
    output_file: Path,
    junction_station: str = "KYN",
    direction: str = "UP"
):
    """
    Merge two corridor files at a junction station.

    For UP: Regional portion (SE→KYN) + Main portion (KYN→CSMT)
    For DN: Main portion (CSMT→KYN) + Regional portion (KYN→SE)
    """
    print(f"\n{'='*60}")
    print(f"Merging: {regional_file.name} + {main_file.name}")
    print(f"Junction: {junction_station}, Direction: {direction}")
    print(f"Output: {output_file.name}")
    print(f"{'='*60}")

    # Read both corridor files
    regional_headers, regional_rows = read_corridor_csv(regional_file)
    main_headers, main_rows = read_corridor_csv(main_file)

    # Extract station names (skip "Record Number" column)
    regional_stations = [h.strip() for h in regional_headers[1:] if h.strip()]
    main_stations = [h.strip() for h in main_headers[1:] if h.strip()]

    print(f"\nRegional stations ({len(regional_stations)}): {regional_stations}")
    print(f"Main stations ({len(main_stations)}): {main_stations}")

    # Find junction station index in both corridors
    if junction_station not in regional_stations:
        raise ValueError(f"{junction_station} not found in {regional_file.name}")
    if junction_station not in main_stations:
        raise ValueError(f"{junction_station} not found in {main_file.name}")

    regional_junction_idx = regional_stations.index(junction_station)
    main_junction_idx = main_stations.index(junction_station)

    print(f"\nJunction '{junction_station}' found:")
    print(f"  - In {regional_file.name} at index {regional_junction_idx}")
    print(f"  - In {main_file.name} at index {main_junction_idx}")

    # Build merged station list
    if direction == "UP":
        # UP: Regional → KYN → CSMT
        # Take regional stations up to (but not including) KYN, then all Main stations
        merged_stations = regional_stations[:regional_junction_idx] + main_stations
    else:
        # DN: CSMT → KYN → Regional
        # Take Main stations up to (but not including) KYN, then all regional stations
        merged_stations = main_stations[:main_junction_idx] + regional_stations

    print(f"\nMerged stations ({len(merged_stations)}): {merged_stations}")

    # Build merged header
    merged_header = ["Record Number"] + merged_stations

    # Merge data rows
    # We'll use the maximum number of records from both files
    max_records = max(len(regional_rows), len(main_rows))
    merged_rows = []

    for i in range(max_records):
        record_num = i + 1
        merged_row = [str(record_num)]

        # Get data from both files (or use empty if record doesn't exist)
        regional_row = regional_rows[i][1:] if i < len(regional_rows) else [''] * len(regional_stations)
        main_row = main_rows[i][1:] if i < len(main_rows) else [''] * len(main_stations)

        if direction == "UP":
            # UP: Regional portion (to KYN inclusive) + Main portion (after KYN to CSMT)
            regional_portion = regional_row[:regional_junction_idx + 1]  # Include distance to KYN
            main_portion = main_row[1:]  # Skip Main's KYN starting 0 (redundant)
            merged_row.extend(regional_portion)
            merged_row.extend(main_portion)
        else:
            # DN: Main portion (CSMT to KYN inclusive) + Regional portion (after KYN)
            main_portion = main_row[:main_junction_idx + 1]  # Include distance TO KYN
            regional_portion = regional_row[1:]  # Skip Regional's KYN starting 0 (redundant)
            merged_row.extend(main_portion)
            merged_row.extend(regional_portion)

        merged_rows.append(merged_row)

    # Write merged corridor file
    with open(output_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(merged_header)
        writer.writerows(merged_rows)

    print(f"\n✓ Created {output_file.name} with {len(merged_rows)} records and {len(merged_stations)} stations")


def main():
    data_root = Path(__file__).parent

    # Define file paths
    files = {
        'up_se': data_root / 'UPLOCALSSE.csv',
        'up_slow': data_root / 'Sub  SPM Data Analysis - UPSLOWLOCALS.csv',
        'up_fast': data_root / 'UPFASTLOCALS.csv',
        'dn_se': data_root / 'DNLOCALSSE.csv',
        'dn_slow': data_root / 'DNSLOWLOCALS.csv',
        'dn_fast': data_root / 'DNFASTLOCALS.csv',
    }

    # Check all files exist
    for name, filepath in files.items():
        if not filepath.exists():
            print(f"ERROR: {filepath.name} not found!")
            return

    print("All input files found ✓")

    # Create merged corridors
    try:
        # 1. UP Local: UPLOCALSSE + UPSLOWLOCALS
        merge_corridors_at_junction(
            regional_file=files['up_se'],
            main_file=files['up_slow'],
            output_file=data_root / 'UPFULLSE_LOCAL.csv',
            junction_station='KYN',
            direction='UP'
        )

        # 2. UP Fast: UPLOCALSSE + UPFASTLOCALS
        merge_corridors_at_junction(
            regional_file=files['up_se'],
            main_file=files['up_fast'],
            output_file=data_root / 'UPFULLSE_FAST.csv',
            junction_station='KYN',
            direction='UP'
        )

        # 3. DN Local: DNSLOWLOCALS + DNLOCALSSE
        merge_corridors_at_junction(
            regional_file=files['dn_se'],
            main_file=files['dn_slow'],
            output_file=data_root / 'DNFULLSE_LOCAL.csv',
            junction_station='KYN',
            direction='DN'
        )

        # 4. DN Fast: DNFASTLOCALS + DNLOCALSSE
        merge_corridors_at_junction(
            regional_file=files['dn_se'],
            main_file=files['dn_fast'],
            output_file=data_root / 'DNFULLSE_FAST.csv',
            junction_station='KYN',
            direction='DN'
        )

        print("\n" + "="*60)
        print("✓ All 4 SE full corridor files created successfully!")
        print("="*60)

    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()

# SPM Analysis App - Debug Output Guide

This document explains the debug output produced by the SPM analysis application to help troubleshoot issues with route detection, halt matching, and PSR calculation.

## Debug Output Overview

The application produces debug output in the following areas:
1. **Route Detection** - Corridor and train type identification
2. **Station Range Selection** - From/to station filtering
3. **Halt Detection** - GPS halt matching to corridor stations
4. **PSR Calculation** - Speed restriction assignment

---

## 1. Route Detection

```
[DEBUG] Looking for corridor: 'DNFULLSE_FAST'
[DEBUG] Available corridors: ['UPFULLNE_FAST', 'DNFULLNE_FAST', ...]
[DEBUG] Corridor found! Stations: ['CSMT', 'BY', 'PR', 'DR', 'MTN']...
```

**What it means:**
- Shows which corridor is being used based on train code and from/to stations
- Lists available corridors in the system
- Confirms the corridor was found and shows first 5 stations

**Troubleshooting:**
- If corridor not found, check train code mapping in `Sub  SPM Data Analysis - All Locals.csv`
- Verify corridor files exist in the data directory
- Check if from/to stations match the expected corridor (NE vs SE)

---

## 2. Station Range Selection

```
[DEBUG] Target station range from form: CSMT→KYN (17 stations)
```
OR
```
[DEBUG] Using all 31 corridor stations (no from/to provided)
```

**What it means:**
- Shows the from/to stations provided in the upload form
- Number of stations indicates the route length being analyzed
- If no from/to provided, uses entire corridor

**Troubleshooting:**
- **Critical:** Ensure to_station matches where SPM data actually ends
- Example: If data ends at KYN but to_station=BUD, PSR calculation will fail
- Symptom: Stations out of order (e.g., MTN actualCumDist < DR actualCumDist)
- Fix: Set to_station to the last station where train actually stopped

**Common Error:**
```
Form inputs: from_station='CSMT', to_station='BUD'
Last halt: KYN at 53416m
Result: Incorrect scaling factor (0.795 instead of ~1.0)
```
This happens when to_station extends beyond actual SPM data coverage.

---

## 3. Station KM Maps

```
[DEBUG] Loading official station KM map for train_type=fast...
[DEBUG] Loaded official KM map with 31 stations (for PSR officialKM)
[DEBUG] Target from_station CSMT at 100m
[DEBUG] Target to_station KYN at 53210m
```

**What it means:**
- Shows which station KM map is loaded (fast/slow/thb)
- Number of stations in the official KM reference
- Official kilometer posts for the from/to stations

**Troubleshooting:**
- Fast trains should load fast_station_km_map (fewer stations)
- Slow trains should load slow_station_km_map (all stations)
- If wrong map loaded, check train_type detection based on train code prefix

---

## 4. Halt Detection

```
[DEBUG] Detected 9 raw halts at: ['0m', '4228m', '9068m', ..., '53416m']
[DEBUG] Matching halts to stations using ISD algorithm...
[DEBUG] Matched 8/9 halts to stations
[DEBUG] Halting stations: ['CSMT', 'BY', 'DR', 'CLA', 'GC', 'TNA', 'DI', 'KYN']
```

**What it means:**
- Raw halts: GPS positions where speed=0 and distance=0
- Matched halts: Halts successfully matched to corridor stations using ISD
- Halting stations: Final list of stations where train stopped

**Troubleshooting:**
- If halts not matched, check ISD tolerance (currently 150m)
- Unmatched halts may indicate non-corridor stops or data errors
- Compare number of halts vs number of stations - they should be close

---

## 5. PSR Calculation

```
[DEBUG] Starting PSR calculation for train_type=fast...
[DEBUG] Using 17 corridor stations for PSR (not just halting stations)
[DEBUG PSR] Loaded 178 segments from fast_segments.json
[DEBUG PSR] Processing 17 stations from CSMT to KYN
[DEBUG PSR] Found 16 unique segments, 8 with variable limits
[DEBUG] PSR calculation complete! Got 4099 values
```

**What it means:**
- **Corridor stations**: Number of stations used for PSR (should match target range)
- **Segments loaded**: Total segment definitions in the JSON file
- **Processing stations**: Confirms start and end of PSR calculation
- **Unique segments found**: Segments that had SPM data points
- **Variable limits**: Segments with multiple speed restrictions (PSRs)
- **PSR values**: One speed limit value per SPM data point

**Troubleshooting:**

### Expected Values:
- CSMT→KYN (17 stations) should find **16 segments** (pairs of consecutive stations)
- Fast corridor should load **178 segments** from fast_segments.json
- Number of PSR values should equal number of SPM data rows

### Common Issues:

**Issue 1: Wrong number of segments found**
```
Expected: 16 segments (17 stations)
Found: 8 segments
```
**Cause:** Station range mismatch - to_station extends beyond SPM data
**Fix:** Adjust to_station to match actual data coverage

**Issue 2: Stations out of order**
```
Enhanced stations show:
  DR: actualCumDist=9068m
  MTN: actualCumDist=7969m  ← Less than DR!
```
**Cause:** Scaling factor calculated incorrectly due to range mismatch
**Fix:** Ensure psr_stations matches SPM data extent

**Issue 3: Wrong segments file loaded**
```
Fast train loading slow_segments.json
```
**Cause:** Train type detection error
**Fix:** Check train code prefix in FAST_PREFIXES set (corridor_loader.py)

---

## 6. Data Adjustment

```
[DEBUG] Adjusted halting stations: {'CSMT': 0.0, 'BY': 4228.0, ..., 'KYN': 53416.0}
[DEBUG] Adjusted station KM map for PSR: 17 stations
```

**What it means:**
- Halting stations are adjusted to start from 0m (relative to first halt)
- Station KM map is also adjusted by subtracting start distance
- This normalization allows PSR calculation to work on any segment

**Troubleshooting:**
- If adjusted values look wrong, check data filtering in main.py
- Ensure cumulative_distance calculation is working correctly

---

## Quick Troubleshooting Checklist

### PSR Calculation Issues:

1. **Check station range match:**
   - to_station should match where SPM data ends
   - Look at last halt position vs to_station official KM
   - Scaling factor should be ~1.0 (0.98-1.02), not 0.79 or other extreme values

2. **Verify train type detection:**
   - Fast trains: prefix in {950-959}
   - Slow NE: prefix in {964-966}
   - Slow SE: prefix in {960-963}
   - Check corridor name matches train type (FAST vs LOCAL)

3. **Check segments file:**
   - Fast trains → fast_segments.json (178 segments)
   - Slow trains → slow_segments.json
   - THB trains → thb_segments.json

4. **Verify station KM map:**
   - Fast trains use fast_station_km_map (31 stations)
   - Slow trains use slow_station_km_map (126 stations)
   - All corridor stations should be in the KM map

### Expected Debug Flow:

For a successful CSMT→KYN fast train analysis:
```
✓ Corridor: DNFULLSE_FAST or DNFULLNE_FAST
✓ Train type: fast
✓ Station range: 17 stations (CSMT to KYN)
✓ Segments file: fast_segments.json (178 segments)
✓ KM map: 31 stations
✓ Halts detected: 8-10 halts
✓ PSR segments found: 16 segments
✓ Scaling factor: ~1.0 (calculated from first/last halt)
```

---

## Notes

- All debug output is prefixed with `[DEBUG]` or `[DEBUG PSR]`
- Debug output can be disabled by removing print statements in main.py and psr_mps.py
- For production use, consider implementing proper logging with levels (INFO, DEBUG, ERROR)
- Current implementation uses console output for simplicity

---

## See Also

- `corridor_loader.py` - Route detection and train code mapping
- `psr_mps.py` - PSR calculation algorithm
- `station_km_maps.py` - Official kilometer post references
- `reference_data/fast_segments.json` - Fast train speed restrictions

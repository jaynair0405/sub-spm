# Semi-Fast Train Implementation

## Overview

Semi-fast trains are coded as FAST but run on the SLOW line for certain sections of their journey. This implementation handles the corridor switching for accurate ISD matching and PSR calculation.

## What are Semi-Fast Trains?

- Train code prefix indicates FAST (950-959)
- But they stop at slow-only stations for part of the journey
- Example: TL 21, DK 7, AN 27, DK 2, K 129

### Slow-Only Markers

These stations only exist on the slow line:
- **KOPR, THK** - Between TNA and KYN (change point: TNA)
- **KJRD, NHU** - Between GC and MLND (change point: GC)

## Implementation Details

### 1. Detection (corridor_loader.py)

Added `SLOW_MARKERS` configuration and `detect_semi_fast()` method:

```python
SLOW_MARKERS = {
    'KOPR': 'TNA',  # If has KOPR, switch to slow at TNA
    'THK': 'TNA',   # If has THK, switch to slow at TNA
    'KJRD': 'GC',   # If has KJRD, switch to slow at GC
    'NHU': 'GC',    # If has NHU, switch to slow at GC
}
```

Returns:
- `is_semi_fast`: True if slow markers found
- `change_point`: Station where corridor switches (TNA or GC)
- `markers_found`: List of slow-only stations in halt list

### 2. ISD Matching (halt_detection.py)

Modified `match_halts_using_isd()` to accept:
- `slow_corridor_data`: The LOCAL corridor data for slow line ISDs
- `semi_fast_info`: Detection info with change point

Logic:
- Before change_point: Use FAST corridor ISDs
- After change_point: Use LOCAL corridor ISDs
- Fallback: If station not in primary corridor, try alternative

### 3. PSR Calculation (psr_mps.py)

Modified `process_train_speed_limits()` to accept:
- `semi_fast_info`: Detection info for semi-fast handling

Logic:
- Load both fast_segments.json and slow_segments.json
- Try fast segments first
- Fallback to slow segments if segment not found
- Log which segments used fallback

### 4. Main Integration (main.py)

When semi-fast is detected:
1. Load corresponding LOCAL corridor (e.g., UPFULLNE_FAST → UPFULLNE_LOCAL)
2. Pass `slow_corridor_data` and `semi_fast_info` to halt matching
3. Pass `semi_fast_info` to PSR calculator

## Files Modified

| File | Changes |
|------|---------|
| corridor_loader.py | Added SLOW_MARKERS, detect_semi_fast() method |
| halt_detection.py | Added slow_corridor_data, semi_fast_info params, corridor switching logic |
| psr_mps.py | Added semi_fast_info param, fallback segment lookup |
| main.py | Load dual corridors, pass semi_fast_info to functions |

## Debug Logging

The implementation adds detailed logging:
- `[DEBUG] SEMI-FAST train detected!`
- `[DEBUG]   Change point: TNA`
- `[DEBUG]   Slow markers found: ['KOPR', 'THK']`
- `[DEBUG] SEMI-FAST: Loaded slow corridor UPFULLNE_LOCAL with 37 stations`
- `[DEBUG PSR] SEMI-FAST: Used slow segment fallback for: TNA-KLVA, DW-KOPR`

## TODO - Testing Required

- [ ] Test with TL 21 SPM data (CSMT-KYN semi-fast)
- [ ] Test with DK 7 SPM data
- [ ] Verify ISD matching works correctly after change point
- [ ] Verify PSR values are correct for slow-line sections
- [ ] Test DN direction semi-fast trains (KYN-CSMT)
- [ ] Verify platform entry speed calculation uses correct positions

## Example Semi-Fast Train: TL 21

Halt pattern from Fast Locals.csv:
```
CSMT, DR, CRD, CLA, GC, TNA, KLVA, MBQ, DW, KOPR, DI, THK, KYN
```

Expected behavior:
- Detected as semi-fast due to KOPR, THK in halts
- Change point: TNA
- Before TNA: Use FAST corridor ISDs (CSMT→DR→CRD→CLA→GC→TNA)
- After TNA: Use LOCAL corridor ISDs (TNA→KLVA→MBQ→DW→KOPR→DI→THK→KYN)

## Station Code Fixes (Related)

Fixed station code inconsistencies during this work:
- KOPAR → KOPR (21 occurrences in Fast Locals.csv)
- KJMG → KJRD (in reference data files)
- NHR → NHU (in reference data files)

---
*Implementation Date: January 2026*

# SPM Analysis System - Corridor Management Redesign

**Document Version:** 1.0
**Date:** December 5, 2025
**Project:** Central Railway Mumbai - SPM Performance Monitoring System

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current System Analysis](#current-system-analysis)
3. [Identified Limitations](#identified-limitations)
4. [Proposed Solution](#proposed-solution)
5. [New File Structure](#new-file-structure)
6. [Corridor Selection Logic](#corridor-selection-logic)
7. [Lookup Tables Design](#lookup-tables-design)
8. [Implementation Plan](#implementation-plan)
9. [Benefits & Impact](#benefits--impact)
10. [Technical Specifications](#technical-specifications)

---

## Executive Summary

### Current Problem
The existing SPM analysis system requires **split analysis for long-distance routes** (e.g., CSMT-KSRA) and has **16+ separate corridor CSV files** with significant data redundancy and complex routing logic.

### Proposed Solution
**Unified corridor management** with:
- Combined route files (e.g., CSMT-KSRA in single file)
- Type-based differentiation (Fast/Slow in same file)
- Direct train-to-corridor lookup table
- Station index-based segment selection
- Reduced file count from 16+ to 6 files (62% reduction)

### Key Benefit
**Single unified analysis** for complete journeys instead of split reports.

---

## Current System Analysis

### Current File Structure (14+ files)
```
├── UPFASTLOCALS.csv          # Fast locals UP main
├── DNFASTLOCALS.csv          # Fast locals DN main
├── UPSLOWLOCALS.csv          # Slow locals UP main
├── DNSLOWLOCALS.csv          # Slow locals DN main
├── UPLOCALSSE.csv            # Slow locals UP South-East
├── DNLOCALSSE.csv            # Slow locals DN South-East
├── UPLOCALSNE.csv            # Slow locals UP North-East
├── DNLOCALSNE.csv            # Slow locals DN North-East
├── UPHARBOUR.csv             # Harbour line UP
├── DNHARBOUR.csv             # Harbour line DN
├── UPTHB_PNVL.csv            # Trans-Harbour UP to PNVL
├── DNTHB_PNVL.csv            # Trans-Harbour DN from PNVL
├── UPTHB_VSH.csv             # Trans-Harbour UP to VSH_THB
└── DNTHB_VSH.csv             # Trans-Harbour DN from VSH_THB
```

### Current Corridor Selection Logic (routeselector.js:1824-1894)

**Priority Order:**
1. **Special Cases**: 987XX (GMN), 989XX (GMN/Harbour hybrid)
2. **Station Routing**: If both from/to in same section (SE/NE) → LOCALSSE/LOCALSNE
3. **Train Code Prefix Fallback**:
   - 950-959 → FASTLOCALS
   - 960-963 → LOCALSSE
   - 964-966 → LOCALSNE
   - 970-976 → SLOWLOCALS
   - 980-989 → HARBOUR
   - 990-995 → Trans-Harbour variants

### Current Data Flow
```
User uploads run → System determines corridor → Loads corridor CSV →
Analyzes against baseline → Generates report
```

---

## Identified Limitations

### 1. **Split Analysis Problem**

**Scenario:** Train runs CSMT → KSRA (61.5 km)

**Current Process:**
```
Step 1: Upload CSMT→KYN segment
        ↓
        Analyze against UPLOCALSNE.csv (0-53 km)
        ↓
        Generate Report 1 (partial)

Step 2: Upload KYN→KSRA segment
        ↓
        Analyze against different corridor
        ↓
        Generate Report 2 (partial)

❌ Two separate uploads
❌ Two separate reports
❌ No unified journey view
❌ Incomplete performance metrics
❌ Brake tests split across reports
❌ Overspeeding events fragmented
```

**Impact:** Cannot analyze complete long-distance journeys in single run.

### 2. **Data Redundancy**

- CSMT-KYN section duplicated across:
  - UPFASTLOCALS.csv
  - UPSLOWLOCALS.csv
  - UPLOCALSSE.csv
  - UPLOCALSNE.csv
- Updates to CSMT-KYN distances must be applied to 4+ files

### 3. **File Management Overhead**

- 16+ corridor files to maintain
- Inconsistent naming conventions
- Difficult to add new routes

### 4. **Complex Routing Logic**

- 3-tier priority system
- Prefix-based + station-based + edge cases
- Difficult to debug routing errors

---

## Proposed Solution

### Core Concepts

#### 1. **Combined End-to-End Route Files**
Create complete journey corridors:
- CSMT-KSRA.csv (entire CSMT→KYN→KSRA route)
- CSMT-KHPI.csv (entire CSMT→KYN→KHPI route)
- CSMT-KJT.csv (entire CSMT→KYN→KJT route)

**Benefit:** Single file per complete route, no mid-journey corridor switching.

#### 2. **Type-Based Consolidation**
Combine Fast/Slow variants in single file using Type column:
```csv
Type,Station1,Station2,Station3,...
1,CSMT,BY,CHG,CRD,PR,DR,MTN,...     # Type 1 = Slow (all stops)
2,CSMT,BY,DR,SION,KYN,...           # Type 2 = Fast (skip stations)
```

**Benefit:** Single source of truth for station distances.

#### 3. **Direct Train-to-Corridor Lookup**
Explicit mapping table:
```csv
Train,Type,Route,Direction,Notes
K40,2,MAIN,UP,Fast local CSMT-KYN
N7,1,NE,DN,Slow local KYN-KSRA via NE
S8,1,SE,UP,Slow local when NRL-KYN route
V13,0,HARBOUR,DN,Harbour line
```

**Benefit:** Fast O(1) lookup, no complex prefix logic needed.

#### 4. **Station Index-Based Segment Selection**
Extract partial routes from complete corridor:
```python
def get_route_segment(corridor, from_station, to_station):
    from_idx = corridor.stations.index(from_station)
    to_idx = corridor.stations.index(to_station)
    return corridor[from_idx:to_idx+1]
```

**Use Case:** User uploads KYN→KSRA run. System loads CSMT-KSRA.csv, extracts KYN→KSRA segment.

---

## New File Structure

### Proposed File Organization (6 files)

```
├── UPLOCALS.csv              # All UP local routes (Type + Route columns)
│   ├── Type 1, Route MAIN    # Slow main line
│   ├── Type 2, Route MAIN    # Fast main line
│   ├── Type 1, Route SE      # Slow South-East (CSMT-KYN-KHPI)
│   └── Type 1, Route NE      # Slow North-East (CSMT-KYN-KSRA)
│
├── DNLOCALS.csv              # All DN local routes (Type + Route columns)
│
├── UPHARBOUR.csv             # Harbour line UP
│   └── Stations: VSH, NEU, SNPD, JNJ (no _THB suffix)
│
├── DNHARBOUR.csv             # Harbour line DN
│
├── UPTHB.csv                 # Trans-Harbour UP (Route: PNVL/VSH)
│   ├── Route PNVL            # PNVL → TUH → TNA
│   ├── Route VSH             # VSH_THB → TUH → TNA
│   └── Stations: VSH_THB, NEU_THB (with _THB suffix)
│
└── DNTHB.csv                 # Trans-Harbour DN (Route: PNVL/VSH)
```

**File Count:** 6 files (vs 14+ previously)
**Reduction:** 57% fewer files

---

## Corridor Selection Logic

### New Priority System

```python
def resolve_corridor(train_no, from_stn, to_stn):
    """
    Priority:
    1. Direct lookup table
    2. Edge case logic (GMN trains, etc.)
    3. Station-based fallback
    """

    # Priority 1: Direct Lookup
    if train_no in train_corridor_map:
        lookup = train_corridor_map[train_no]
        corridor_file = get_corridor_file(lookup)

    # Priority 2: Edge Cases
    elif is_gmn_train(train_no):
        corridor_file = resolve_gmn_corridor(train_no, from_stn, to_stn)

    # Priority 3: Station-Based Fallback
    else:
        corridor_file = resolve_by_stations(from_stn, to_stn)

    # Extract segment if partial route
    corridor_data = load_corridor(corridor_file)
    return get_route_segment(corridor_data, from_stn, to_stn)
```

### Edge Cases Preserved

**GMN Trains (987XX, 989XX):**
```python
# Keep existing complex logic for GMN route determination
if train_code.startsWith('987'):
    return determine_gmn_corridor()
elif train_code.startsWith('989'):
    # Check if stations in GMN section or Harbour
    return determine_989_corridor(from_stn, to_stn)
```

### Station Name Disambiguation

**Critical Rule:** Station names with _THB suffix indicate Trans-Harbour routes.

| Harbour Line | Trans-Harbour | Why Different |
|--------------|---------------|---------------|
| VSH | VSH_THB | Different physical stations, different km positions |
| NEU | NEU_THB | Different routes (Harbour vs THB) |
| SNPD | SNPD | Same station, but route context differs |

**Route Detection:**
```python
def is_trans_harbour_route(from_stn, to_stn):
    return '_THB' in from_stn or '_THB' in to_stn
```

---

## Lookup Tables Design

### 1. train_corridor_map.csv

**Purpose:** Direct train number to corridor mapping

**Structure:**
```csv
Train,Type,Route,Direction,FromExpected,ToExpected,Notes
K40,2,MAIN,UP,CSMT,KYN,Fast local main line
N7,1,NE,DN,KYN,KSRA,Slow local North-East section
N5,1,NE,DN,CSMT,KSRA,Combined CSMT-KSRA via NE (flexible)
S8,1,SE,UP,NRL,KYN,When running on SE section
S8,2,MAIN,UP,CSMT,KYN,When running as fast local
V13,0,HARBOUR,DN,TNA,CSMT,Harbour line
T12,0,THB_VSH,UP,TNA,VSH_THB,Trans-Harbour to VSH_THB
T20,0,THB_PNVL,UP,TNA,PNVL,Trans-Harbour to PNVL
```

**Columns:**
- **Train:** Train number (e.g., K40, N7)
- **Type:** 0=Single, 1=Slow, 2=Fast
- **Route:** MAIN, SE, NE, HARBOUR, THB_PNVL, THB_VSH
- **Direction:** UP, DN
- **FromExpected/ToExpected:** Typical stations (for validation)
- **Notes:** Human-readable description

**Handling Same Train, Different Routes:**
```csv
Train,Type,Route,Direction,Priority
S8,1,SE,UP,1
S8,2,MAIN,UP,2
```
When S8 encountered, check actual from/to stations against both entries, select match.

### 2. Type Definitions

```python
CORRIDOR_TYPES = {
    0: "SINGLE",      # No fast/slow variants (Harbour, THB, GMN)
    1: "SLOW",        # Slow locals (all stops)
    2: "FAST",        # Fast locals (limited stops)
}
```

Future extensibility:
```python
CORRIDOR_TYPES = {
    0: "SINGLE",
    1: "SLOW",
    2: "FAST",
    3: "SUPER_FAST",   # Future: AC locals, premium services
    4: "EXPRESS",      # Future: limited-stop express
}
```

---

## Technical Specifications

### Corridor CSV File Format

#### UPLOCALS.csv Structure
```csv
Type,Route,Record,CSMT,BY,CHG,CRD,PR,DR,MTN,SION,CLA,GC,VK,BND,MLND,TNA,KLVA,MBQ,DW,DI,KYN,VLDI,ULNR,ABH,BUD,VGI,SHELU,NRL,BVS,KJT,PDI,KLY,DLY,LWJ,KHPI,SHD,ABY,TLA,KDV,VSD,ASO,ATG,THS,KE,OMB,KSRA
2,MAIN,1,0,4040,4937,5423,6683,7653,8852,10122,,,,,,,,,,,53210,,,,,,,,,,,,,,,,,,,,,,,,
1,MAIN,1,0,4040,4937,5423,6683,7653,8852,10122,11392,12661,14015,15282,16549,17816,19084,20352,21620,53210,,,,,,,,,,,,,,,,,,,,,,,,
1,SE,1,0,4040,4937,5423,6683,7653,8852,10122,11392,12661,14015,15282,16549,17816,19084,20352,21620,53210,54685,55956,57222,58493,59761,61031,62300,63571,64841,66112,67383,68654,69925,71196,,,,,,,,,,,,
1,NE,1,0,4040,4937,5423,6683,7653,8852,10122,11392,12661,14015,15282,16549,17816,19084,20352,21620,53210,,,,,,,,,,,,,,,54129,55290,56465,57629,58794,59961,61128,62294,63463,64631,65800
```

**Column Definitions:**
- **Type:** 0/1/2 (SINGLE/SLOW/FAST)
- **Route:** MAIN, SE, NE
- **Record:** Historical baseline number (1, 2, 3, ...)
- **Station columns:** Inter-station distances in meters (0 = start of route, empty = station not on this route)

**Empty Cells:** Indicate station not present on this route variant.

#### UPTHB.csv Structure (Trans-Harbour Combined)
```csv
Route,Record,PNVL,KNDS,MANR,KHAG,BEPR,SWDV,NEU_THB,JNJ,VSH_THB,SNPD,TUH,KPHN,GNSL,RABE,AIRL,DIGH,TNA
PNVL,1,0,3275,1917,2905,2337,2405,1411,2484,,,,2250,3189,1528,2316,2490,2618,3286
PNVL,2,0,3281,1916,2909,2340,2402,1411,2484,,,,2253,3191,1524,2318,2480,2618,3287
VSH,1,,,,,,,,,0,1178,2031,3190,1527,2314,2492,2617,3289
VSH,2,,,,,,,,,0,1174,2033,3189,1525,2316,2491,2617,3280
```

**Route Values:**
- **PNVL:** Route from PNVL → TNA (uses PNVL-specific stations + common trunk)
- **VSH:** Route from VSH_THB → TNA (uses VSH-specific stations + common trunk)

**Common Trunk Stations:** TUH, KPHN, GNSL, RABE, AIRL, DIGH, TNA (filled for both routes)

---

## Implementation Plan

### Phase 1: Lookup Table Creation (Week 1)
**Tasks:**
- [ ] Create train_corridor_map.csv with all 1807 train codes
- [ ] Validate mappings against existing train lookup data
- [ ] Handle multi-route trains (e.g., S8)
- [ ] Test edge cases (GMN, special trains)

**Files Created:**
- `train_corridor_map.csv`

**Deliverable:** Complete lookup table tested with sample queries.

---

### Phase 2: Corridor File Consolidation (Week 2)

#### 2A: Create Combined Local Files
**Tasks:**
- [ ] Merge UPFASTLOCALS + UPSLOWLOCALS → UPLOCALS (Type column)
- [ ] Add UPLOCALSSE data to UPLOCALS (Route=SE, Type=1)
- [ ] Add UPLOCALSNE data to UPLOCALS (Route=NE, Type=1)
- [ ] Repeat for DNLOCALS
- [ ] Validate all station sequences
- [ ] Verify distance calculations

**Files Created:**
- `UPLOCALS.csv`
- `DNLOCALS.csv`

#### 2B: Create Combined THB Files
**Tasks:**
- [ ] Merge UPTHB_PNVL + UPTHB_VSH → UPTHB (Route column)
- [ ] Preserve VSH_THB and NEU_THB station names (with _THB suffix)
- [ ] Identify common trunk stations
- [ ] Repeat for DNTHB
- [ ] Validate routing logic

**Files Created:**
- `UPTHB.csv`
- `DNTHB.csv`

#### 2C: Validate Harbour Files
**Tasks:**
- [ ] Verify UPHARBOUR uses VSH (not VSH_THB)
- [ ] Verify DNHARBOUR uses NEU (not NEU_THB)
- [ ] Keep files as-is (no consolidation needed)

**Files Retained:**
- `UPHARBOUR.csv`
- `DNHARBOUR.csv`

---

### Phase 3: Backend Implementation (Week 3)

**File:** `corridor_loader.py`

**Tasks:**
- [ ] Update `load_corridor_file()` to handle Type and Route columns
- [ ] Implement `load_lookup_table()` to read train_corridor_map.csv
- [ ] Refactor `resolve_corridor()` with new 3-tier priority:
  1. Check lookup table
  2. Edge case logic (GMN)
  3. Station-based fallback
- [ ] Implement `get_route_segment()` for station index-based extraction
- [ ] Add filtering by Type and Route columns
- [ ] Update unit tests

**New Functions:**
```python
def load_lookup_table(csv_path) -> Dict[str, CorridorLookup]
def get_route_segment(corridor_data, from_station, to_station) -> CorridorSegment
def filter_by_type(corridor_data, type_value) -> CorridorData
def filter_by_route(corridor_data, route_value) -> CorridorData
```

---

### Phase 4: Frontend Integration (Week 4)

**File:** `main.py`, `spm.html`

**Tasks:**
- [ ] Update `/upload` endpoint to use new corridor resolution
- [ ] Modify `/chart_data` to handle segment extraction
- [ ] Add validation for partial routes (from/to not at corridor endpoints)
- [ ] Update chart rendering to show segment labels
- [ ] Add corridor info display (Type, Route) in UI

**UI Enhancements:**
```
Corridor Info Display:
┌────────────────────────────────┐
│ Corridor: UPLOCALS (NE)        │
│ Type: Slow (All Stops)         │
│ Segment: KYN → KSRA            │
│ Distance: 8.5 km               │
└────────────────────────────────┘
```

---

### Phase 5: Testing & Validation (Week 5)

#### 5A: Unit Tests
**Test Cases:**
- [ ] Lookup table retrieval for all 1807 trains
- [ ] Segment extraction (start, middle, end stations)
- [ ] Type filtering (Fast/Slow)
- [ ] Route filtering (MAIN, SE, NE)
- [ ] Edge cases (GMN trains, multi-route trains)

#### 5B: Integration Tests
**Test Scenarios:**
- [ ] Upload CSMT-KSRA complete run → Single analysis
- [ ] Upload KYN-KSRA partial run → Segment extraction
- [ ] Upload NRL-KYN run (S8 train) → SE corridor selection
- [ ] Upload TNA-VSH run → Harbour corridor (not THB)
- [ ] Upload TNA-VSH_THB run → Trans-Harbour corridor

#### 5C: Data Validation
**Checks:**
- [ ] All station distances match original files
- [ ] No data loss during consolidation
- [ ] Segment distances calculated correctly
- [ ] Historical baseline records preserved

---

### Phase 6: Migration & Deployment (Week 6)

**Tasks:**
- [ ] Backup existing corridor CSV files
- [ ] Deploy new consolidated files
- [ ] Update corridor_loader.py in production
- [ ] Monitor initial runs for errors
- [ ] Create rollback plan

**Rollback Plan:**
If issues detected:
1. Revert corridor_loader.py to previous version
2. Restore original 14 corridor CSV files
3. Investigate and fix issues
4. Re-deploy with fixes

---

## Benefits & Impact

### 1. **Unified Journey Analysis**

**Before:**
```
CSMT-KSRA journey (61.5 km):
- Upload 1: CSMT-KYN → Report 1
- Upload 2: KYN-KSRA → Report 2
- Manual merging required
```

**After:**
```
CSMT-KSRA journey (61.5 km):
- Single upload → Complete unified report
- All metrics in one place
- Continuous speed profile chart
```

**Impact:**
- ✅ 50% reduction in upload effort
- ✅ Complete journey metrics (avg speed, total time, distance)
- ✅ Unified brake test analysis
- ✅ Comprehensive overspeeding report
- ✅ Better operational insights

---

### 2. **Reduced File Maintenance**

**Before:**
- 14+ corridor files
- CSMT-KYN section duplicated 4+ times
- Update distances in multiple files

**After:**
- 6 corridor files (57% reduction)
- CSMT-KYN section stored once per Type
- Update once, applies to all

**Impact:**
- ✅ 57% fewer files to manage
- ✅ Single source of truth for station distances
- ✅ Easier to add new routes
- ✅ Reduced data inconsistency risk

---

### 3. **Faster Corridor Resolution**

**Before:**
```python
# 3-tier logic:
# 1. Prefix check (950-959, 960-966, etc.)
# 2. Station routing check (SE/NE)
# 3. Fallback logic
# Time complexity: O(n) station checks
```

**After:**
```python
# Direct lookup:
corridor = train_corridor_map[train_no]
# Time complexity: O(1)
```

**Impact:**
- ✅ 10x faster corridor resolution
- ✅ Simplified debugging
- ✅ Easier to add new trains

---

### 4. **Better Data Quality**

**Before:**
- Inconsistent distances across files
- Manual updates prone to errors
- No validation of corridor selection

**After:**
- Single source for station distances
- Lookup table provides validation (expected from/to)
- Segment extraction ensures route continuity

**Impact:**
- ✅ Higher data accuracy
- ✅ Automated validation
- ✅ Traceable routing decisions

---

### 5. **Enhanced Reporting**

**New Capabilities:**
```
Complete Journey Report (CSMT-KSRA):
┌─────────────────────────────────────────┐
│ Journey Metrics                         │
├─────────────────────────────────────────┤
│ Total Distance:    61.5 km              │
│ Total Time:        78 min               │
│ Average Speed:     47.3 km/h            │
│ Max Speed:         95 km/h              │
│                                         │
│ Section Performance:                    │
│ ├─ CSMT-KYN:  53.2 km, 48 min, 66 km/h│
│ └─ KYN-KSRA:   8.3 km, 30 min, 16 km/h│
│                                         │
│ Brake Tests: 5 events                   │
│ ├─ BY, MTN, SION (CSMT-KYN section)   │
│ └─ TLA, KDV (KYN-KSRA section)        │
│                                         │
│ Overspeeding: 2 violations              │
│ ├─ CLA: 45/30 km/h, 1.2 km, 90 sec    │
│ └─ ASO: 52/40 km/h, 0.8 km, 45 sec    │
└─────────────────────────────────────────┘
```

---

## Migration Considerations

### Data Integrity Checks

**Pre-Migration:**
```python
# Validate all existing corridor files
for corridor_file in existing_files:
    validate_station_sequence()
    validate_distance_calculations()
    validate_record_consistency()
```

**Post-Migration:**
```python
# Compare new vs old corridor data
for train_no in test_cases:
    old_corridor = get_old_corridor(train_no)
    new_corridor = get_new_corridor(train_no)
    assert distances_match(old_corridor, new_corridor)
```

### Backward Compatibility

**Option 1: Parallel Running**
- Keep old files during transition period
- Support both old and new corridor resolution
- Gradual cutover

**Option 2: Full Migration**
- Deploy all new files at once
- Comprehensive testing before deployment
- Quick rollback capability

**Recommended:** Option 1 (Parallel Running) for safety.

---

## Future Enhancements

### 1. **Real-Time Route Optimization**
```python
# Suggest optimal route based on historical data
def suggest_best_route(from_stn, to_stn, time_of_day):
    # Analyze historical runs
    # Return fastest/most reliable corridor
```

### 2. **Dynamic Corridor Creation**
```python
# Auto-generate corridor for new route
def create_custom_corridor(station_list, historical_runs):
    # Calculate baseline distances
    # Store as new corridor variant
```

### 3. **Multi-Route Comparison**
```python
# Compare performance across different routes
def compare_routes(train_runs):
    # CSMT-KYN via fast vs slow
    # Identify efficiency differences
```

### 4. **Predictive Analysis**
```python
# Predict journey time based on corridor and train
def predict_journey_time(corridor, train_type, time_of_day):
    # ML model using historical data
    # Account for traffic patterns
```

---

## Appendices

### A. Station Lists

#### SE (South-East) Stations
```
KYN, VLDI, ULNR, ABH, BUD, VGI, SHELU, NRL, BVS, KJT, PDI, KLY, DLY, LWJ, KHPI
```

#### NE (North-East) Stations
```
KYN, SHD, ABY, TLA, KDV, VSD, ASO, ATG, THS, KE, OMB, KSRA
```

#### THB PNVL Branch Stations
```
PNVL, KNDS, MANR, KHAG, BEPR, SWDV, NEU_THB, JNJ
```

#### THB VSH Branch Stations
```
VSH_THB, SNPD
```

#### THB Common Trunk Stations
```
TUH, KPHN, GNSL, RABE, AIRL, DIGH, TNA
```

### B. Train Code Prefixes

| Prefix Range | Corridor Type | Description |
|--------------|---------------|-------------|
| 950-959 | Fast Locals | Limited stop services |
| 960-963 | Slow Locals SE | All stop, South-East section |
| 964-966 | Slow Locals NE | All stop, North-East section |
| 970-976 | Slow Locals General | All stop, main line |
| 980-989 | Harbour Line | Harbour corridor trains |
| 990 | Trans-Harbour PNVL | TNA-PNVL route |
| 992-993 | Trans-Harbour NEU | TNA-NEU_THB route |
| 994-995 | Trans-Harbour VSH | TNA-VSH_THB route |
| 996-997 | Port Line | Uran port routes |
| 987 | GMN | Goregaon-Mira Road-Naigaon |
| 989 | GMN/Harbour Hybrid | Complex routing |

### C. File Size Estimates

| File | Approx Size | Rows | Columns |
|------|-------------|------|---------|
| UPLOCALS.csv | ~150 KB | 80 records | 50+ stations |
| DNLOCALS.csv | ~150 KB | 80 records | 50+ stations |
| UPHARBOUR.csv | ~50 KB | 30 records | 25 stations |
| DNHARBOUR.csv | ~50 KB | 30 records | 25 stations |
| UPTHB.csv | ~40 KB | 25 records | 18 stations |
| DNTHB.csv | ~40 KB | 25 records | 18 stations |
| **Total** | **~480 KB** | | |

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-05 | System Design Team | Initial design document |

---

## Approval & Sign-off

**Technical Lead:** ________________  Date: ________

**Project Manager:** ________________  Date: ________

**Stakeholder:** ________________  Date: ________

---

**End of Document**

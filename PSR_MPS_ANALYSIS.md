# PSR/MPS Implementation Analysis

## 🎯 Critical Innovation: Percentage-Based Speed Restrictions

### The Problem (Wheel Diameter Variations)

**Real-World Issue:**
- Same corridor, different wheel diameters → different distance readings
- Worn wheels (larger diameter) → More km traveled for same track
- New wheels (smaller diameter) → Less km traveled for same track

**Example:**
```
Official: CSMT to BY = 4.04 km
Train A (worn wheels):  Actual = 4.12 km (+2%)
Train B (new wheels):   Actual = 3.96 km (-2%)

Old approach (absolute km):
PSR at 2.5 km → Wrong position for both trains!

New approach (percentage):
PSR at 62% of segment → Correct for BOTH trains!
```

---

## 📊 Architecture Overview

### 1. **Data Structures**

#### A. Station KM Maps
```javascript
// Official kilometer posts for each station
getStationKMMap() {
  return {
    "CSMT": 0.1,
    "BY": 4.04,
    "PR": 7.65,
    "DR": 8.85,
    ...
  }
}

// Separate maps for:
// - Main line (slow trains)
// - Fast trains (skip some stations)
// - Trans-Harbour lines (different alignment)
```

**Purpose:** Official railway kilometer posts (fixed landmarks)

#### B. Segment Speed Limits (Percentage-Based)
```javascript
getFastSegmentBasedLimits() {
  return [
    {
      segment: "CSMT-BY",  // Station pair
      limits: [
        { startPct: 0.00, endPct: 0.12, limit: 30 },  // First 12% = 30 km/h
        { startPct: 0.12, endPct: 0.23, limit: 40 },  // Next 11% = 40 km/h
        { startPct: 0.23, endPct: 0.30, limit: 30 },  // Next 7% = 30 km/h
        { startPct: 0.30, endPct: 0.46, limit: 70 },  // Next 16% = 70 km/h
        { startPct: 0.46, endPct: 0.73, limit: 105 }, // Next 27% = 105 km/h (MPS)
        { startPct: 0.73, endPct: 1.00, limit: 60 },  // Last 27% = 60 km/h
      ]
    },
    {
      segment: "BY-PR",
      limits: [
        { startPct: 0.00, endPct: 0.54, limit: 105 },
        { startPct: 0.54, endPct: 0.64, limit: 70 },  // PSR dip!
        { startPct: 0.64, endPct: 0.91, limit: 105 },
        { startPct: 0.91, endPct: 1.00, limit: 80 },
      ]
    },
    // ... more segments
  ]
}
```

**Purpose:**
- MPS (Maximum Permissible Speed) = highest limit in segment (usually 105/100/95 km/h)
- PSR (Permanent Speed Restrictions) = temporary dips (curves, bridges, junctions)

**Why Percentage?**
- Wheel diameter variations don't affect percentage position!
- PSR at "54% through BY-PR" works for ALL trains

#### C. Enhanced Stations (Runtime Calculated)
```javascript
// Calculated by calculateDirectionalDistances()
enhancedStations = [
  {
    name: "CSMT",
    actualCumDist: 0.0,      // Actual distance from SPM data
    officialKM: 0.1          // Official KM post
  },
  {
    name: "BY",
    actualCumDist: 4.12,     // Detected halt at 4.12 km (worn wheels!)
    officialKM: 4.04         // Official is 4.04 km
  },
  {
    name: "PR",
    actualCumDist: 7.85,     // Calculated (scaled)
    officialKM: 7.65
  },
  // ...
]
```

**Purpose:** Bridge between actual train movement and official KM posts

---

### 2. **Core Functions**

#### Function 1: `processTrainSpeedLimits()` (Main Orchestrator)

**Flow:**
```
1. Detect train type (fast/slow) → determines which PSR data to use
2. Load station KM map (official landmarks)
3. Load segment speed limits (percentage-based)
4. Detect actual halting stations from SPM data
5. Calculate enhanced stations (with scaling)
6. For each SPM data point:
   a. Find which segment it's in
   b. Calculate percentage position in segment
   c. Look up speed limit for that percentage
   d. Write PSR value to column 10
```

**Code:**
```javascript
// Lines 256-363
function processTrainSpeedLimits() {
  const trainType = getTrainTypeForTheTrip(); // "fast" or "slow"

  // Load data for this train type
  let stationToKMMap = trainType === "fast"
    ? getFastStationKMMap()
    : getStationKMMap();

  let segmentLimits = trainType === "fast"
    ? getFastSegmentBasedLimits()
    : getSegmentBasedSpeedLimits();

  // Detect where train actually stopped
  const detectedHalts = matchHaltsWithStations();

  // Create enhanced stations with scaling
  enhancedStations = calculateDirectionalDistances(
    orderedStations,  // Route: [CSMT, BY, PR, DR, ...]
    stationToKMMap,   // Official KM posts
    haltingStationMap, // Actual detected distances
    0,                 // Start
    lastCumDist        // End
  );

  // Apply PSR to each data row
  for (let i = 1; i < data.length; i++) {
    const cumDist = data[i][CUM_DIST_COL];

    // Get position as percentage
    const position = normalizePosition(cumDist, enhancedStations);
    // Returns: {segment: "BY-PR", percentage: 0.62}

    // Get speed limit
    const speedLimit = getSpeedLimit(position, segmentLimits);
    // Returns: 105 (from segment limits table)

    // Write to spreadsheet
    data[i][PSR_COL] = speedLimit;
  }
}
```

---

#### Function 2: `calculateDirectionalDistances()` (THE KEY INNOVATION!)

**Purpose:** Handle wheel diameter variations by scaling official distances

**Flow:**
```
1. Get official distance: endKM - startKM = 53.21 - 0.1 = 53.11 km
2. Get actual distance: lastDetectedHalt - 0 = 54.23 km (worn wheels!)
3. Calculate scaling factor: 54.23 / 53.11 = 1.0211 (2.11% longer)
4. For non-halting stations, scale their position:
   - Official PR = 7.65 km from start
   - Scaled PR = 7.65 × 1.0211 = 7.81 km actual
```

**Code (lines 171-255):**
```javascript
function calculateDirectionalDistances(
  orderedStations,      // ["CSMT", "BY", "PR", ...]
  stationToKMMap,       // Official KM posts
  haltingStationMap,    // Actual detected halts
  startDistance,
  endDistance
) {
  // Calculate scaling factor
  const journeyDistance = endDistance - startDistance; // Actual
  const officialDistance = Math.abs(endOfficialKM - startOfficialKM); // Official
  const scalingFactor = journeyDistance / officialDistance;

  // For each station
  const enhancedStations = orderedStations.map(stationName => {
    const officialKM = stationToKMMap[stationName];

    // If train actually stopped here, use detected distance
    if (haltingStationMap[stationName] !== undefined) {
      actualCumDist = haltingStationMap[stationName];
    }
    // Otherwise, interpolate using scaling factor
    else {
      const officialDistFromStart = officialKM - startOfficialKM;
      const scaledDistFromStart = officialDistFromStart * scalingFactor;
      actualCumDist = startActualDist + scaledDistFromStart;
    }

    return {
      name: stationName,
      actualCumDist: actualCumDist,  // Actual position
      officialKM: officialKM          // Official position
    };
  });

  return enhancedStations;
}
```

**Example:**
```
Official:  CSMT=0.1 km, BY=4.04 km, PR=7.65 km, DR=8.85 km
Actual:    CSMT=0 km,   BY=4.12 km (detected halt), DR=9.02 km (detected halt)

Scaling factor = (9.02 - 0) / (8.85 - 0.1) = 9.02 / 8.75 = 1.0309

PR (no halt detected, interpolate):
  Official offset: 7.65 - 0.1 = 7.55 km
  Scaled offset: 7.55 × 1.0309 = 7.78 km
  Actual PR position: 0 + 7.78 = 7.78 km ✓
```

---

#### Function 3: `normalizePosition()` (Convert km → percentage)

**Purpose:** Find which segment a data point is in, and where (as %)

**Flow:**
```
Input: cumDist = 6.5 km, enhancedStations = [CSMT:0, BY:4.12, PR:7.85, DR:9.02, ...]

1. Find segment: 6.5 is between BY (4.12) and PR (7.85)
   → segment = "BY-PR"

2. Calculate percentage:
   segmentLength = 7.85 - 4.12 = 3.73 km
   positionInSegment = 6.5 - 4.12 = 2.38 km
   percentage = 2.38 / 3.73 = 0.638 (63.8%)

3. Return: {segment: "BY-PR", percentage: 0.638}
```

**Code (lines 366-402):**
```javascript
function normalizePosition(cumDist, landmarks) {
  // Find which segment
  for (let i = 0; i < landmarks.length - 1; i++) {
    const current = landmarks[i];
    const next = landmarks[i+1];

    if (cumDist >= current.actualCumDist && cumDist < next.actualCumDist) {
      // Calculate percentage
      const segmentLength = next.actualCumDist - current.actualCumDist;
      const positionInSegment = cumDist - current.actualCumDist;
      const percentage = positionInSegment / segmentLength;

      return {
        segment: `${current.name}-${next.name}`,
        percentage: percentage
      };
    }
  }
}
```

---

#### Function 4: `getSpeedLimit()` (Look up PSR/MPS)

**Purpose:** Get speed limit for a percentage position

**Flow:**
```
Input: position = {segment: "BY-PR", percentage: 0.62}

1. Find segment "BY-PR" in segmentLimits array
2. Find which limit range contains 0.62:
   { startPct: 0.54, endPct: 0.64, limit: 70 }  ← 0.62 is here!
3. Return: 70 km/h
```

**Code (lines 407-423):**
```javascript
function getSpeedLimit(position, segmentLimits) {
  // Find segment definition
  const segment = segmentLimits.find(s => s.segment === position.segment);

  // Find applicable limit
  for (const limit of segment.limits) {
    if (position.percentage >= limit.startPct &&
        position.percentage < limit.endPct) {
      return limit.limit;
    }
  }
}
```

---

### 3. **Visual Representation (How Chart is Built)**

#### Chart Data Preparation
```javascript
// For ECharts, we need to prepare two series:

// Series 1: Actual Speed (blue line)
speedData = spmData.map(row => row.speed);

// Series 2: PSR/MPS (green area)
psrData = spmData.map(row => {
  // This is calculated by processTrainSpeedLimits()
  return row.PSR_value; // Column 10
});

// X-axis: Distance
distanceData = spmData.map(row => row.cumulative_distance);
```

#### ECharts Configuration
```javascript
{
  xAxis: {
    type: 'category',
    data: distanceData  // [0, 0.1, 0.2, ..., 53.21]
  },
  yAxis: {
    type: 'value',
    name: 'Speed (km/h)'
  },
  series: [
    {
      name: 'Actual Speed',
      type: 'line',
      data: speedData,       // Blue line
      lineStyle: { color: '#0b3d91', width: 2 },
      z: 2  // Draw on top
    },
    {
      name: 'MPS/PSR',
      type: 'line',
      data: psrData,         // Green area
      areaStyle: {
        color: 'rgba(0, 200, 0, 0.3)'  // Light green fill
      },
      lineStyle: { color: 'green', width: 1 },
      z: 1  // Draw below speed line
    }
  ]
}
```

**This creates the exact chart from mps_psr.png:**
- Green shaded area = PSR/MPS envelope (safe zone)
- Blue line = Actual speed
- Dips in green = PSR restrictions
- Flat tops in green = MPS (maximum permissible speed)

---

### 4. **Violation Detection**

Once we have PSR data, violations are simple:

```javascript
function detectViolations(spmData) {
  const violations = [];

  spmData.forEach((row, index) => {
    if (row.speed > row.PSR_value) {
      violations.push({
        location_km: row.cumulative_distance,
        speed_recorded: row.speed,
        speed_limit: row.PSR_value,
        overspeed_amount: row.speed - row.PSR_value,
        severity: getSeverity(row.speed - row.PSR_value),
        index: index
      });
    }
  });

  return violations;
}

function getSeverity(overspeed) {
  if (overspeed < 5) return 'minor';
  if (overspeed < 10) return 'moderate';
  if (overspeed < 20) return 'severe';
  return 'critical';
}
```

---

## 📋 Implementation Checklist for FastAPI

### Step 1: Data Preparation
- [ ] Extract segment speed limits from modifiedscripts.js
- [ ] Create JSON files for each corridor type:
  - `fast_segments.json` (from `getFastSegmentBasedLimits()`)
  - `slow_segments.json` (from `getSegmentBasedSpeedLimits()`)
  - `thb_segments.json` (from `getSegmentBasedSpeedLimitsTHB()`)
- [ ] Station KM maps already in DuckDB ✓

### Step 2: Python Implementation
- [ ] Port `calculateDirectionalDistances()` to Python
- [ ] Port `normalizePosition()` to Python
- [ ] Port `getSpeedLimit()` to Python
- [ ] Integrate with halt detection
- [ ] Add PSR column to analysis results

### Step 3: Charting
- [ ] Add PSR series to ECharts config
- [ ] Green area fill for MPS/PSR
- [ ] Blue line for actual speed
- [ ] Mark violations in red

### Step 4: Testing
- [ ] Test with sample data from mps_psr.png
- [ ] Verify PSR values match Google Sheets
- [ ] Test with different wheel diameters
- [ ] Validate violation detection

---

## 🎯 Critical Dependencies

**Functions Needed (from Google Apps Script):**
1. ✅ `matchHaltsWithStations()` - Detect where train stopped
2. ✅ `finalRoutesList()` - Get ordered station list
3. ✅ `getTrainTypeForTheTrip()` - Determine fast/slow

**Data Needed:**
1. ✅ Station KM maps - Already in DuckDB
2. ❌ Segment speed limits - Need to extract from JS
3. ❌ Halt detection - Need to implement in Python

---

## 💡 Key Insights

1. **Percentage approach is GENIUS** - Solves wheel diameter problem elegantly
2. **Scaling factor** - Simple but effective: `actualDistance / officialDistance`
3. **Bi-directional support** - Handles both UP and DN directions
4. **Segment-based** - Each station pair has independent speed profile
5. **Runtime calculation** - Enhanced stations calculated per run (adapts to variations)

---

## 📊 Example End-to-End

```
SPM Upload: Train K40 (Fast), CSMT → KYN
Raw data: 3500 rows of [Time, Speed, Distance, CumDist]

Step 1: Detect halts
→ Found: CSMT(0), BY(4.12), DR(9.02), SION(12.95), ..., KYN(54.35)

Step 2: Calculate scaling
→ Official: 53.21 km, Actual: 54.35 km
→ Scaling factor: 1.0214 (2.14% longer - worn wheels!)

Step 3: Enhanced stations
→ CSMT: actual=0, official=0.1
→ BY: actual=4.12, official=4.04
→ PR: actual=7.81 (interpolated), official=7.65
→ ... all stations scaled

Step 4: Process each row
→ Row 250: cumDist=6.5 km
→ Segment: BY-PR, percentage: 63.8%
→ Speed limit lookup: 105 km/h
→ Write PSR_COL = 105

Step 5: Detect violations
→ Row 250: speed=112, PSR=105 → VIOLATION! (+7 km/h)
→ Mark as "moderate" severity

Step 6: Generate chart
→ Green area: PSR values [30,40,70,105,105,105,...]
→ Blue line: Actual speeds
→ Red markers: Violations
```

---

## 🚀 Ready to Implement?

**Ask me to proceed with:**
1. Extracting segment speed limits from JS to JSON
2. Implementing the 4 core functions in Python
3. Integrating with ECharts for visualization
4. Testing with your sample data

**Any questions or clarifications needed?**

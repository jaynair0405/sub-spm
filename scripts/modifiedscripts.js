

function getFastStationKMMap(){

  return {
    "CSMT":0.1,
"BY":4.04,
"PR":7.65,
"DR":8.85,
"MTN":10.12,
"SION":12.71,
"CLA":15.39,
"GC":19.3,
"VK":22.85,
"BND":26.56,
"MLND":30.56,
"TNA":33.02,
"KLVA":35.4,
"MBQ":39.98,
"DW":42.46,
"DI":48.06,
"KYN":53.21,
  }
}

function getStationKMMap() {
  // This mapping should be created from sectionsList data

  return {
    "PNVL": 48.940,
    "KNDS": 45.380,
    "MANR": 43.170,
    "KHAG": 40.170,
    "BEPR": 38.220,
    "SWDV": 35.840,
    "NEU": 34.470,
    "JNJ": 31.340,
    "SNPD": 30.03,
    "VSH": 28.890,
    "MNKD": 21.120,
    "GV": 18.99,
    "CMBR": 17.33,
    "TKNG": 16.41,
    "CLA": 14.60,
    "CHF": 13.680,
    "GTBN": 11.480,
    "VDLR": 9.110,
    "SVE": 7.10,
    "CTGN": 5.18,
    "RRD": 4.060,
    "DKRD": 2.99,
    "SNRDH": 1.60,
    "MSDH": 1.22,
    "CSMTH": 0.01,
    "KYN": 53.625,
    "THK": 49.51,
    "DI": 48.06,
    "KOPR": 46.86,
    "DW": 42.30,
    "MBQ": 39.98,
    "KLVA": 35.4,
    "TNA": 32.42,
    "MLND": 30.56,
    "NHR": 28.01,
    "BND": 26.56,
    "KJMG": 24.69,
    "VK": 22.85,
    "GC": 19.3,
    "VVH": 17.8,
    "CLA": 14.60,
    "SION": 12.71,
    "MTN": 10.12,
    "DR": 8.85,
    "PR": 7.35,
    "CRD": 6.07,
    "CHG": 5.53,
    "BY": 4.04,
    "SNRD": 2.08,
    "MSD": 1.22,
    "CSMT": 0.1,
    "VLDI":55.59,
    "ULNR":57.29,
    "ABH":59.90,
    "BUD":67.26,
    "VGI":77.99,
    "SHELU":82.09,
    "NRL":86.12,
    "BVS":92.85,
    "KJT":99.72,
    "PDI":102.92,
    "KLY":107.86,
    "DLY":108.43,
    "LWJ":111.58,
    "KHPI":114.24,
    "SHD":56.25,
    "ABY":57.96,
    "TLA":64.05,
    "KDV":71.40, 
    "VSD":79.40, 
    "ASO":85.43, 
    "ATG":94.87, 
    "THS":101.00,
    "KE":107.03, 
  "OMB":113.43, 
  "KSRA":120.56 



    // Add all other stations with their official KM posts
  };
}
function getStationKMMap1() {
  // This mapping should be created from sectionsList data

  return {
    "PNVL": 48.970,
    "KNDS": 45.760,
    "MANR": 43.480,
    "KHAG": 40.660,
    "BEPR": 38.498,
    "SWDV": 36.168,
    "NEU": 34.470,
    "JNJ": 31.940,
    "SNPD": 30.03,
    "VSH": 28.630,
    "MNKD": 21.208,
    "GV": 18.99,
    "CMBR": 17.33,
    "TKNG": 16.404,
    "CLA": 15.390,
    "CHF": 13.480,
    "GTBN": 11.480,
    "VDLR": 9.110,
    "SVE": 7.01,
    "CTGN": 6.244,
    "RRD": 4.060,
    "DKRD": 2.99,
    "SNRDH": 2.08,
    "MSDH": 1.22,
    "CSMTH": 0.01,
    "KYN": 53.625,
    "THK": 49.51,
    "DI": 48.06,
    "KOPR": 46.86,
    "DW": 40.794,
    "MBQ": 39.98,
    "KLVA": 35.4,
    "TNA": 33.02,
    "MLND": 30.56,
    "NHR": 28.01,
    "BND": 26.56,
    "KJMG": 24.69,
    "VK": 22.85,
    "GC": 19.3,
    "VVH": 17.8,
    "CLA": 15.39,
    "SION": 12.71,
    "MTN": 10.12,
    "DR": 8.85,
    "PR": 7.65,
    "CRD": 6.07,
    "CHG": 5.53,
    "BY": 4.04,
    "SNRD": 2.08,
    "MSD": 1.22,
    "CSMT": 0.1
    // Add all other stations with their official KM posts
  };
}

function calculateDirectionalDistances(
  orderedStations, 
  stationToKMMap, 
  haltingStationMap, 
  startDistance = 0,
  endDistance = null,
  preferActualForHalts = true
) {
  // Validate inputs
  if (!orderedStations || orderedStations.length < 2) {
    Logger.log("Error: Need at least two stations to calculate directional distances");
    return [];
  }
  
  // Determine start and end stations
  const startStation = orderedStations[0];
  const endStation = orderedStations[orderedStations.length - 1];
  
  // Get official KM posts for start and end
  const startOfficialKM = stationToKMMap[startStation];
  const endOfficialKM = stationToKMMap[endStation];
  
  if (startOfficialKM === undefined || endOfficialKM === undefined) {
    Logger.log("Error: Missing official KM posts for start or end station");
    return [];
  }
  
  // Get actual distances for start and end (if available)
  let startActualDist = startDistance;
  if (haltingStationMap[startStation] !== undefined && preferActualForHalts) {
    startActualDist = haltingStationMap[startStation];
  }
  
  // If end distance is not provided, use the halt distance if available
  let endActualDist = endDistance;
  if (endActualDist === null) {
    endActualDist = haltingStationMap[endStation] !== undefined && preferActualForHalts
                  ? haltingStationMap[endStation]
                  : startActualDist + Math.abs(endOfficialKM - startOfficialKM); // Fallback estimate
  }
  
  // Calculate distances
  const journeyDistance = endActualDist - startActualDist;
  const officialDistance = Math.abs(endOfficialKM - startOfficialKM);
  const scalingFactor = journeyDistance / officialDistance;
  
  // Check if KMs increase or decrease along this route
  const isIncreasingKM = endOfficialKM > startOfficialKM;
  
  // Create enhanced stations with calculated distances
  const enhancedStations = orderedStations.map(stationName => {
    const officialKM = stationToKMMap[stationName];
    
    if (officialKM === undefined) {
      return null; // Skip stations without KM posts
    }
    
    let actualCumDist;
    
    // If this is a halting station and we prefer actual distances, use its detected distance
    if (haltingStationMap[stationName] !== undefined && preferActualForHalts) {
      actualCumDist = haltingStationMap[stationName];
    } else {
      // For non-halting stations or if we don't prefer actual distances,
      // interpolate the distance based on position
      const officialDistFromStart = isIncreasingKM 
                                  ? officialKM - startOfficialKM 
                                  : startOfficialKM - officialKM;
                                  
      const scaledDistFromStart = officialDistFromStart * scalingFactor;
      actualCumDist = startActualDist + scaledDistFromStart;
    }
    
    return {
      name: stationName,
      actualCumDist: actualCumDist,
      officialKM: officialKM
    };
  }).filter(station => station !== null);
  
  // Sort by actualCumDist to ensure proper order
  enhancedStations.sort((a, b) => a.actualCumDist - b.actualCumDist);
  
  return enhancedStations;
}
function processTrainSpeedLimits() {
  const ss = SpreadsheetApp.openByUrl(url);
  const sheet = ss.getSheetByName("SPM Data");
  
  // Load train data
  const dataRange = sheet.getDataRange();
  const data = dataRange.getValues();
  
  // Define column indices
  const TIME_COL = 1;
  const SPEED_COL = 2;
  const DISTANCE_COL = 3;
  const CUM_DIST_COL = 4;
  const PSR_COL = 10;
  
  // Get the train type for this trip
  const trainType = getTrainTypeForTheTrip();
  Logger.log("Detected train type: " + trainType);
  
  // Get station information based on train type
  let stationToKMMap;
  let segmentLimits;
  let enhancedStations;
  
  if (trainType === "fast") {
    // For fast trains, we need all stations regardless of halts
    stationToKMMap = getFastStationKMMap();
    segmentLimits = getFastSegmentBasedLimits();
    Logger.log("Using Fast train station map and speed limits");
    
    // Get detected halting stations
    const detectedHalts = matchHaltsWithStations();
    Logger.log("Detected halting stations: " + JSON.stringify(detectedHalts));
    
    // Get ordered list of all stations on this route
    const orderedStations = finalRoutesList();
    Logger.log("Ordered stations for this route: " + JSON.stringify(orderedStations));
    
    if (!orderedStations || orderedStations.length < 2) {
      Logger.log("Error: Could not determine route stations");
      return "Error: Could not determine route stations";
    }
    
    // Create a map of stations that have halts and their actual distances
    const haltingStationMap = {};
    detectedHalts.forEach(halt => {
      if (halt.station !== "Unknown") {
        haltingStationMap[halt.station] = halt.distance;
      }
    });
    
    // Calculate the last data point's cumulative distance
    const lastCumDist = data.length > 1 ? data[data.length - 1][CUM_DIST_COL] : 0;
    
    // Use the separate function to calculate directional distances
    enhancedStations = calculateDirectionalDistances(
      orderedStations, 
      stationToKMMap, 
      haltingStationMap,
      0, // Start distance
      lastCumDist // End distance (estimated)
    );
    
    Logger.log("Enhanced stations for Fast train: " + JSON.stringify(enhancedStations));
  } else {
    // For slow trains, use the original logic with only halting stations
    stationToKMMap = getStationKMMap();
    segmentLimits = getSegmentBasedSpeedLimits();
    Logger.log("Using Slow train station map and speed limits");
    
    // Get detected halting stations
    const detectedStations = matchHaltsWithStations();
    Logger.log("Detected stations: " + JSON.stringify(detectedStations));
    
    // Enhance the station data with official KM posts
    enhancedStations = detectedStations.map(station => ({
      name: station.station,
      actualCumDist: station.distance,
      officialKM: stationToKMMap[station.station] || null
    })).filter(station => station.name !== "Unknown" && station.officialKM !== null);
    
    // Sort by actualCumDist to ensure proper order
    enhancedStations.sort((a, b) => a.actualCumDist - b.actualCumDist);
  }
  
  Logger.log("Enhanced stations with KM posts: " + JSON.stringify(enhancedStations));
  
  // Process each data point to apply the correct speed limit
  for (let i = 1; i < data.length; i++) { // Skip header row
    const cumDist = data[i][CUM_DIST_COL];
    
    // Get normalized position within the current segment
    const position = normalizePosition(cumDist, enhancedStations);
    
    // Get correct speed limit
    const speedLimit = getSpeedLimit(position, segmentLimits);
    
    // Update the PSR value
    if (speedLimit !== null) {
      data[i][PSR_COL] = speedLimit;
    }
  }
  
  // Write the updated data back to the sheet
  dataRange.setValues(data);
  
  return `Speed limits adjusted successfully based on stations for ${trainType} train`;
}


function normalizePosition(cumDist, landmarks) {
  // Find which segment this cumDist falls into
  for (let i = 0; i < landmarks.length - 1; i++) {
    const current = landmarks[i];
    const next = landmarks[i+1];
    
    if (cumDist >= current.actualCumDist && cumDist < next.actualCumDist) {
      // Calculate percentage position in segment
      const segmentLength = next.actualCumDist - current.actualCumDist;
      const positionInSegment = cumDist - current.actualCumDist;
      const percentage = positionInSegment / segmentLength;
      
      return {
        segment: `${current.name}-${next.name}`,
        percentage: percentage
      };
    }
  }
  
  // Handle position before first landmark
  if (landmarks.length > 0 && cumDist < landmarks[0].actualCumDist) {
    return {
      segment: `Before-${landmarks[0].name}`,
      percentage: 0
    };
  }
  
  // Handle position after last landmark
  if (landmarks.length > 0 && cumDist >= landmarks[landmarks.length - 1].actualCumDist) {
    return {
      segment: `${landmarks[landmarks.length - 1].name}-After`,
      percentage: 1
    };
  }
  
  return null;
}

/**
 * Gets the speed limit for a normalized position
 */
function getSpeedLimit(position, segmentLimits) {
  if (!position) return null;
  
  // Find the segment definition
  const segment = segmentLimits.find(s => s.segment === position.segment);
  if (!segment) return null;
  
  // Find the applicable limit within the segment
  for (const limit of segment.limits) {
    if (position.percentage >= limit.startPct && 
        position.percentage < limit.endPct) {
      return limit.limit;
    }
  }
  
  return null;
}

function getFastSegmentBasedLimits(){

return [
  {
    segment: "CSMT-BY",
    limits: [
      { startPct: 0.00, endPct: 0.12, limit: 30 },
      { startPct: 0.12, endPct: 0.23, limit: 40 },
      { startPct: 0.23, endPct: 0.30, limit: 30 },
      { startPct: 0.30, endPct: 0.46, limit: 70 },
      { startPct: 0.46, endPct: 0.73, limit: 105 },
      { startPct: 0.73, endPct: 1.00, limit: 60 },
    ]
  },
  {
    segment: "BY-PR",
    limits: [
      { startPct: 0.00, endPct: 0.54, limit: 105 },
      { startPct: 0.54, endPct: 0.64, limit: 70 },
      { startPct: 0.64, endPct: 0.91, limit: 105 },
      { startPct: 0.91, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "PR-DR",
    limits: [
      { startPct: 0.00, endPct: 0.26, limit: 80 },
      { startPct: 0.26, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "DR-MTN",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "MTN-SION",
    limits: [
      { startPct: 0.00, endPct: 0.13, limit: 105 },
      { startPct: 0.13, endPct: 0.32, limit: 65 },
      { startPct: 0.32, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "SION-CLA",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "CLA-GC",
    limits: [
      { startPct: 0.00, endPct: 0.68, limit: 105 },
      { startPct: 0.68, endPct: 0.78, limit: 65 },
      { startPct: 0.78, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "GC-VK",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "VK-BND",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "BND-MLND",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "MLND-TNA",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "TNA-KLVA",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "KLVA-MBQ",
    limits: [
      { startPct: 0.00, endPct: 0.27, limit: 105 },
      { startPct: 0.27, endPct: 0.67, limit: 95 },
      { startPct: 0.67, endPct: 0.84, limit: 85 },
      { startPct: 0.84, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "MBQ-DW",
    limits: [
      { startPct: 0.00, endPct: 0.79, limit: 100 },
      { startPct: 0.79, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "DW-DI",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "DI-KYN",
    limits: [
      { startPct: 0.00, endPct: 0.82, limit: 105 },
      { startPct: 0.82, endPct: 0.89, limit: 65 },
      { startPct: 0.89, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "KYN-DI",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "DI-DW",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "DW-MBQ",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "MBQ-KLVA",
    limits: [
      { startPct: 0.00, endPct: 0.32, limit: 100 },
      { startPct: 0.31, endPct: 0.51, limit: 85 },
      { startPct: 0.51, endPct: 0.77, limit: 95 },
      { startPct: 0.77, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "KLVA-TNA",
    limits: [
      { startPct: 0.00, endPct: 0.87, limit: 105 },
      { startPct: 0.87, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "TNA-MLND",
    limits: [
      { startPct: 0.00, endPct: 0.30, limit: 80 },
      { startPct: 0.30, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "MLND-BND",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "BND-VK",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "VK-GC",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "GC-CLA",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "CLA-SION",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "SION-MTN",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "MTN-DR",
    limits: [
      { startPct: 0.00, endPct: 0.48, limit: 60 },
      { startPct: 0.48, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "DR-PR",
    limits: [
      { startPct: 0.00, endPct: .90, limit: 105 },
      { startPct: 0.90, endPct: 1.00, limit: 70 },
    ]
  },
  {
    segment: "PR-BY",
    limits: [
      { startPct: 0.00, endPct: 0.10, limit: 70 },
      { startPct: 0.10, endPct: 0.11, limit: 70 },
      
      { startPct: 0.11, endPct: 0.27, limit: 105 },
      { startPct: 0.27, endPct: 0.45, limit: 105 },
      { startPct: 0.45, endPct: 0.49, limit: 70 },
      { startPct: 0.49, endPct: 0.78, limit: 105 },
      { startPct: 0.78, endPct: 0.99, limit: 65 },
      { startPct: 0.99, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "BY-CSMT",
    limits: [
      { startPct: 0.00, endPct: 0.21, limit: 105 },
      { startPct: 0.21, endPct: 0.23, limit: 65 },
      { startPct: 0.23, endPct: 0.46, limit: 105 },
      { startPct: 0.46, endPct: 0.47, limit: 50 },
      { startPct: 0.47, endPct: 0.71, limit: 105 },
      { startPct: 0.71, endPct: 0.74, limit: 60 },
      { startPct: 0.74, endPct: 0.75, limit: 105 },
      { startPct: 0.75, endPct: 0.99, limit: 50 },
      { startPct: 0.99, endPct: 1.00, limit: 30 },
    ]
  },
];


}

function getSegmentBasedSpeedLimits() {
  // Convert  existing sectionsList of Local line to segment-based definitions 
  // This is a one-time operation that you can do offline or automate
  return [
    {
    segment: "PNVL-KNDS",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "KNDS-MANR",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "MANR-KHAG",
    limits: [
      { startPct: 0.00, endPct: 0.55, limit: 95 },
      { startPct: 0.55, endPct: 0.98, limit: 90 },
      { startPct: 0.98, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "KHAG-BEPR",
    limits: [
      { startPct: 0.00, endPct: 0.39, limit: 95 },
      { startPct: 0.39, endPct: 0.75, limit: 80 },
      { startPct: 0.75, endPct: 1.00, limit: 40 },
    ]
  },
  {
    segment: "BEPR-SWDV",
    limits: [
      { startPct: 0.00, endPct: 0.15, limit: 45 },
      { startPct: 0.15, endPct: 0.37, limit: 65 },
      { startPct: 0.37, endPct: 0.80, limit: 80 },
      { startPct: 0.80, endPct: 1.00, limit: 65 },
    ]
  },
  {
    segment: "SWDV-NEU",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "NEU-JNJ",
    limits: [
      { startPct: 0.00, endPct: 0.12, limit: 95 },
      { startPct: 0.12, endPct: 0.16, limit: 85 },
      { startPct: 0.16, endPct: 0.37, limit: 95 },
      { startPct: 0.37, endPct: 0.44, limit: 90 },
      { startPct: 0.44, endPct: 0.85, limit: 95 },
      { startPct: 0.85, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "JNJ-SNPD",
    limits: [
      { startPct: 0.00, endPct: 0.29, limit: 80 },
      { startPct: 0.29, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "SNPD-VSH",
    limits: [
      { startPct: 0.00, endPct: 0.35, limit: 95 },
      { startPct: 0.35, endPct: 1.0, limit: 45 },
      // { startPct: 0.61, endPct: 0.91, limit: 95 },
      // { startPct: 0.91, endPct: 1.00, limit: 30 },
    ]
  },
  {
    segment: "VSH-MNKD",
    limits: [
      { startPct: 0.00, endPct: 0.10, limit: 80 },
      { startPct: 0.10, endPct: 0.92, limit: 95 },
      { startPct: 0.92, endPct: 1.00, limit: 50 },
    ]
  },
  {
    segment: "MNKD-GV",
    limits: [
      { startPct: 0.00, endPct: 0.20, limit: 50 },
      { startPct: 0.20, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "GV-CMBR",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "CMBR-TKNG",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "TKNG-CLA",
    limits: [
      { startPct: 0.00, endPct: 0.42, limit: 80 },
      // { startPct: 0.00, endPct: 0.82, limit: 40 },
      { startPct: 0.42, endPct: 1.00, limit: 40 },
    ]
  },
  {
    segment: "CLA-CHF",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "CHF-GTBN",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "GTBN-VDLR",
    limits: [
      { startPct: 0.00, endPct: 0.55, limit: 80 },
      { startPct: 0.55, endPct: 0.70, limit: 30 },
      { startPct: 0.70, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "VDLR-SVE",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "SVE-CTGN",
    limits: [
      { startPct: 0.00, endPct: 0.55, limit: 80 },
      { startPct: 0.55, endPct: 1.00, limit: 60 },
    ]
  },
  {
    segment: "CTGN-RRD",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 60 },
    ]
  },
  {
    segment: "RRD-DKRD",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 60 },
    ]
  },
  {
    segment: "DKRD-SNRDH",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 60 },
    ]
  },
  {
    segment: "SNRDH-MSDH",
    limits: [
      { startPct: 0.00, endPct: .45, limit: 40 },
      { startPct: 0.45, endPct: 1.00, limit: 60 },
    ]
  },
  {
    segment: "MSDH-CSMTH",
    limits: [
      { startPct: 0.00, endPct: 0.12, limit: 60 },
      { startPct: 0.12, endPct: 0.25, limit: 40 },
       { startPct: 0.25, endPct: 1.0, limit: 30 },
    ]
  },
  {
    segment: "CSMTH-MSDH",
    limits: [
      { startPct: 0.00, endPct: 0.27, limit: 35 },
      { startPct: 0.27, endPct: 0.65, limit: 40 },
      { startPct: 0.65, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "MSDH-SNRDH",
    limits: [
      { startPct: 0.00, endPct: 0.58, limit: 80 },
      { startPct: 0.58, endPct: 0.75, limit: 60 },
      { startPct: 0.75, endPct: 1.00, limit: 40 },
    ]
  },
  {
    segment: "SNRDH-DKRD",
    limits: [
      { startPct: 0.00, endPct: 0.43, limit: 40 },
      { startPct: 0.43, endPct: 0.50, limit: 80 },
      { startPct: 0.50, endPct: 0.93, limit: 55 },
      { startPct: 0.93, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "DKRD-RRD",
    limits: [
      { startPct: 0.00, endPct: 0.34, limit: 80 },
      { startPct: 0.34, endPct: 0.74, limit: 50 },
      { startPct: 0.74, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "RRD-CTGN",
    limits: [
      { startPct: 0.00, endPct: 0.55, limit: 80 },
      { startPct: 0.55, endPct: 1.00, limit: 60 },
    ]
  },
  {
    segment: "CTGN-SVE",
    limits: [
      { startPct: 0.00, endPct: 0.48, limit: 60 },
      { startPct: 0.48, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "SVE-VDLR",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "VDLR-GTBN",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "GTBN-CHF",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "CHF-CLA",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "CLA-TKNG",
    limits: [
      { startPct: 0.00, endPct: 0.22, limit: 80 },
      { startPct: 0.22, endPct: 0.55, limit: 40 },
      { startPct: 0.55, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "TKNG-CMBR",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "CMBR-GV",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "GV-MNKD",
    limits: [
      { startPct: 0.00, endPct: 0.74, limit: 95 },
      { startPct: 0.74, endPct: 1.00, limit: 50 },
    ]
  },
  {
    segment: "MNKD-VSH",
    limits: [
      { startPct: 0.00, endPct: 0.07, limit: 50 },
      { startPct: 0.07, endPct: 0.95, limit: 95 },
      { startPct: 0.95, endPct: 1.00, limit: 45 },
    ]
  },
  {
    segment: "VSH-SNPD",
    limits: [
      { startPct: 0.00, endPct: 0.10, limit: 45 },
      { startPct: 0.10, endPct: 0.40, limit: 30 },
      { startPct: 0.40, endPct: 1.00, limit: 85 },
    ]
  },
  {
    segment: "SNPD-JNJ",
    limits: [
      { startPct: 0.00, endPct: 0.75, limit: 85 },
      { startPct: 0.75, endPct: 1.00, limit: 55 },
    ]
  },
  {
    segment: "JNJ-NEU",
    limits: [
      { startPct: 0.00, endPct: 0.09, limit: 85 },
      { startPct: 0.09, endPct: 0.50, limit: 80 },
      { startPct: 0.50, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "NEU-SWDV",
    limits: [
      { startPct: 0.00, endPct: 0.12, limit: 95 },
      { startPct: 0.12, endPct: 0.39, limit: 30 },
      { startPct: 0.39, endPct: 0.65, limit: 90 },
      { startPct: 0.65, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "SWDV-BEPR",
    limits: [
      { startPct: 0.00, endPct: 0.17, limit: 80 },
      { startPct: 0.17, endPct: 0.29, limit: 95 },
      { startPct: 0.29, endPct: 0.72, limit: 80 },
      { startPct: 0.72, endPct: 0.77, limit: 95 },
      { startPct: 0.77, endPct: 0.84, limit: 65 },
      { startPct: 0.84, endPct: 1.00, limit: 45 },
    ]
  },
  {
    segment: "BEPR-KHAG",
    limits: [
      { startPct: 0.00, endPct: 0.13, limit: 45 },
      { startPct: 0.13, endPct: 0.79, limit: 80 },
      { startPct: 0.79, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "KHAG-MANR",
    limits: [
      { startPct: 0.00, endPct: 0.14, limit: 95 },
      { startPct: 0.14, endPct: 0.56, limit: 90 },
      { startPct: 0.56, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "MANR-KNDS",
    limits: [
      { startPct: 0.00, endPct: 0.46, limit: 95 },
      { startPct: 0.46, endPct: 0.86, limit: 90 },
      { startPct: 0.86, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "KNDS-PNVL",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "KYN-THK",
    limits: [
      { startPct: 0.00, endPct: 0.2, limit: 100 },
      { startPct: 0.2, endPct: 0.37, limit: 65 },
      { startPct: 0.37, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "THK-DI",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "DI-KOPR",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "KOPR-DW",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "DW-MBQ",
    limits: [
      { startPct: 0.00, endPct: 0.67, limit: 100 },
      { startPct: 0.67, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "MBQ-KLVA",
    limits: [
      { startPct: 0.00, endPct: 0.04, limit: 80 },
      { startPct: 0.04, endPct: 0.31, limit: 100 },
      { startPct: 0.31, endPct: 0.41, limit: 85 },
      { startPct: 0.41, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "KLVA-TNA",
    limits: [
      { startPct: 0.00, endPct: 0.64, limit: 100 },
      { startPct: 0.64, endPct: 0.80, limit: 70 },
      { startPct: 0.80, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "TNA-MLND",
    limits: [
      { startPct: 0.00, endPct: 0.78, limit: 100 },
      { startPct: 0.78, endPct: 0.90, limit: 65 },
      { startPct: 0.90, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "MLND-NHR",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "NHR-BND",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "BND-KJMG",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "KJMG-VK",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "VK-GC",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "GC-VVH",
    limits: [
      { startPct: 0.00, endPct: 0.52, limit: 100 },
      { startPct: 0.52, endPct: 0.82, limit: 65 },
      { startPct: 0.82, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "VVH-CLA",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "CLA-SION",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "SION-MTN",
    limits: [
      { startPct: 0.00, endPct: 0.68, limit: 100 },
      { startPct: 0.68, endPct: 0.91, limit: 65 },
      { startPct: 0.91, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "MTN-DR",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "DR-PR",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "PR-CRD",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "CRD-CHG",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "CHG-BY",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "BY-SNRD",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "SNRD-MSD",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "MSD-CSMT",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 30 },
    ]
  },
  {
    segment: "CSMT-MSD",
    limits: [
      { startPct: 0.00, endPct: 0.57, limit: 30 },
      { startPct: 0.57, endPct: 0.82, limit: 40 },
      { startPct: 0.82, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "MSD-SNRD",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "SNRD-BY",
    limits: [
      { startPct: 0.00, endPct: 0.51, limit: 100 },
      { startPct: 0.51, endPct: 0.59, limit: 80 },
      { startPct: 0.59, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "BY-CHG",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "CHG-CRD",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "CRD-PR",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "PR-DR",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "DR-MTN",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "MTN-SION",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "SION-CLA",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "CLA-VVH",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "VVH-GC",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "GC-VK",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "VK-KJMG",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "KJMG-BND",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "BND-NHR",
    limits: [
      { startPct: 0.00, endPct: .70, limit: 100 },
      { startPct: 0.70, endPct: 1.00, limit: 50 }
    ]
  },
  {
    segment: "NHR-MLND",
    limits: [
      { startPct: 0.00, endPct: 0.37, limit: 50 },
      { startPct: 0.37, endPct: 1.00, limit: 100 }
    ]
  },
  {
    segment: "MLND-TNA",
    limits: [
      { startPct: 0.00, endPct: .98, limit: 100 },
      { startPct: 0.98, endPct: 1.00, limit: 70 }
    ]
  },
  {
    segment: "TNA-KLVA",
    limits: [
      { startPct: 0.00, endPct: 0.2, limit: 70 },
      { startPct: 0.2, endPct:1.0, limit: 100 }
      
    ]
  },
  {
    segment: "KLVA-MBQ",
    limits: [
      { startPct: 0.00, endPct: 0.56, limit: 100 },
      { startPct: 0.56, endPct: 0.70, limit: 85 },
      { startPct: 0.70, endPct: 0.77, limit: 100 },
      { startPct: 0.77, endPct: 1.0, limit: 80 },
    ]
  },
  {
    segment: "MBQ-DW",
    limits: [
      { startPct: 0.00, endPct: 0.35, limit: 80 },
      { startPct: 0.35, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "DW-KOPR",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "KOPR-DI",
    limits: [
      { startPct: 0.00, endPct: 0.9, limit: 100 },
      { startPct: 0.9, endPct: 1.0, limit: 50 }
    ]
  },
  {
    segment: "DI-THK",
    limits: [
      { startPct: 0.00, endPct: 0.12, limit: 50 },
      { startPct: 0.12, endPct: 0.75, limit: 100 },
      { startPct: 0.75, endPct: 1, limit: 70 },
      
    ]
  },
  {
    segment: "THK-KYN",
    limits: [
      
      { startPct: 0.00, endPct: 0.08, limit: 70 },
      { startPct: 0.08, endPct: 0.77, limit: 100 },
      { startPct: 0.77, endPct: 0.85, limit: 55 },
      { startPct: 0.85, endPct: 1.00, limit: 100 },
    ]
  },
  {
    segment: "KYN-VLDI",
    limits: [
      { startPct: 0.00, endPct: 0.02, limit: 40 },
      { startPct: 0.02, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "VLDI-ULNR",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "ULNR-ABH",
    limits: [
      { startPct: 0.00, endPct: 0.74, limit: 105 },
      { startPct: 0.74, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "ABH-BUD",
    limits: [
      { startPct: 0.00, endPct: 0.04, limit: 95 },
      { startPct: 0.04, endPct: 0.93, limit: 105 },
      { startPct: 0.93, endPct: 1.00, limit: 90 },
    ]
  },
  {
    segment: "BUD-VGI",
    limits: [
      { startPct: 0.00, endPct: 0.03, limit: 85 },
      { startPct: 0.03, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "VGI-SHELU",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "SHELU-NRL",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "NRL-BVS",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "BVS-KJT",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "KJT-PDI",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "PDI-KLY",
    limits: [
      { startPct: 0.00, endPct: 0.22, limit: 90 },
      { startPct: 0.22, endPct: 0.48, limit: 70 },
      { startPct: 0.48, endPct: 1.00, limit: 90 },
    ]
  },
  {
    segment: "KLY-DLY",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 90 },
    ]
  },
  {
    segment: "DLY-LWJ",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 90 },
    ]
  },
  {
    segment: "LWJ-KHPI",
    limits: [
      { startPct: 0.00, endPct: 0.53, limit: 90 },
      { startPct: 0.53, endPct: 1.00, limit: 30 },
    ]
  },
  {
    segment: "KHPI-LWJ",
    limits: [
      { startPct: 0.00, endPct: 0.47, limit: 30 },
      { startPct: 0.47, endPct: 1.00, limit: 90 },
    ]
  },
  {
    segment: "LWJ-DLY",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 90 },
    ]
  },
  {
    segment: "DLY-KLY",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 90 },
    ]
  },
  {
    segment: "KLY-PDI",
    limits: [
      { startPct: 0.00, endPct: 0.52, limit: 90 },
      { startPct: 0.52, endPct: 0.78, limit: 70 },
      { startPct: 0.78, endPct: 1.00, limit: 90 },
    ]
  },
  {
    segment: "PDI-KJT",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "KJT-BVS",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "BVS-NRL",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "NRL-SHELU",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "SHELU-VGI",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "VGI-BUD",
    limits: [
      { startPct: 0.00, endPct: 0.86, limit: 105 },
      { startPct: 0.86, endPct: 0.95, limit: 85 },
      { startPct: 0.95, endPct: 1.00, limit: 90 },
    ]
  },
  {
    segment: "BUD-ABH",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "ABH-ULNR",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "ULNR-VLDI",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "VLDI-KYN",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "KSRA-OMB",
    limits: [
      { startPct: 0.00, endPct: 0.23, limit: 75 },
      { startPct: 0.23, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "OMB-KE",
    limits: [
      { startPct: 0.00, endPct: 0.51, limit: 105 },
      { startPct: 0.43, endPct: 0.59, limit: 100 },
      { startPct: 0.59, endPct: 0.84, limit: 105 },
      { startPct: 0.84, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "KE-THS",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "THS-ATG",
    limits: [
      { startPct: 0.00, endPct: 0.82, limit: 105 },
      { startPct: 0.82, endPct: 0.88, limit: 80 },
      { startPct: 0.88, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "ATG-ASO",
    limits: [
      { startPct: 0.00, endPct: 0.28, limit: 105 },
      { startPct: 0.28, endPct: 0.37, limit: 85 },
      { startPct: 0.37, endPct: 0.48, limit: 100 },
      { startPct: 0.48, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "ASO-VSD",
    limits: [
      { startPct: 0.00, endPct: 0.81, limit: 105 },
      { startPct: 0.76, endPct: 0.90, limit: 75 },
      { startPct: 0.90, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "VSD-KDV",
    limits: [
      { startPct: 0.00, endPct: 0.85, limit: 105 },
      { startPct: 0.85, endPct: 0.91, limit: 85 },
      { startPct: 0.91, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "KDV-TLA",
    limits: [
      { startPct: 0.00, endPct: 0.77, limit: 105 },
      { startPct: 0.77, endPct: 0.87, limit: 90 },
      { startPct: 0.87, endPct: 0.94, limit: 105 },
      { startPct: 0.94, endPct: 1.00, limit: 85 },
    ]
  },
  {
    segment: "TLA-ABY",
    limits: [
      { startPct: 0.00, endPct: 0.07, limit: 85 },
      { startPct: 0.07, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "ABY-SHD",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "SHD-KYN",
    limits: [
      { startPct: 0.00, endPct: 0.34, limit: 105 },
      { startPct: 0.34, endPct: 0.45, limit: 60 },
      { startPct: 0.45, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "KYN-SHD",
    limits: [
      { startPct: 0.00, endPct: 0.29, limit: 105 },
      { startPct: 0.29, endPct: 0.39, limit: 90 },
      { startPct: 0.39, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "SHD-ABY",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "ABY-TLA",
    limits: [
      { startPct: 0.00, endPct: 0.91, limit: 105 },
      { startPct: 0.91, endPct: 1.00, limit: 85 },
    ]
  },
  {
    segment: "TLA-KDV",
    limits: [
      { startPct: 0.00, endPct: 0.04, limit: 85 },
      { startPct: 0.04, endPct: 0.93, limit: 105 },
      { startPct: 0.93, endPct: 1.00, limit: 90 },
    ]
  },
  {
    segment: "KDV-VSD",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "VSD-ASO",
    limits: [
      { startPct: 0.00, endPct: 0.07, limit: 80 },
      { startPct: 0.07, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "ASO-ATG",
    limits: [
      { startPct: 0.00, endPct: 0.49, limit: 105 },
      { startPct: 0.49, endPct: 0.67, limit: 80 },
      { startPct: 0.67, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "ATG-THS",
    limits: [
      { startPct: 0.00, endPct: 0.06, limit: 105 },
      { startPct: 0.06, endPct: 0.14, limit: 85 },
      { startPct: 0.14, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "THS-KE",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "KE-OMB",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 105 },
    ]
  },
  {
    segment: "OMB-KSRA",
    limits: [
      { startPct: 0.00, endPct: 0.83, limit: 105 },
      { startPct: 0.83, endPct: 0.88, limit: 50 },
      { startPct: 0.88, endPct: 1.00, limit: 105 },
    ]
  }
    // Add more segments with their limits
  ];
}

function processTrainSpeedLimitsForTHBLines() {
  const ss = SpreadsheetApp.openByUrl(url);
  const sheet = ss.getSheetByName("SPM Data");
  
  // Load train data
  const dataRange = sheet.getDataRange();
  const data = dataRange.getValues();
  
  // Define column indices
  const TIME_COL = 1;
  const SPEED_COL = 2;
  const DISTANCE_COL = 3;
  const CUM_DIST_COL = 4;
  const PSR_COL = 10;
  
  // Get the train type for this trip
  const trainType = getTrainTypeForTheTrip();
  Logger.log("Detected train type: " + trainType);
  
  // Get station information based on train type
  let stationToKMMap;
  let segmentLimits;
  let enhancedStations;

    // For slow trains, use the original logic with only halting stations
    stationToKMMap = getStationKMMapTHBLine();
    segmentLimits = getSegmentBasedSpeedLimitsTHB();
    Logger.log("Using Slow train station map and speed limits");
    
    // Get detected halting stations
    const detectedStations = matchHaltsWithStations();
    Logger.log("Detected stations: " + JSON.stringify(detectedStations));
    
    // Enhance the station data with official KM posts
    enhancedStations = detectedStations.map(station => ({
      name: station.station,
      actualCumDist: station.distance,
      officialKM: stationToKMMap[station.station] || null
    })).filter(station => station.name !== "Unknown" && station.officialKM !== null);
    
    // Sort by actualCumDist to ensure proper order
    enhancedStations.sort((a, b) => a.actualCumDist - b.actualCumDist);
  
  
  Logger.log("Enhanced stations with KM posts: " + JSON.stringify(enhancedStations));
  
  // Process each data point to apply the correct speed limit
  for (let i = 1; i < data.length; i++) { // Skip header row
    const cumDist = data[i][CUM_DIST_COL];
    
    // Get normalized position within the current segment
    const position = normalizePosition(cumDist, enhancedStations);
    
    // Get correct speed limit
    const speedLimit = getSpeedLimit(position, segmentLimits);
    
    // Update the PSR value
    if (speedLimit !== null) {
      data[i][PSR_COL] = speedLimit;
    }
  }
  
  // Write the updated data back to the sheet
  dataRange.setValues(data);
  
  return `Speed limits adjusted successfully based on stations for ${trainType} train`;
}


function getStationKMMapTHBLine() {
  
  return {
    "PNVL": 34.410,
    "KNDS": 31.120,
    "MANR": 29.220,
    "KHAG": 26.300,
    "BEPR": 23.970,
    "SWDV": 21.570,
    "NEU_THB": 20.170,
    "JNJ": 17.690,
    "SNPD": 17.480,
    "VSH_THB": 18.650,
    "TUH":15.440,
    "KPHN":12.260,
    "GNSL":10.730,
    "RABE":8.410,
    "AIRL":5.930,
    "DIGH":3.310,
    "TNA":0.01

  };
}

function getSegmentBasedSpeedLimitsTHB() {
  return [
  {
    segment: "VSH_THB-SNPD",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "SNPD-TUH",
    limits: [
      { startPct: 0.00, endPct: 0.31, limit: 80 },
      { startPct: 0.31, endPct: 0.60, limit: 30 },
      { startPct: 0.60, endPct: 0.78, limit: 80 },
      { startPct: 0.78, endPct: 0.81, limit: 50 },
      { startPct: 0.81, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "TUH-KPHN",
    limits: [
      { startPct: 0.00, endPct: 0.55, limit: 80 },
      { startPct: 0.55, endPct: 0.64, limit: 70 },
      { startPct: 0.64, endPct: 1.00, limit: 65 },
    ]
  },
  {
    segment: "KPHN-GNSL",
    limits: [
      { startPct: 0.00, endPct: 0.10, limit: 65 },
      { startPct: 0.10, endPct: 0.18, limit: 50 },
      { startPct: 0.18, endPct: 0.74, limit: 80 },
      { startPct: 0.74, endPct: 0.80, limit: 75 },
      { startPct: 0.80, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "GNSL-RABE",
    limits: [
      { startPct: 0.00, endPct: 0.49, limit: 80 },
      { startPct: 0.49, endPct: 0.63, limit: 50 },
      { startPct: 0.63, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "RABE-AIRL",
    limits: [
      { startPct: 0.00, endPct: 0.06, limit: 80 },
      { startPct: 0.06, endPct: 0.10, limit: 70 },
      { startPct: 0.10, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "AIRL-DIGH",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "DIGH-TNA",
    limits: [
      { startPct: 0.00, endPct: 0.30, limit: 80 },
      { startPct: 0.30, endPct: 0.45, limit: 20 },
      { startPct: 0.45, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "NEU_THB-JNJ",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "JNJ-TUH",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "TNA-DIGH",
    limits: [
      { startPct: 0.00, endPct: 0.01, limit: 80 },
      { startPct: 0.01, endPct: 0.08, limit: 70 },
      { startPct: 0.08, endPct: 0.10, limit: 80 },
      { startPct: 0.10, endPct: 0.13, limit: 75 },
      { startPct: 0.13, endPct: 0.65, limit: 80 },
      { startPct: 0.65, endPct: 0.77, limit: 20 },
      { startPct: 0.77, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "DIGH-AIRL",
    limits: [
      { startPct: 0.00, endPct: 0.28, limit: 80 },
      { startPct: 0.28, endPct: 0.50, limit: 75 },
      { startPct: 0.50, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "AIRL-RABE",
    limits: [
      { startPct: 0.00, endPct: 0.36, limit: 80 },
      { startPct: 0.36, endPct: 0.50, limit: 75 },
      { startPct: 0.50, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "RABE-GNSL",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "GNSL-KPHN",
    limits: [
      { startPct: 0.00, endPct: 0.55, limit: 80 },
      { startPct: 0.55, endPct: 0.90, limit: 50 },
      { startPct: 0.90, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "KPHN-TUH",
    limits: [
      { startPct: 0.00, endPct: 0.01, limit: 80 },
      { startPct: 0.01, endPct: 0.08, limit: 70 },
      { startPct: 0.08, endPct: 0.71, limit: 80 },
      { startPct: 0.71, endPct: 1.00, limit: 65 },
    ]
  },
  {
    segment: "TUH-SNPD",
    limits: [
      { startPct: 0.00, endPct: 0.02, limit: 65 },
      { startPct: 0.02, endPct: 0.33, limit: 40 },
      { startPct: 0.33, endPct: 0.70, limit: 30 },
      { startPct: 0.70, endPct: 1.0, limit: 50 },
    ]
  },
  {
    segment: "SNPD-VSH_THB",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 50 },
    ]
  },
  {
    segment: "TUH-JNJ",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "JNJ-NEU_THB",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "PNVL-KNDS",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "KNDS-MANR",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "MANR-KHAG",
    limits: [
      { startPct: 0.00, endPct: 0.55, limit: 95 },
      { startPct: 0.55, endPct: 0.98, limit: 90 },
      { startPct: 0.98, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "KHAG-BEPR",
    limits: [
      { startPct: 0.00, endPct: 0.39, limit: 95 },
      { startPct: 0.39, endPct: 0.85, limit: 80 },
      { startPct: 0.85, endPct: 1.00, limit: 40 },
    ]
  },
  {
    segment: "BEPR-SWDV",
    limits: [
      { startPct: 0.00, endPct: 0.15, limit: 45 },
      { startPct: 0.15, endPct: 0.37, limit: 65 },
      { startPct: 0.37, endPct: 0.80, limit: 80 },
      { startPct: 0.80, endPct: 1.00, limit: 65 },
    ]
  },
  {
    segment: "SWDV-NEU_THB",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "NEU_THB-SWDV",
    limits: [
      { startPct: 0.00, endPct: 0.12, limit: 95 },
      { startPct: 0.12, endPct: 0.39, limit: 30 },
      { startPct: 0.39, endPct: 0.65, limit: 90 },
      { startPct: 0.65, endPct: 1.00, limit: 80 },
    ]
  },
  {
    segment: "SWDV-BEPR",
    limits: [
      { startPct: 0.00, endPct: 0.17, limit: 80 },
      { startPct: 0.17, endPct: 0.29, limit: 95 },
      { startPct: 0.29, endPct: 0.72, limit: 80 },
      { startPct: 0.72, endPct: 0.77, limit: 95 },
      { startPct: 0.77, endPct: 0.88, limit: 65 },
      { startPct: 0.88, endPct: 1.00, limit: 45 },
    ]
  },
  {
    segment: "BEPR-KHAG",
    limits: [
      { startPct: 0.00, endPct: 0.16, limit: 45 },
      { startPct: 0.16, endPct: 0.79, limit: 80 },
      { startPct: 0.79, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "KHAG-MANR",
    limits: [
      { startPct: 0.00, endPct: 0.14, limit: 95 },
      { startPct: 0.14, endPct: 0.56, limit: 90 },
      { startPct: 0.56, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "MANR-KNDS",
    limits: [
      { startPct: 0.00, endPct: 0.46, limit: 95 },
      { startPct: 0.46, endPct: 0.86, limit: 90 },
      { startPct: 0.86, endPct: 1.00, limit: 95 },
    ]
  },
  {
    segment: "KNDS-PNVL",
    limits: [
      { startPct: 0.00, endPct: 1.00, limit: 95 },
    ]
  },
];

}


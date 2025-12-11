function getUniqueCumulativeDistancesForZeroSpeedAndDistance() {
  var ss = SpreadsheetApp.openByUrl(url);
  var sheet = ss.getSheetByName("SPM Data"); // Ensure the sheet name is correct
  var lRow = sheet.getLastRow();
  var dataRange = sheet.getRange("A2:E" + lRow); // Get data from columns A to E, starting from row 2
  var data = dataRange.getValues();
  
  var uniqueCumDistances = new Set(); // Use a Set to store unique cumulative distances
  
  for (var i = 0; i < data.length; i++) {
    var speed = data[i][2]; // Column C (Speed)
    var distance = data[i][3]; // Column D (Distance)
    var cumDistance = data[i][4]; // Column E (Cumulative Distance)
    
    // Check if speed is 0 and distance is 0 and cumDistance is valid
    if (speed == 0 && distance == 0 && cumDistance !== "" && cumDistance !== null && cumDistance !== undefined) {
      uniqueCumDistances.add(cumDistance); // Add cumulative distance to the Set
    }
  }
  
  var filteredDistances = Array.from(uniqueCumDistances).filter(value => value !== "" && value !== null && value !== undefined);
  
  Logger.log(filteredDistances); // Debugging log
  return filteredDistances;
}
function calculateDistanceDifferences(cumulativeDistances) {
  // Input validation
  if (!Array.isArray(cumulativeDistances) || cumulativeDistances.length === 0) {
    return [];
  }
  
  // Initialize result array with the first element as is
  var differences = [cumulativeDistances[0]];
  
  // Calculate differences between consecutive elements
  for (var i = 1; i < cumulativeDistances.length; i++) {
    var difference = cumulativeDistances[i] - cumulativeDistances[i-1];
    differences.push(difference);
  }
  
  return differences;
}

function getCompleteStationData() {
  // Get the historical data
  const historicalData = historicalDataOfstations();
  
  if (!historicalData || historicalData.length === 0) {
    return "No historical data available";
  }
  
  // Get the current train data
  const currentTrainData = currentDataInterStationDistance();
  
  if (!currentTrainData || currentTrainData.length === 0) {
    return "No current train data available";
  }
  
  // Create the output structure
  const result = {
    stations: historicalData[0].stations,
    pastTrains: [],
    currentTrain: currentTrainData
  };
  
  // Extract interStation data from each historical record
  historicalData.forEach(record => {
    // Clone the array to avoid reference issues
    const interStationData = [...record.interStation];
    result.pastTrains.push(interStationData);
  });
  Logger.log(result)
  return result;
}

function currentDataInterStationDistance(){

  const cumDist = getUniqueCumulativeDistancesForZeroSpeedAndDistance();
 const currISD = calculateDistanceDifferences(cumDist)
 Logger.log(currISD)
 return currISD

}

function formatStationDataForDisplay() {
  // Get the historical data
  const historicalData = historicalDataOfstations();
  
  if (!historicalData || historicalData.length === 0) {
    return "No historical data available";
  }
  
  // Create the output structure
  const result = {
    stations: historicalData[0].stations,
    pastTrains: []
  };
  
  // Extract interStation data from each historical record
  historicalData.forEach(record => {
    // Clone the array to avoid reference issues
    const interStationData = [...record.interStation];
    result.pastTrains.push(interStationData);
  });
  Logger.log(result)
  return result;
}

function historicalDataOfstations(){

  const stations =tripStationInfo()
  const fromStn =stations.fromStation
  const toStn = stations.toStation
  const sheetName = "UPHB"
  const result = processStationData(sheetName,fromStn,toStn)
  return result

}

function processStationData(sheetName, fromStn, toStn, sampleSize = 25) {
  var sheet = SpreadsheetApp.openByUrl(url).getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  
  var stationNames = data.map(row => row[0]); // First column has station names
  var fromIndex = stationNames.indexOf(fromStn);
  var toIndex = stationNames.indexOf(toStn);
  
  if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
    Logger.log("Invalid station selection");
    return;
  }

  // Extract station names for the selected range
  var selectedStations = stationNames.slice(fromIndex, toIndex + 1);
  
  var selectedData = [];
  for (var col = 1; col < data[0].length; col++) { // Loop through historical datasets
    var interStationDistances = [0]; // First station distance is always 0
for (var i = 1; i < toIndex - fromIndex + 1; i++) {
  interStationDistances.push(data[fromIndex + i][col]); // Add correct distances
}
    if (interStationDistances.every(val => val !== "")) { // Ensure valid dataset
      selectedData.push(interStationDistances);
    }
  }

  if (selectedData.length === 0) {
    Logger.log("No valid historical data found");
    return;
  }

  // Randomly sample data if needed
  var sampledData = selectedData.length > sampleSize ? shuffleArray(selectedData).slice(0, sampleSize) : selectedData;
  
  var results = sampledData.map(distances => {
    var cumulative = [0];
    for (var i = 1; i < distances.length; i++) {
      cumulative.push(cumulative[i - 1] + distances[i]);
    }
    return { stations: selectedStations, interStation: distances, cumulative: cumulative };
  });

  Logger.log(results);
  return results;
}

function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
function cumulativeSum(arr) {
  let sum = 0;
  return arr.map(d => sum += d);
}

function analyzeTrainStoppingPatterns(stationData = null) {
  if (!stationData) {
    stationData = getCompleteStationData();
  }

  // Compute cumulative distances
  const cumPastTrains = stationData.pastTrains.map(train => cumulativeSum(train));
  const cumCurrentTrain = cumulativeSum(stationData.currentTrain);

  // Calculate scaling factors
  const totalsPast = cumPastTrains.map(train => train[train.length - 1]);
  const medianTotal = median(totalsPast);
  const kPast = totalsPast.map(total => total / medianTotal);
  const kCurrent = cumCurrentTrain[cumCurrentTrain.length - 1] / medianTotal;

  // Scale cumulative distances
  const pastScaled = cumPastTrains.map((train, k) => train.map(c => c / kPast[k]));
  const scaledCurrent = cumCurrentTrain.map(c => c / kCurrent);

  // Estimate stop board locations
  const n = stationData.stations.length;
  const maxStop = [];
  const minStop = [];

  for (let i = 0; i < n; i++) {
    let maxS = 0, minS = Infinity;
    for (let k = 0; k < pastScaled.length; k++) {
      const scaled = pastScaled[k][i];
      if (scaled > maxS) maxS = scaled;
      if (scaled < minS) minS = scaled;
    }
    maxStop[i] = maxS;
    minStop[i] = minS;
  }

  // Check for issues
  const margin = 3;
  const issues = [];
  for (let i = 0; i < n; i++) {
    if (scaledCurrent[i] > maxStop[i] + margin) {
      issues.push({
        station: stationData.stations[i],
        type: 'overshoot',
        current: scaledCurrent[i],
        expected: maxStop[i],
        difference: scaledCurrent[i] - maxStop[i]
      });
    } else if (scaledCurrent[i] < minStop[i] - margin) {
      issues.push({
        station: stationData.stations[i],
        type: 'undershoot',
        current: scaledCurrent[i],
        expected: minStop[i],
        difference: minStop[i] - scaledCurrent[i]
      });
    }
  }

  // Find best path segments
  const segmentLength = 5;
  const path = [];
  for (let start = 0; start < n; start += segmentLength) {
    const end = Math.min(start + segmentLength, n);
    const bestK = findBestSegmentMatch(start, end, scaledCurrent, pastScaled);
    path.push({
      start: stationData.stations[start],
      end: stationData.stations[end - 1],
      trainIdx: bestK,
      stopBoards: pastScaled[bestK].slice(start, end)
    });
  }

  return {
    scalingFactors: { medianTotal, pastTrains: kPast, currentTrain: kCurrent },
    stopLocations: { maximum: maxStop, minimum: minStop },
    scaledData: { current: scaledCurrent, past: pastScaled },
    issues: issues,
    bestPath: path,
    chartStopBoards: maxStop
  };
}
/**
 * Calculate median value of an array
 * @param {Array} values - Array of numbers
 * @returns {Number} Median value
 */
function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Execute the analysis and log results
 */
function runTrainAnalysis() {
  const analysis = analyzeTrainStoppingPatterns();
  
  // Log issues
  Logger.log("Potential Issues:");
  analysis.issues.forEach(issue => {
    const issueType = issue.type === 'overshoot' ? 'Potential overshooting' : 'Stopped too far behind';
    Logger.log(`${issueType} at ${issue.station}: ${issue.current.toFixed(1)} vs ${issue.expected.toFixed(1)} (diff: ${issue.difference.toFixed(1)}m)`);
  });
  
  // Log path segments
  Logger.log("Most Suitable Path Segments:");
  analysis.bestPath.forEach(segment => {
    Logger.log(`From ${segment.start} to ${segment.end}: Use Train ${segment.trainIdx}, Stop Boards: [${segment.stopBoards.map(sb => sb.toFixed(1)).join(', ')}]`);
  });
  
  // Log stop board locations for charting
  Logger.log("Estimated Stop Board Locations for Chart:", analysis.chartStopBoards);
  
  return analysis;
}

function processStationDistances(sheetName, fromStation, toStation) {
  Logger.log(`processStationDistances: START - sheetName: ${sheetName}, fromStation: ${fromStation}, toStation: ${toStation}`);
  const ss = SpreadsheetApp.openByUrl(url);
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    Logger.log("Sheet not found: " + sheetName);
    return null;
  }

  // Get all data from the sheet
  const data = sheet.getDataRange().getValues();
  Logger.log(`processStationDistances: Data retrieved from sheet ${sheetName}, rows: ${data.length}`);

  // First row contains station names
  const stationNames = data[0];
  Logger.log(`processStationDistances: Station Names from header row:${stationNames}`, );

  // Create an array to store processed records
  const records = [];

  // Process each row (except header row)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const recordNumber = row[0];

    // Skip rows without record numbers
    if (!recordNumber) continue;

    const record = {
      recordNumber: recordNumber,
      stations: []
    };

    // Process each station in the row
    let cumulativeDistance = 0;

    for (let j = 1; j < row.length; j++) {
      // Skip if no station name or row data is empty
      if (!stationNames[j] || stationNames[j] === "" || row[j] === "") continue;

      const interStationDistance = row[j];
      cumulativeDistance += interStationDistance;

      record.stations.push({
        stationName: stationNames[j],
        interStationDistance: interStationDistance,
        cumulativeDistance: cumulativeDistance
      });
    }
    records.push(record);
    Logger.log(`processStationDistances: Processed record ${recordNumber}, stations count: ${record.stations.length}`);
  }

  // Filter records for the specific route if fromStation and toStation are provided
  let filteredRecords = records;
  if (fromStation && toStation) {
    filteredRecords = records.filter(record => { // Changed .map to .filter
      // Find indices of from and to stations
      const stationNamesInRecord = record.stations.map(s => s.stationName);
      const fromIndex = stationNamesInRecord.indexOf(fromStation);
      const toIndex = stationNamesInRecord.indexOf(toStation);

      // Record is valid ONLY if BOTH fromStation and toStation are found AND fromStation comes before toStation
      return fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex; // Corrected filtering condition

    }).map(record => { // .map is used AFTER filtering to transform the valid records
      // Find indices of from and to stations (again, but now on filtered records)
      const stationNames = record.stations.map(s => s.stationName);
      const fromIndex = stationNames.indexOf(fromStation);
      const toIndex = stationNames.indexOf(toStation);

      // Determine the direction (ascending or descending indices) - should be ascending now due to filter
      const ascending = true; // fromIndex < toIndex;  // Now we assume ascending order because of filtering
      const startIndex = ascending ? fromIndex : toIndex; // Start from fromStation index
      const endIndex = ascending ? toIndex : fromIndex;   // End at toStation index

      // Create a new record with only the stations in the route
      const filteredRecord = {
        recordNumber: record.recordNumber,
        stations: record.stations.slice(startIndex, endIndex + 1)
      };

      // Adjust cumulative distances to start from 0 at the first station
      if (filteredRecord.stations.length > 0) { // Check if there are stations after filtering
        const baseDistance = filteredRecord.stations[0].cumulativeDistance;
        filteredRecord.stations.forEach(station => {
          station.cumulativeDistance -= baseDistance;
        });
      }


      return filteredRecord;
    });
    Logger.log(`processStationDistances: Filtered records for route ${fromStation} to ${toStation}, records count after filter: ${filteredRecords.length}`);
  } else {
    Logger.log("processStationDistances: No station filtering applied.");
  }

  var result = {
    sheetName: sheetName,
    fromStation: fromStation,
    toStation: toStation,
    records: filteredRecords,
    stationNames:stationNames

  };
  Logger.log(result.records)
  Logger.log("processStationDistances: END - Result (summary):", {sheetName: result.sheetName, fromStation: result.fromStation, toStation: result.toStation, recordCount: result.records ? result.records.length : 0});
  return result;
}

function getStationDistanceData() {
  // Get the sheet name based on train direction and section
  const sheetInfo = pastDataSheetSelector();
  if (!sheetInfo) {
    Logger.log("Could not determine sheet information");
    return null;
  }

  // Get from and to station information
  const stationInfo = tripStationInfo();
  if (!stationInfo) {
    Logger.log("Could not determine station information");
    return null;
  }

  // Process the station distances
  const stationData = processStationDistances(
    sheetInfo.sheetName,
    stationInfo.fromStation,
    stationInfo.toStation
  );
  Logger.log("stn data is below")
Logger.log(stationData)
  if (stationData) { // Only index if stationData is successfully retrieved
    stationData.stationIndex = indexPastStationData(stationData); // Create and attach stationIndex
    Logger.log(`Station Data with Index:, ${stationData}`); // Log to confirm index is present
    Logger.log(stationData)
  } else {
    Logger.log("Station data processing failed, index not created.");
  }
Logger.log(stationData.stationNames)
  return stationData;
}
function indexPastStationData(pastStationData) {
  const stationIndex = {};
  pastStationData.records.forEach(record => {
    record.stations.forEach(station => {
      const stationName = station.stationName;
      if (!stationIndex[stationName]) {
        stationIndex[stationName] = [];
      }
      stationIndex[stationName].push({
        recordNumber: record.recordNumber,
        interStationDistance: station.interStationDistance,
        cumulativeDistance: station.cumulativeDistance
      });
    });
  });
  Logger.log(stationIndex)
  return stationIndex;
}

function mainFunctionToGetDynamicRoute() {
  // Step 1: Get station halts including starting station
  const stationHaltDetails = processHalts().scheduled; // Array of {station, cumulative}

  // Step 2: Get past station data for comparison/matching
  const pastStationData = getStationDistanceData();

  // Step 3: Get trip endpointsconst [fromStation, toStation] = tripStationInfo();

  const { fromStation, toStation } = tripStationInfo();
  // Step 4: Filter out the starting station so we begin from the first real halt
  const filteredHalts = stationHaltDetails.filter(halt => halt.station !== fromStation);

  // Debug log to confirm filtered halts
  Logger.log("Filtered Halts (excluding starting station): " + JSON.stringify(filteredHalts));

  // Step 5: Generate dynamic ISD data
  const isdData = createDynamicRoute(filteredHalts, pastStationData, toStation);

  // Step 6: Log final ISD array
  Logger.log("Generated ISD Data (starting from first halt): " + JSON.stringify(isdData));
  return isdData
}

function processHalts() {
  try {
    const matchedHalts = matchHaltsWithStations();
    const filteredHalts = removeDuplicateHalts(matchedHalts);

    const trainData = getScheduledHalts();
    const scheduledHalts = trainData.halts.split(",").map(s => s.trim());

    const {
      scheduledHalts: scheduled,
      nonScheduledHalts: nonScheduled
    } = separateScheduledAndNonScheduledHalts(filteredHalts, scheduledHalts);
Logger.log("GMN DEBUG")
    const { cumulativeDistances, interStationDistances } = getInterStationDistancesFromCumulative();
    const distanceToISD = new Map();
    cumulativeDistances.forEach((cd, i) => distanceToISD.set(cd, interStationDistances[i]));

    const attachISD = (halts) => halts.map(h => ({
      ...h,
      isd: distanceToISD.get(h.distance) ?? 0
    }));

    const scheduledWithISD = attachISD(scheduled);
    const nonScheduledWithISD = attachISD(nonScheduled);

    // Add Actual ISD now
    const scheduledWithActualISD = addActualISDToScheduledHalts(scheduledWithISD, nonScheduledWithISD);

    // Find missed scheduled halts
    const missedScheduled = scheduledHalts.filter(station =>
      !scheduledWithActualISD.some(halt => halt.station === station)
    );

    // Get adjusted ISD for skipped stations
    const pastData = getPastData();
    const adjustedISDMap = getAdjustedISDForSkippedStations(scheduledWithActualISD, missedScheduled, pastData);

    Logger.log("Scheduled Halts:");
    Logger.log(scheduledWithActualISD);
    Logger.log("Non-Scheduled/Unknown Halts:");
    Logger.log(nonScheduledWithISD);
    Logger.log("Missed Scheduled Halts:");
    Logger.log(missedScheduled);

    // Log the adjusted ISD Map in a readable format
    Logger.log("Adjusted ISD Map:");
    Logger.log(Object.fromEntries(adjustedISDMap)); // Convert Map to Object for logging

    return {
      scheduled: scheduledWithActualISD,
      nonScheduled: nonScheduledWithISD,
      missedScheduled: missedScheduled.length > 0 ? missedScheduled : null,
      adjustedISDMap: adjustedISDMap.size > 0 ? Object.fromEntries(adjustedISDMap) : null
    };
  } catch (error) {
    Logger.log(`Error in processHalts: ${error.message}`);
    return null;
  }
}

function matchHaltsWithStations020725() {
  const { cumulativeDistances, interStationDistances } = getInterStationDistancesFromCumulative();
  const pastData = getPastData();

  // If we have no data, return early
  if (!cumulativeDistances || cumulativeDistances.length === 0 || 
      !pastData || !pastData.stationHeaders || pastData.stationHeaders.length === 0) {
    Logger.log("No data available for matching");
    return [];
  }

  // Get scheduled halts for this train (works for both fast and slow trains)
  const trainData = getScheduledHalts();
  const scheduledHalts = trainData.halts ? trainData.halts.split(",").map(s => s.trim()) : pastData.stationHeaders;
  const isFastTrain = trainData.trainType === "Fast";
  
  Logger.log("Train Type:", trainData.trainType);
  Logger.log("Scheduled halts for this train:", scheduledHalts);
  Logger.log("All stations in sheet:", pastData.stationHeaders);

  // Calculate total actual journey distance for filtering
  const totalActualDistance = cumulativeDistances[cumulativeDistances.length - 1];
  const distanceTolerance = 150; // ±150m tolerance
  
  Logger.log(`Total actual journey distance: ${totalActualDistance}m, tolerance: ±${distanceTolerance}m`);

  // Get from and to station indices for the journey segment
  const fromStation = trainData.from;
  const toStation = trainData.to;
  const fromIndex = pastData.stationHeaders.indexOf(fromStation);
  const toIndex = pastData.stationHeaders.indexOf(toStation);
  
  if (fromIndex === -1 || toIndex === -1) {
    Logger.log(`Could not find station indices: ${fromStation}=${fromIndex}, ${toStation}=${toIndex}`);
    return [];
  }

  // Get original sheet data for raw value validation
  const ss = SpreadsheetApp.openByUrl(url);
  const sheet = ss.getSheetByName(pastDataSheetSelector().sheetName);
  const originalSheetData = sheet.getDataRange().getValues();
  
  Logger.log(`Getting original sheet data for validation. Sheet: ${pastDataSheetSelector().sheetName}`);

  // Filter records based on data quality and distance range
  const filteredRecords = pastData.records.filter((record, recordIndex) => {
    // Check if record has valid journey distance
    if (fromIndex >= record.cumulativeDistances.length || toIndex >= record.cumulativeDistances.length) {
      Logger.log(`Record ${recordIndex} REJECTED: Index out of range`);
      return false;
    }
    
    // TEMPORARILY DISABLED: Distance range filtering
    // const recordTotalDistance = record.cumulativeDistances[toIndex] - record.cumulativeDistances[fromIndex];
    // const distanceDiff = Math.abs(recordTotalDistance - totalActualDistance);
    // 
    // if (distanceDiff > distanceTolerance) {
    //   Logger.log(`Record ${recordIndex} REJECTED: Distance diff ${distanceDiff}m > ${distanceTolerance}m tolerance`);
    //   return false;
    // }

    // Check data validity based on train type
    if (isFastTrain) {
      // For fast trains: Check original sheet data for ALL scheduled halt stations
      const originalRowIndex = record.recordNumber; // This should correspond to row number in sheet
      
      if (originalRowIndex && originalRowIndex < originalSheetData.length) {
        const originalRowData = originalSheetData[originalRowIndex]; // Get the actual row from sheet
        
        Logger.log(`Record ${recordIndex} (Sheet row ${originalRowIndex}): Checking original sheet data for scheduled halts`);
        
        for (const haltStation of scheduledHalts) {
          const stationColumnIndex = pastData.stationHeaders.indexOf(haltStation);
          if (stationColumnIndex === -1) {
            Logger.log(`Record ${recordIndex} REJECTED: Station ${haltStation} not found in headers`);
            return false;
          }
          
          // Get original value from sheet (add 1 to skip header row)
          const originalValue = originalRowData[stationColumnIndex + 1]; // +1 because sheet has record number in column 0
          
          if (stationColumnIndex === fromIndex) {
            // Origin station: can be 0 but not null/blank/undefined
            if (originalValue === null || originalValue === '' || originalValue === undefined) {
              Logger.log(`Record ${recordIndex} REJECTED: Origin station ${haltStation} has blank/null value in original sheet`);
              return false;
            }
          } else {
            // All other scheduled stations: must have valid non-zero data in original sheet
            if (originalValue === null || originalValue === '' || originalValue === undefined || originalValue === 0) {
              Logger.log(`Record ${recordIndex} REJECTED: Scheduled station ${haltStation} has invalid value in original sheet: ${originalValue} (type: ${typeof originalValue})`);
              return false;
            }
          }
        }
        Logger.log(`Record ${recordIndex} PASSED: All scheduled stations have valid data in original sheet`);
      } else {
        Logger.log(`Record ${recordIndex} REJECTED: Cannot find corresponding row in original sheet data`);
        return false;
      }
    } else {
      // For slow trains: check all stations in journey segment have valid data
      for (let i = fromIndex; i <= toIndex; i++) {
        if (i < record.cumulativeDistances.length) {
          const value = record.cumulativeDistances[i];
          // Allow 0 only for the origin station
          if ((value === 0 || value === null || value === undefined) && i !== fromIndex) {
            return false;
          }
        }
      }
    }
    
    return true;
  });

  Logger.log(`Filtered records: ${filteredRecords.length} out of ${pastData.records.length} total records`);

  // ADD DETAILED LOGGING FOR FILTERED RECORDS
  if (filteredRecords.length > 0) {
    Logger.log("=== DETAILED FILTERED RECORDS DATA ===");
    filteredRecords.forEach((record, index) => {
      Logger.log(`\nFiltered Record ${index} (Original Record ${record.recordNumber || 'unknown'}):`);
      Logger.log(`  Inter-station distances: ${JSON.stringify(record.interStationDistances)}`);
      Logger.log(`  Cumulative distances: ${JSON.stringify(record.cumulativeDistances)}`);
      
      // Show specific station distances for scheduled halts
      Logger.log(`  Scheduled halt positions:`);
      scheduledHalts.forEach(station => {
        const stationIndex = pastData.stationHeaders.indexOf(station);
        if (stationIndex !== -1 && stationIndex < record.cumulativeDistances.length) {
          Logger.log(`    ${station} (index ${stationIndex}): ${record.cumulativeDistances[stationIndex]}m`);
        }
      });
      
      // Calculate total journey distance for this record
      const recordTotalDistance = record.cumulativeDistances[toIndex] - record.cumulativeDistances[fromIndex];
      Logger.log(`  Total journey distance: ${recordTotalDistance}m (actual: ${totalActualDistance}m, diff: ${Math.abs(recordTotalDistance - totalActualDistance)}m)`);
    });
    Logger.log("=== END FILTERED RECORDS DATA ===\n");
  }

  if (filteredRecords.length === 0) {
    Logger.log("No valid records found after filtering");
    return [];
  }

  const matchedStations = [];

  // First halt always matched to the first scheduled station
  matchedStations.push({ 
    distance: cumulativeDistances[0], 
    station: scheduledHalts[0]
  });

  // Track current position in scheduled halts sequence
  let currentScheduledHaltIndex = 0;
  let accumulatedISDSinceLastStation = 0; // Track accumulated ISD since last proper station match
  
  // Matching thresholds
  const MAX_CD_DIFF = 300;
  const MAX_ISD_DIFF = 100;

  for (let i = 1; i < cumulativeDistances.length; i++) {
    const targetCD = cumulativeDistances[i];
    const currentHaltISD = interStationDistances[i];
    
    // Calculate the ISD to use for matching
    const targetISD = accumulatedISDSinceLastStation + currentHaltISD;

    Logger.log(`\n--- Processing halt ${i}: CD=${targetCD}m, Current ISD=${currentHaltISD}m, Accumulated ISD for matching=${targetISD}m ---`);

    let matched = false;

    // STEP 1: Check the immediate next expected scheduled station
    const nextScheduledHaltIndex = currentScheduledHaltIndex + 1;
    
    if (nextScheduledHaltIndex < scheduledHalts.length) {
      const nextScheduledStation = scheduledHalts[nextScheduledHaltIndex];
      const nextExpectedIndex = pastData.stationHeaders.indexOf(nextScheduledStation);
      
      if (nextExpectedIndex !== -1) {
        Logger.log(`Checking next scheduled station: ${nextScheduledStation} (sheet index ${nextExpectedIndex})`);

        // Get current station's sheet index for ISD calculation
        const currentScheduledStation = scheduledHalts[currentScheduledHaltIndex];
        const currentSheetIndex = pastData.stationHeaders.indexOf(currentScheduledStation);

        if (currentSheetIndex !== -1) {
          // Check this station against filtered records only
          for (let r = 0; r < filteredRecords.length; r++) {
            const record = filteredRecords[r];
            
            if (nextExpectedIndex < record.cumulativeDistances.length && 
                currentSheetIndex < record.cumulativeDistances.length) {
              
              const expectedCD = record.cumulativeDistances[nextExpectedIndex];
              const expectedPrevCD = record.cumulativeDistances[currentSheetIndex];
              const expectedISD = expectedCD - expectedPrevCD;

              if (expectedCD > expectedPrevCD && expectedISD > 0) {
                const cdDiff = Math.abs(targetCD - expectedCD);
                const isdDiff = Math.abs(targetISD - expectedISD);

                Logger.log(`  Filtered Record ${r}: Expected CD=${expectedCD}, ISD=${expectedISD}, Diffs: CD=${cdDiff}, ISD=${isdDiff}`);

                // MATCH FOUND with next expected scheduled station
                if (cdDiff <= MAX_CD_DIFF && isdDiff <= MAX_ISD_DIFF) {
                  matchedStations.push({
                    distance: targetCD,
                    station: nextScheduledStation
                  });
                  currentScheduledHaltIndex = nextScheduledHaltIndex;
                  accumulatedISDSinceLastStation = 0; // Reset accumulated ISD
                  matched = true;
                  Logger.log(`  ✓ MATCHED with ${nextScheduledStation}`);
                  break;
                }
              }
            }
          }
        }
      }
    }

    // STEP 2: If not matched with immediate next, check if we should skip to the one after
    // BUT ONLY if halt distance > expected next station distance (logical distance check)
    if (!matched && (nextScheduledHaltIndex + 1) < scheduledHalts.length) {
      const skipToScheduledIndex = nextScheduledHaltIndex + 1;
      const skipToScheduledStation = scheduledHalts[skipToScheduledIndex];
      const skipToSheetIndex = pastData.stationHeaders.indexOf(skipToScheduledStation);
      
      // Get expected distance for next scheduled station to validate logic
      let expectedNextStationCD = null;
      const nextScheduledStation = scheduledHalts[nextScheduledHaltIndex];
      const nextExpectedIndex = pastData.stationHeaders.indexOf(nextScheduledStation);
      const currentScheduledStation = scheduledHalts[currentScheduledHaltIndex];
      const currentSheetIndex = pastData.stationHeaders.indexOf(currentScheduledStation);
      
      if (nextExpectedIndex !== -1 && currentSheetIndex !== -1 && filteredRecords.length > 0) {
        // Use average of filtered records for expected distance
        let totalCD = 0;
        let validRecords = 0;
        for (const record of filteredRecords) {
          if (nextExpectedIndex < record.cumulativeDistances.length) {
            totalCD += record.cumulativeDistances[nextExpectedIndex];
            validRecords++;
          }
        }
        if (validRecords > 0) {
          expectedNextStationCD = totalCD / validRecords;
        }
      }
      
      // CRITICAL CHECK: Only try skip logic if halt distance > expected next station distance
      if (expectedNextStationCD === null || targetCD > expectedNextStationCD) {
        if (skipToSheetIndex !== -1) {
          Logger.log(`Halt distance (${targetCD}m) > expected next station distance (${expectedNextStationCD}m), checking skip to ${skipToScheduledStation} (sheet index ${skipToSheetIndex})`);

          if (currentSheetIndex !== -1) {
            for (let r = 0; r < filteredRecords.length; r++) {
              const record = filteredRecords[r];
              
              if (skipToSheetIndex < record.cumulativeDistances.length && 
                  currentSheetIndex < record.cumulativeDistances.length) {
                
                const expectedCD = record.cumulativeDistances[skipToSheetIndex];
                const expectedPrevCD = record.cumulativeDistances[currentSheetIndex];
                const expectedISD = expectedCD - expectedPrevCD;

                if (expectedCD > expectedPrevCD && expectedISD > 0) {
                  const cdDiff = Math.abs(targetCD - expectedCD);
                  // For skipped scheduled station, ISD won't match but cumulative should
                  
                  Logger.log(`  Filtered Record ${r}: Expected CD=${expectedCD}, ISD=${expectedISD}, CD diff=${cdDiff}`);

                  // Check if cumulative matches (indicating we skipped the previous scheduled station)
                  if (cdDiff <= MAX_CD_DIFF) {
                    matchedStations.push({
                      distance: targetCD,
                      station: skipToScheduledStation
                    });
                    currentScheduledHaltIndex = skipToScheduledIndex;
                    accumulatedISDSinceLastStation = 0; // Reset accumulated ISD
                    matched = true;
                    Logger.log(`  ✓ MATCHED with ${skipToScheduledStation} (skipped previous scheduled station)`);
                    break;
                  }
                }
              }
            }
          }
        }
      } else {
        Logger.log(`Halt distance (${targetCD}m) <= expected next station distance (${expectedNextStationCD}m), cannot be a later station`);
      }
    }

    // STEP 3: If still not matched, check if we should auto-advance to skip missed stations
    if (!matched) {
      // Check if halt distance is significantly beyond the expected next station
      // This prevents getting stuck trying to match the same missed station repeatedly
      
      let expectedNextStationCD = null;
      const nextScheduledStation = scheduledHalts[nextScheduledHaltIndex];
      const nextExpectedIndex = pastData.stationHeaders.indexOf(nextScheduledStation);
      const currentScheduledStation = scheduledHalts[currentScheduledHaltIndex];
      const currentSheetIndex = pastData.stationHeaders.indexOf(currentScheduledStation);
      
      if (nextExpectedIndex !== -1 && currentSheetIndex !== -1 && filteredRecords.length > 0) {
        // Use average of filtered records for expected distance
        let totalCD = 0;
        let validRecords = 0;
        for (const record of filteredRecords) {
          if (nextExpectedIndex < record.cumulativeDistances.length) {
            totalCD += record.cumulativeDistances[nextExpectedIndex];
            validRecords++;
          }
        }
        if (validRecords > 0) {
          expectedNextStationCD = totalCD / validRecords;
        }
      }
      
      // Auto-advance thresholds
      const CD_ADVANCE_THRESHOLD = 400; // 400m cumulative distance threshold
      const ISD_ADVANCE_THRESHOLD = 150; // 150m inter-station distance threshold
      
      // Check if we should auto-advance past the missed station
      if (expectedNextStationCD !== null && 
          targetCD > expectedNextStationCD + CD_ADVANCE_THRESHOLD) {
        
        Logger.log(`Halt distance (${targetCD}m) > expected ${nextScheduledStation} distance (${expectedNextStationCD}m) + ${CD_ADVANCE_THRESHOLD}m threshold. Auto-advancing past missed station.`);
        
        // Try to find the next appropriate scheduled station
        let advancedToStation = false;
        
        for (let advanceIndex = nextScheduledHaltIndex + 1; 
             advanceIndex < scheduledHalts.length; 
             advanceIndex++) {
          
          const advancedScheduledStation = scheduledHalts[advanceIndex];
          const advancedSheetIndex = pastData.stationHeaders.indexOf(advancedScheduledStation);
          
          if (advancedSheetIndex !== -1) {
            // Calculate expected cumulative distance for this advanced station
            let expectedAdvancedCD = null;
            let totalAdvancedCD = 0;
            let validAdvancedRecords = 0;
            
            for (const record of filteredRecords) {
              if (advancedSheetIndex < record.cumulativeDistances.length) {
                totalAdvancedCD += record.cumulativeDistances[advancedSheetIndex];
                validAdvancedRecords++;
              }
            }
            
            if (validAdvancedRecords > 0) {
              expectedAdvancedCD = totalAdvancedCD / validAdvancedRecords;
              
              // Check if this advanced station is a better match
              const advancedCDDiff = Math.abs(targetCD - expectedAdvancedCD);
              
              Logger.log(`  Checking advanced station ${advancedScheduledStation}: expected CD=${expectedAdvancedCD}m, diff=${advancedCDDiff}m`);
              
              if (advancedCDDiff <= CD_ADVANCE_THRESHOLD) {
                // Found a potential match, now check if ISD also makes sense
                const expectedAdvancedISD = expectedAdvancedCD - (currentSheetIndex !== -1 ? 
                  filteredRecords[0].cumulativeDistances[currentSheetIndex] : 0);
                const advancedISDDiff = Math.abs(targetISD - expectedAdvancedISD);
                
                Logger.log(`    Advanced ISD check: expected ISD=${expectedAdvancedISD}m, diff=${advancedISDDiff}m`);
                
                if (advancedISDDiff <= ISD_ADVANCE_THRESHOLD) {
                  // This is a good match
                  matchedStations.push({
                    distance: targetCD,
                    station: advancedScheduledStation
                  });
                  currentScheduledHaltIndex = advanceIndex;
                  accumulatedISDSinceLastStation = 0; // Reset accumulated ISD
                  matched = true;
                  advancedToStation = true;
                  Logger.log(`  ✓ AUTO-ADVANCED and MATCHED with ${advancedScheduledStation} (skipped intermediate stations)`);
                  break;
                } else if (advancedCDDiff <= CD_ADVANCE_THRESHOLD) {
                  // CD matches but ISD doesn't - still advance index but mark as Unknown
                  Logger.log(`  → AUTO-ADVANCING index to ${advancedScheduledStation} position but marking halt as Unknown (ISD mismatch)`);
                  currentScheduledHaltIndex = advanceIndex;
                  advancedToStation = true;
                  break;
                }
              }
            }
          }
        }
        
        if (!advancedToStation) {
          Logger.log(`  No suitable advanced station found within thresholds`);
        }
      }
      
      // If still not matched after auto-advance attempt, mark as Unknown
      if (!matched) {
        matchedStations.push({
          distance: targetCD,
          station: "Unknown"
        });
        Logger.log(`  ✗ UNKNOWN - halt between stations or before proper station sequence`);
        // Don't advance currentScheduledHaltIndex, but accumulate the ISD
        accumulatedISDSinceLastStation += currentHaltISD;
      }
    }
  }

  Logger.log("Final matched stations:", matchedStations);
  Logger.log(matchedStations);
  return matchedStations;
}


//this function detects halts in fast trains.when a halt  is marked as unknown, it still checks for next proper halts
// but failed in detecting a halt just beforeMSD. marked that halt as MSD and proper MSD halt as unknown

function matchHaltsWithStations0107cgp() {
  const { cumulativeDistances, interStationDistances } = getInterStationDistancesFromCumulative();
  const pastData = getPastData();

  if (!cumulativeDistances || cumulativeDistances.length === 0 || 
      !pastData || !pastData.stationHeaders || pastData.stationHeaders.length === 0) {
    Logger.log("No data available for matching");
    return [];
  }

  const trainData = getScheduledHalts();
  const scheduledHalts = trainData.halts ? trainData.halts.split(",").map(s => s.trim()) : pastData.stationHeaders;
  const isFastTrain = trainData.trainType === "Fast";

  Logger.log("Train Type:", trainData.trainType);
  Logger.log("Scheduled halts for this train:", scheduledHalts);
  Logger.log("All stations in sheet:", pastData.stationHeaders);

  const totalActualDistance = cumulativeDistances[cumulativeDistances.length - 1];
  const distanceTolerance = 150;

  const fromStation = trainData.from;
  const toStation = trainData.to;
  const fromIndex = pastData.stationHeaders.indexOf(fromStation);
  const toIndex = pastData.stationHeaders.indexOf(toStation);

  if (fromIndex === -1 || toIndex === -1) {
    Logger.log(`Could not find station indices: ${fromStation}=${fromIndex}, ${toStation}=${toIndex}`);
    return [];
  }

  const ss = SpreadsheetApp.openByUrl(url);
  const sheet = ss.getSheetByName(pastDataSheetSelector().sheetName);
  const originalSheetData = sheet.getDataRange().getValues();

  const filteredRecords = pastData.records.filter((record, recordIndex) => {
    if (fromIndex >= record.cumulativeDistances.length || toIndex >= record.cumulativeDistances.length) return false;

    if (isFastTrain) {
      const originalRowIndex = record.recordNumber;
      if (originalRowIndex && originalRowIndex < originalSheetData.length) {
        const originalRowData = originalSheetData[originalRowIndex];
        for (const haltStation of scheduledHalts) {
          const stationColumnIndex = pastData.stationHeaders.indexOf(haltStation);
          if (stationColumnIndex === -1) return false;
          const originalValue = originalRowData[stationColumnIndex + 1];
          if (stationColumnIndex === fromIndex) {
            if (originalValue === null || originalValue === '' || originalValue === undefined) return false;
          } else {
            if (originalValue === null || originalValue === '' || originalValue === undefined || originalValue === 0) return false;
          }
        }
      } else return false;
    } else {
      for (let i = fromIndex; i <= toIndex; i++) {
        if (i < record.cumulativeDistances.length) {
          const value = record.cumulativeDistances[i];
          if ((value === 0 || value === null || value === undefined) && i !== fromIndex) return false;
        }
      }
    }
    return true;
  });

  if (filteredRecords.length === 0) return [];

  const matchedStations = [];
  matchedStations.push({ distance: cumulativeDistances[0], station: scheduledHalts[0] });

  let currentScheduledHaltIndex = 0;
  let accumulatedISDSinceLastStation = 0;
  const MAX_CD_DIFF = 300;
  const MAX_ISD_DIFF = 100;

  for (let i = 1; i < cumulativeDistances.length; i++) {
    const targetCD = cumulativeDistances[i];
    const currentHaltISD = interStationDistances[i];
    const targetISD = accumulatedISDSinceLastStation + currentHaltISD;
    let matched = false;

    for (let advanceIndex = currentScheduledHaltIndex + 1; advanceIndex < scheduledHalts.length; advanceIndex++) {
      const scheduledStation = scheduledHalts[advanceIndex];
      const stationSheetIndex = pastData.stationHeaders.indexOf(scheduledStation);
      if (stationSheetIndex === -1) continue;

      let sumCD = 0, count = 0;
      for (const record of filteredRecords) {
        if (record.cumulativeDistances.length > stationSheetIndex) {
          sumCD += record.cumulativeDistances[stationSheetIndex];
          count++;
        }
      }
      if (count === 0) continue;

      const expectedCD = sumCD / count;
      const cdDiff = Math.abs(targetCD - expectedCD);

      if (cdDiff <= MAX_CD_DIFF) {
        matchedStations.push({ distance: targetCD, station: scheduledStation });
        currentScheduledHaltIndex = advanceIndex;
        accumulatedISDSinceLastStation = 0;
        matched = true;
        break;
      }
    }

    if (!matched) {
      matchedStations.push({ distance: targetCD, station: "Unknown" });
      accumulatedISDSinceLastStation += currentHaltISD;
    }
  }

  Logger.log("Final matched stations:", matchedStations);
  Logger.log( matchedStations);
  return matchedStations;
}

function matchHaltsWithStations010725() {
  const { cumulativeDistances, interStationDistances } = getInterStationDistancesFromCumulative();
  const pastData = getPastData();

  // If we have no data, return early
  if (!cumulativeDistances || cumulativeDistances.length === 0 || 
      !pastData || !pastData.stationHeaders || pastData.stationHeaders.length === 0) {
    Logger.log("No data available for matching");
    return [];
  }

  // Get scheduled halts for this train (works for both fast and slow trains)
  const trainData = getScheduledHalts();
  const scheduledHalts = trainData.halts ? trainData.halts.split(",").map(s => s.trim()) : pastData.stationHeaders;
  const isFastTrain = trainData.trainType === "Fast";
  
  Logger.log("Train Type:", trainData.trainType);
  Logger.log("Scheduled halts for this train:", scheduledHalts);
  Logger.log("All stations in sheet:", pastData.stationHeaders);

  // Calculate total actual journey distance for filtering
  const totalActualDistance = cumulativeDistances[cumulativeDistances.length - 1];
  const distanceTolerance = 150; // ±150m tolerance
  
  Logger.log(`Total actual journey distance: ${totalActualDistance}m, tolerance: ±${distanceTolerance}m`);

  // Get from and to station indices for the journey segment
  const fromStation = trainData.from;
  const toStation = trainData.to;
  const fromIndex = pastData.stationHeaders.indexOf(fromStation);
  const toIndex = pastData.stationHeaders.indexOf(toStation);
  
  if (fromIndex === -1 || toIndex === -1) {
    Logger.log(`Could not find station indices: ${fromStation}=${fromIndex}, ${toStation}=${toIndex}`);
    return [];
  }

  // Get original sheet data for raw value validation
  const ss = SpreadsheetApp.openByUrl(url);
  const sheet = ss.getSheetByName(pastDataSheetSelector().sheetName);
  const originalSheetData = sheet.getDataRange().getValues();
  
  Logger.log(`Getting original sheet data for validation. Sheet: ${pastDataSheetSelector().sheetName}`);

  // Filter records based on data quality and distance range
  const filteredRecords = pastData.records.filter((record, recordIndex) => {
    // Check if record has valid journey distance
    if (fromIndex >= record.cumulativeDistances.length || toIndex >= record.cumulativeDistances.length) {
      Logger.log(`Record ${recordIndex} REJECTED: Index out of range`);
      return false;
    }
    
    // TEMPORARILY DISABLED: Distance range filtering
    // const recordTotalDistance = record.cumulativeDistances[toIndex] - record.cumulativeDistances[fromIndex];
    // const distanceDiff = Math.abs(recordTotalDistance - totalActualDistance);
    // 
    // if (distanceDiff > distanceTolerance) {
    //   Logger.log(`Record ${recordIndex} REJECTED: Distance diff ${distanceDiff}m > ${distanceTolerance}m tolerance`);
    //   return false;
    // }

    // Check data validity based on train type
    if (isFastTrain) {
      // For fast trains: Check original sheet data for ALL scheduled halt stations
      const originalRowIndex = record.recordNumber; // This should correspond to row number in sheet
      
      if (originalRowIndex && originalRowIndex < originalSheetData.length) {
        const originalRowData = originalSheetData[originalRowIndex]; // Get the actual row from sheet
        
        Logger.log(`Record ${recordIndex} (Sheet row ${originalRowIndex}): Checking original sheet data for scheduled halts`);
        
        for (const haltStation of scheduledHalts) {
          const stationColumnIndex = pastData.stationHeaders.indexOf(haltStation);
          if (stationColumnIndex === -1) {
            Logger.log(`Record ${recordIndex} REJECTED: Station ${haltStation} not found in headers`);
            return false;
          }
          
          // Get original value from sheet (add 1 to skip header row)
          const originalValue = originalRowData[stationColumnIndex + 1]; // +1 because sheet has record number in column 0
          
          if (stationColumnIndex === fromIndex) {
            // Origin station: can be 0 but not null/blank/undefined
            if (originalValue === null || originalValue === '' || originalValue === undefined) {
              Logger.log(`Record ${recordIndex} REJECTED: Origin station ${haltStation} has blank/null value in original sheet`);
              return false;
            }
          } else {
            // All other scheduled stations: must have valid non-zero data in original sheet
            if (originalValue === null || originalValue === '' || originalValue === undefined || originalValue === 0) {
              Logger.log(`Record ${recordIndex} REJECTED: Scheduled station ${haltStation} has invalid value in original sheet: ${originalValue} (type: ${typeof originalValue})`);
              return false;
            }
          }
        }
        Logger.log(`Record ${recordIndex} PASSED: All scheduled stations have valid data in original sheet`);
      } else {
        Logger.log(`Record ${recordIndex} REJECTED: Cannot find corresponding row in original sheet data`);
        return false;
      }
    } else {
      // For slow trains: check all stations in journey segment have valid data
      for (let i = fromIndex; i <= toIndex; i++) {
        if (i < record.cumulativeDistances.length) {
          const value = record.cumulativeDistances[i];
          // Allow 0 only for the origin station
          if ((value === 0 || value === null || value === undefined) && i !== fromIndex) {
            return false;
          }
        }
      }
    }
    
    return true;
  });

  Logger.log(`Filtered records: ${filteredRecords.length} out of ${pastData.records.length} total records`);

  // ADD DETAILED LOGGING FOR FILTERED RECORDS
  if (filteredRecords.length > 0) {
    Logger.log("=== DETAILED FILTERED RECORDS DATA ===");
    filteredRecords.forEach((record, index) => {
      Logger.log(`\nFiltered Record ${index} (Original Record ${record.recordNumber || 'unknown'}):`);
      Logger.log(`  Inter-station distances: ${JSON.stringify(record.interStationDistances)}`);
      Logger.log(`  Cumulative distances: ${JSON.stringify(record.cumulativeDistances)}`);
      
      // Show specific station distances for scheduled halts
      Logger.log(`  Scheduled halt positions:`);
      scheduledHalts.forEach(station => {
        const stationIndex = pastData.stationHeaders.indexOf(station);
        if (stationIndex !== -1 && stationIndex < record.cumulativeDistances.length) {
          Logger.log(`    ${station} (index ${stationIndex}): ${record.cumulativeDistances[stationIndex]}m`);
        }
      });
      
      // Calculate total journey distance for this record
      const recordTotalDistance = record.cumulativeDistances[toIndex] - record.cumulativeDistances[fromIndex];
      Logger.log(`  Total journey distance: ${recordTotalDistance}m (actual: ${totalActualDistance}m, diff: ${Math.abs(recordTotalDistance - totalActualDistance)}m)`);
    });
    Logger.log("=== END FILTERED RECORDS DATA ===\n");
  }

  if (filteredRecords.length === 0) {
    Logger.log("No valid records found after filtering");
    return [];
  }

  const matchedStations = [];

  // First halt always matched to the first scheduled station
  matchedStations.push({ 
    distance: cumulativeDistances[0], 
    station: scheduledHalts[0]
  });

  // Track current position in scheduled halts sequence
  let currentScheduledHaltIndex = 0;
  let accumulatedISDSinceLastStation = 0; // Track accumulated ISD since last proper station match
  
  // Matching thresholds
  const MAX_CD_DIFF = 300;
  const MAX_ISD_DIFF = 100;

  for (let i = 1; i < cumulativeDistances.length; i++) {
    const targetCD = cumulativeDistances[i];
    const currentHaltISD = interStationDistances[i];
    
    // Calculate the ISD to use for matching
    const targetISD = accumulatedISDSinceLastStation + currentHaltISD;

    Logger.log(`\n--- Processing halt ${i}: CD=${targetCD}m, Current ISD=${currentHaltISD}m, Accumulated ISD for matching=${targetISD}m ---`);

    let matched = false;

    // STEP 1: Check the immediate next expected scheduled station
    const nextScheduledHaltIndex = currentScheduledHaltIndex + 1;
    
    if (nextScheduledHaltIndex < scheduledHalts.length) {
      const nextScheduledStation = scheduledHalts[nextScheduledHaltIndex];
      const nextExpectedIndex = pastData.stationHeaders.indexOf(nextScheduledStation);
      
      if (nextExpectedIndex !== -1) {
        Logger.log(`Checking next scheduled station: ${nextScheduledStation} (sheet index ${nextExpectedIndex})`);

        // Get current station's sheet index for ISD calculation
        const currentScheduledStation = scheduledHalts[currentScheduledHaltIndex];
        const currentSheetIndex = pastData.stationHeaders.indexOf(currentScheduledStation);

        if (currentSheetIndex !== -1) {
          // Check this station against filtered records only
          for (let r = 0; r < filteredRecords.length; r++) {
            const record = filteredRecords[r];
            
            if (nextExpectedIndex < record.cumulativeDistances.length && 
                currentSheetIndex < record.cumulativeDistances.length) {
              
              const expectedCD = record.cumulativeDistances[nextExpectedIndex];
              const expectedPrevCD = record.cumulativeDistances[currentSheetIndex];
              const expectedISD = expectedCD - expectedPrevCD;

              if (expectedCD > expectedPrevCD && expectedISD > 0) {
                const cdDiff = Math.abs(targetCD - expectedCD);
                const isdDiff = Math.abs(targetISD - expectedISD);

                Logger.log(`  Filtered Record ${r}: Expected CD=${expectedCD}, ISD=${expectedISD}, Diffs: CD=${cdDiff}, ISD=${isdDiff}`);

                // MATCH FOUND with next expected scheduled station
                if (cdDiff <= MAX_CD_DIFF && isdDiff <= MAX_ISD_DIFF) {
                  matchedStations.push({
                    distance: targetCD,
                    station: nextScheduledStation
                  });
                  currentScheduledHaltIndex = nextScheduledHaltIndex;
                  accumulatedISDSinceLastStation = 0; // Reset accumulated ISD
                  matched = true;
                  Logger.log(`  ✓ MATCHED with ${nextScheduledStation}`);
                  break;
                }
              }
            }
          }
        }
      }
    }

    // STEP 2: If not matched with immediate next, check if we should skip to the one after
    // BUT ONLY if halt distance > expected next station distance (logical distance check)
    if (!matched && (nextScheduledHaltIndex + 1) < scheduledHalts.length) {
      const skipToScheduledIndex = nextScheduledHaltIndex + 1;
      const skipToScheduledStation = scheduledHalts[skipToScheduledIndex];
      const skipToSheetIndex = pastData.stationHeaders.indexOf(skipToScheduledStation);
      
      // Get expected distance for next scheduled station to validate logic
      let expectedNextStationCD = null;
      const nextScheduledStation = scheduledHalts[nextScheduledHaltIndex];
      const nextExpectedIndex = pastData.stationHeaders.indexOf(nextScheduledStation);
      const currentScheduledStation = scheduledHalts[currentScheduledHaltIndex];
      const currentSheetIndex = pastData.stationHeaders.indexOf(currentScheduledStation);
      
      if (nextExpectedIndex !== -1 && currentSheetIndex !== -1 && filteredRecords.length > 0) {
        // Use average of filtered records for expected distance
        let totalCD = 0;
        let validRecords = 0;
        for (const record of filteredRecords) {
          if (nextExpectedIndex < record.cumulativeDistances.length) {
            totalCD += record.cumulativeDistances[nextExpectedIndex];
            validRecords++;
          }
        }
        if (validRecords > 0) {
          expectedNextStationCD = totalCD / validRecords;
        }
      }
      
      // CRITICAL CHECK: Only try skip logic if halt distance > expected next station distance
      if (expectedNextStationCD === null || targetCD > expectedNextStationCD) {
        if (skipToSheetIndex !== -1) {
          Logger.log(`Halt distance (${targetCD}m) > expected next station distance (${expectedNextStationCD}m), checking skip to ${skipToScheduledStation} (sheet index ${skipToSheetIndex})`);

          if (currentSheetIndex !== -1) {
            for (let r = 0; r < filteredRecords.length; r++) {
              const record = filteredRecords[r];
              
              if (skipToSheetIndex < record.cumulativeDistances.length && 
                  currentSheetIndex < record.cumulativeDistances.length) {
                
                const expectedCD = record.cumulativeDistances[skipToSheetIndex];
                const expectedPrevCD = record.cumulativeDistances[currentSheetIndex];
                const expectedISD = expectedCD - expectedPrevCD;

                if (expectedCD > expectedPrevCD && expectedISD > 0) {
                  const cdDiff = Math.abs(targetCD - expectedCD);
                  // For skipped scheduled station, ISD won't match but cumulative should
                  
                  Logger.log(`  Filtered Record ${r}: Expected CD=${expectedCD}, ISD=${expectedISD}, CD diff=${cdDiff}`);

                  // Check if cumulative matches (indicating we skipped the previous scheduled station)
                  if (cdDiff <= MAX_CD_DIFF) {
                    matchedStations.push({
                      distance: targetCD,
                      station: skipToScheduledStation
                    });
                    currentScheduledHaltIndex = skipToScheduledIndex;
                    accumulatedISDSinceLastStation = 0; // Reset accumulated ISD
                    matched = true;
                    Logger.log(`  ✓ MATCHED with ${skipToScheduledStation} (skipped previous scheduled station)`);
                    break;
                  }
                }
              }
            }
          }
        }
      } else {
        Logger.log(`Halt distance (${targetCD}m) <= expected next station distance (${expectedNextStationCD}m), cannot be a later station`);
      }
    }

    // STEP 3: If still not matched, check if we should auto-advance to skip missed stations
    if (!matched) {
      // Check if halt distance is significantly beyond the expected next station
      // This prevents getting stuck trying to match the same missed station repeatedly
      
      let expectedNextStationCD = null;
      const nextScheduledStation = scheduledHalts[nextScheduledHaltIndex];
      const nextExpectedIndex = pastData.stationHeaders.indexOf(nextScheduledStation);
      const currentScheduledStation = scheduledHalts[currentScheduledHaltIndex];
      const currentSheetIndex = pastData.stationHeaders.indexOf(currentScheduledStation);
      
      if (nextExpectedIndex !== -1 && currentSheetIndex !== -1 && filteredRecords.length > 0) {
        // Use average of filtered records for expected distance
        let totalCD = 0;
        let validRecords = 0;
        for (const record of filteredRecords) {
          if (nextExpectedIndex < record.cumulativeDistances.length) {
            totalCD += record.cumulativeDistances[nextExpectedIndex];
            validRecords++;
          }
        }
        if (validRecords > 0) {
          expectedNextStationCD = totalCD / validRecords;
        }
      }
      
      // Auto-advance thresholds
      const CD_ADVANCE_THRESHOLD = 400; // 400m cumulative distance threshold
      const ISD_ADVANCE_THRESHOLD = 150; // 150m inter-station distance threshold
      
      // Check if we should auto-advance past the missed station
      if (expectedNextStationCD !== null && 
          targetCD > expectedNextStationCD + CD_ADVANCE_THRESHOLD) {
        
        Logger.log(`Halt distance (${targetCD}m) > expected ${nextScheduledStation} distance (${expectedNextStationCD}m) + ${CD_ADVANCE_THRESHOLD}m threshold. Auto-advancing past missed station.`);
        
        // Try to find the next appropriate scheduled station
        let advancedToStation = false;
        
        for (let advanceIndex = nextScheduledHaltIndex + 1; 
             advanceIndex < scheduledHalts.length; 
             advanceIndex++) {
          
          const advancedScheduledStation = scheduledHalts[advanceIndex];
          const advancedSheetIndex = pastData.stationHeaders.indexOf(advancedScheduledStation);
          
          if (advancedSheetIndex !== -1) {
            // Calculate expected cumulative distance for this advanced station
            let expectedAdvancedCD = null;
            let totalAdvancedCD = 0;
            let validAdvancedRecords = 0;
            
            for (const record of filteredRecords) {
              if (advancedSheetIndex < record.cumulativeDistances.length) {
                totalAdvancedCD += record.cumulativeDistances[advancedSheetIndex];
                validAdvancedRecords++;
              }
            }
            
            if (validAdvancedRecords > 0) {
              expectedAdvancedCD = totalAdvancedCD / validAdvancedRecords;
              
              // Check if this advanced station is a better match
              const advancedCDDiff = Math.abs(targetCD - expectedAdvancedCD);
              
              Logger.log(`  Checking advanced station ${advancedScheduledStation}: expected CD=${expectedAdvancedCD}m, diff=${advancedCDDiff}m`);
              
              if (advancedCDDiff <= CD_ADVANCE_THRESHOLD) {
                // Found a potential match, now check if ISD also makes sense
                const expectedAdvancedISD = expectedAdvancedCD - (currentSheetIndex !== -1 ? 
                  filteredRecords[0].cumulativeDistances[currentSheetIndex] : 0);
                const advancedISDDiff = Math.abs(targetISD - expectedAdvancedISD);
                
                Logger.log(`    Advanced ISD check: expected ISD=${expectedAdvancedISD}m, diff=${advancedISDDiff}m`);
                
                if (advancedISDDiff <= ISD_ADVANCE_THRESHOLD) {
                  // This is a good match
                  matchedStations.push({
                    distance: targetCD,
                    station: advancedScheduledStation
                  });
                  currentScheduledHaltIndex = advanceIndex;
                  accumulatedISDSinceLastStation = 0; // Reset accumulated ISD
                  matched = true;
                  advancedToStation = true;
                  Logger.log(`  ✓ AUTO-ADVANCED and MATCHED with ${advancedScheduledStation} (skipped intermediate stations)`);
                  break;
                } else if (advancedCDDiff <= CD_ADVANCE_THRESHOLD) {
                  // CD matches but ISD doesn't - still advance index but mark as Unknown
                  Logger.log(`  → AUTO-ADVANCING index to ${advancedScheduledStation} position but marking halt as Unknown (ISD mismatch)`);
                  currentScheduledHaltIndex = advanceIndex;
                  advancedToStation = true;
                  break;
                }
              }
            }
          }
        }
        
        if (!advancedToStation) {
          Logger.log(`  No suitable advanced station found within thresholds`);
        }
      }
      
      // If still not matched after auto-advance attempt, mark as Unknown
      if (!matched) {
        matchedStations.push({
          distance: targetCD,
          station: "Unknown"
        });
        Logger.log(`  ✗ UNKNOWN - halt between stations or before proper station sequence`);
        // Don't advance currentScheduledHaltIndex, but accumulate the ISD
        accumulatedISDSinceLastStation += currentHaltISD;
      }
    }
  }

  Logger.log("Final matched stations:", matchedStations);
  Logger.log(matchedStations);
  return matchedStations;
}





function matchHaltsWithStations300625() {
  const { cumulativeDistances, interStationDistances } = getInterStationDistancesFromCumulative();
  const pastData = getPastData();

  // If we have no data, return early
  if (!cumulativeDistances || cumulativeDistances.length === 0 || 
      !pastData || !pastData.stationHeaders || pastData.stationHeaders.length === 0) {
    Logger.log("No data available for matching");
    return [];
  }

  // Get scheduled halts for this train (works for both fast and slow trains)
  const trainData = getScheduledHalts();
  const scheduledHalts = trainData.halts ? trainData.halts.split(",").map(s => s.trim()) : pastData.stationHeaders;
  
  Logger.log("Train Type:", trainData.trainType);
  Logger.log(trainData.trainType);
  Logger.log("Scheduled halts for this train:", scheduledHalts);
  Logger.log( scheduledHalts);
  Logger.log(`"All stations in sheet:", ${pastData.stationHeaders}`);
  Logger.log( pastData.stationHeaders);



  const matchedStations = [];

  // First halt always matched to the first scheduled station
  matchedStations.push({ 
    distance: cumulativeDistances[0], 
    station: scheduledHalts[0]
  });

  // Track current position in scheduled halts sequence
  let currentScheduledHaltIndex = 0;
  let accumulatedISDSinceLastStation = 0; // Track accumulated ISD since last proper station match
  
  // Matching thresholds
  const MAX_CD_DIFF = 300;
  const MAX_ISD_DIFF = 100;

  for (let i = 1; i < cumulativeDistances.length; i++) {
    const targetCD = cumulativeDistances[i];
    const currentHaltISD = interStationDistances[i];
    
    // Calculate the ISD to use for matching
    const targetISD = accumulatedISDSinceLastStation + currentHaltISD;

    Logger.log(`\n--- Processing halt ${i}: CD=${targetCD}m, Current ISD=${currentHaltISD}m, Accumulated ISD for matching=${targetISD}m ---`);

    let matched = false;

    // STEP 1: Check the immediate next expected scheduled station
    const nextScheduledHaltIndex = currentScheduledHaltIndex + 1;
    
    if (nextScheduledHaltIndex < scheduledHalts.length) {
      const nextScheduledStation = scheduledHalts[nextScheduledHaltIndex];
      const nextExpectedIndex = pastData.stationHeaders.indexOf(nextScheduledStation);
      
      if (nextExpectedIndex !== -1) {
        Logger.log(`Checking next scheduled station: ${nextScheduledStation} (sheet index ${nextExpectedIndex})`);

        // Get current station's sheet index for ISD calculation
        const currentScheduledStation = scheduledHalts[currentScheduledHaltIndex];
        const currentSheetIndex = pastData.stationHeaders.indexOf(currentScheduledStation);

        if (currentSheetIndex !== -1) {
          // Check this station against all records
          for (let r = 0; r < pastData.records.length; r++) {
            const record = pastData.records[r];
            
            if (nextExpectedIndex < record.cumulativeDistances.length && 
                currentSheetIndex < record.cumulativeDistances.length) {
              
              const expectedCD = record.cumulativeDistances[nextExpectedIndex];
              const expectedPrevCD = record.cumulativeDistances[currentSheetIndex];
              const expectedISD = expectedCD - expectedPrevCD;

              if (expectedCD > expectedPrevCD && expectedISD > 0) {
                const cdDiff = Math.abs(targetCD - expectedCD);
                const isdDiff = Math.abs(targetISD - expectedISD);

                Logger.log(`  Record ${r}: Expected CD=${expectedCD}, ISD=${expectedISD}, Diffs: CD=${cdDiff}, ISD=${isdDiff}`);

                // MATCH FOUND with next expected scheduled station
                if (cdDiff <= MAX_CD_DIFF && isdDiff <= MAX_ISD_DIFF) {
                  matchedStations.push({
                    distance: targetCD,
                    station: nextScheduledStation
                  });
                  currentScheduledHaltIndex = nextScheduledHaltIndex;
                  accumulatedISDSinceLastStation = 0; // Reset accumulated ISD
                  matched = true;
                  Logger.log(`  ✓ MATCHED with ${nextScheduledStation}`);
                  break;
                }
              }
            }
          }
        }
      }
    }

    // STEP 2: If not matched with immediate next scheduled station, check if we should skip to the one after
    if (!matched && (nextScheduledHaltIndex + 1) < scheduledHalts.length) {
      const skipToScheduledIndex = nextScheduledHaltIndex + 1;
      const skipToScheduledStation = scheduledHalts[skipToScheduledIndex];
      const skipToSheetIndex = pastData.stationHeaders.indexOf(skipToScheduledStation);
      
      if (skipToSheetIndex !== -1) {
        Logger.log(`Checking if we skipped ${scheduledHalts[nextScheduledHaltIndex]}, trying ${skipToScheduledStation} (sheet index ${skipToSheetIndex})`);

        // Get current station's sheet index for ISD calculation
        const currentScheduledStation = scheduledHalts[currentScheduledHaltIndex];
        const currentSheetIndex = pastData.stationHeaders.indexOf(currentScheduledStation);

        if (currentSheetIndex !== -1) {
          for (let r = 0; r < pastData.records.length; r++) {
            const record = pastData.records[r];
            
            if (skipToSheetIndex < record.cumulativeDistances.length && 
                currentSheetIndex < record.cumulativeDistances.length) {
              
              const expectedCD = record.cumulativeDistances[skipToSheetIndex];
              const expectedPrevCD = record.cumulativeDistances[currentSheetIndex];
              const expectedISD = expectedCD - expectedPrevCD;

              if (expectedCD > expectedPrevCD && expectedISD > 0) {
                const cdDiff = Math.abs(targetCD - expectedCD);
                // For skipped scheduled station, ISD won't match but cumulative should
                
                Logger.log(`  Record ${r}: Expected CD=${expectedCD}, ISD=${expectedISD}, CD diff=${cdDiff}`);

                // Check if cumulative matches (indicating we skipped the previous scheduled station)
                if (cdDiff <= MAX_CD_DIFF) {
                  matchedStations.push({
                    distance: targetCD,
                    station: skipToScheduledStation
                  });
                  currentScheduledHaltIndex = skipToScheduledIndex;
                  accumulatedISDSinceLastStation = 0; // Reset accumulated ISD
                  matched = true;
                  Logger.log(`  ✓ MATCHED with ${skipToScheduledStation} (skipped previous scheduled station)`);
                  break;
                }
              }
            }
          }
        }
      }
    }

    // STEP 3: If still not matched, mark as Unknown
    if (!matched) {
      matchedStations.push({
        distance: targetCD,
        station: "Unknown"
      });
      Logger.log(`  ✗ UNKNOWN - halt between stations or before proper station sequence`);
      // Don't advance currentScheduledHaltIndex, but accumulate the ISD
      accumulatedISDSinceLastStation += currentHaltISD;
    }
  }

  Logger.log("Final matched stations:", matchedStations);
  Logger.log(matchedStations);
  return matchedStations;
}
//the running function fron starting. but a halt just before pf entry derails the patteren.
function matchHaltsWithStations() {
  const { cumulativeDistances } = getInterStationDistancesFromCumulative(); // Already has current halt distances
  const pastData = getPastData(); // Includes stationHeaders and records

  // If we have no data, return early
  if (!cumulativeDistances || cumulativeDistances.length === 0 || 
      !pastData || !pastData.stationHeaders || pastData.stationHeaders.length === 0) {
    Logger.log("No data available for matching");
    return [];
  }

  const matchedStations = [];

  // First halt always matched to the first station in our segment
  matchedStations.push({ 
    distance: cumulativeDistances[0], 
    station: pastData.stationHeaders[0] 
  });

  // Last known matched index and distance (to compute ISD even across Unknowns)
  let lastKnownMatchIndex = 0;
  let lastKnownMatchDistance = cumulativeDistances[0];

  // More flexible matching thresholds
  const MAX_CD_DIFF = 300;  // Maximum cumulative distance difference (meters)
  const MAX_ISD_DIFF = 100; // Maximum inter-station distance difference (meters)

  for (let i = 1; i < cumulativeDistances.length; i++) {
    const targetCD = cumulativeDistances[i];
    const targetISD = targetCD - lastKnownMatchDistance;

    let bestMatch = {
      station: "Unknown",
      score: Infinity,
      stationIndex: -1
    };

    // For debugging
    let matchAttempts = [];

    for (let r = 0; r < pastData.records.length; r++) {
      const record = pastData.records[r];

      for (let j = lastKnownMatchIndex + 1; j < record.cumulativeDistances.length && j < pastData.stationHeaders.length; j++) {
        const expectedCD = record.cumulativeDistances[j];
        const expectedPrevCD = record.cumulativeDistances[lastKnownMatchIndex];
        const expectedISD = expectedCD - expectedPrevCD;

        // Skip invalid entries
        if (expectedCD <= expectedPrevCD || expectedISD === 0) continue;

        const cdDiff = Math.abs(targetCD - expectedCD);
        const isdDiff = Math.abs(targetISD - expectedISD);
        
        // Weight ISD more heavily than CD for matching
        const score = cdDiff + (isdDiff * 2);

        matchAttempts.push({
          station: pastData.stationHeaders[j],
          cdDiff,
          isdDiff,
          score,
          recordIndex: r
        });

        if (score < bestMatch.score && cdDiff < MAX_CD_DIFF && isdDiff < MAX_ISD_DIFF) {
          bestMatch = {
            station: pastData.stationHeaders[j],
            score,
            stationIndex: j,
            recordIndex: r
          };
        }
      }
    }

    // For debugging only
    Logger.log(`For halt at ${targetCD}m, considered ${matchAttempts.length} matches`);
    if (matchAttempts.length > 0) {
      matchAttempts.sort((a, b) => a.score - b.score);
      Logger.log(`Top 3 candidates: ${JSON.stringify(matchAttempts.slice(0, 3))}`);
    }

    if (bestMatch.station !== "Unknown") {
      matchedStations.push({
        distance: targetCD,
        station: bestMatch.station
      });
      lastKnownMatchIndex = bestMatch.stationIndex;
      lastKnownMatchDistance = targetCD;
    } else {
      matchedStations.push({
        distance: targetCD,
        station: "Unknown"
      });
      // Do not update lastKnownMatchDistance or index
    }
  }

  Logger.log(matchedStations);
  return matchedStations;
}
function getInterStationDistancesFromCumulative() {
  const cumulativeDistances = getUniqueCumulativeDistancesForZeroSpeedAndDistance();

  if (!cumulativeDistances || cumulativeDistances.length === 0) {
    return {
      cumulativeDistances: [],
      interStationDistances: []
    };
  }

  const interStationDistances = [0.0];
  for (let i = 1; i < cumulativeDistances.length; i++) {
    const distance = cumulativeDistances[i] - cumulativeDistances[i - 1];
    interStationDistances.push(distance);
  }

  Logger.log({
    cumulativeDistances: cumulativeDistances,
    interStationDistances: interStationDistances
  });

  return {
    cumulativeDistances: cumulativeDistances,
    interStationDistances: interStationDistances
  };
}
function getPastData(){
  const tripstations = tripStationInfo();
  const fromStn = tripstations.fromStation;
  const toStn= tripstations.toStation;
  const sheetName = pastDataSheetSelector().sheetName;
  const pastData = parseSheetData(url, sheetName, fromStn, toStn)
 Logger.log(pastData)
  return pastData
}

function pastDataSheetSelector() {
  // Get the latest train data
  const trainData = getLatestTrainData();
  if (!trainData) {
    Logger.log("No train data available.");
    return null;
  }

  // Get the direction (UP/DN)
  const directionAndSection = getTrainDirectionAndSection(trainData.trainNo);
  if (!directionAndSection) {
    Logger.log("Could not determine direction and section for train " + trainData.trainNo);
    return null;
  }

  let direction = directionAndSection.startsWith("UP") ? "UP" : "DN";
  const fromStation = trainData.from;
  const toStation = trainData.to;

  let sheetName = directionAndSection; // Default

  const trainCode = trainCodeFinder(trainData.trainNo);
  const trainCodeStr = trainCode ? trainCode.toString() : "";

  // 987XX Trains
  if (trainCodeStr.startsWith("987")) {
    const lastDigit = parseInt(trainCodeStr.slice(-1));
    sheetName = (lastDigit % 2 === 0) ? "UPGMN" : "DNGMN";

  } else if (trainCodeStr.startsWith("989")) {
    const gmnStations = ["VDLR", "KCE", "MM", "BA", "KHR", "STC", "VLP", "ADH", "JOS", "RMAR", "GMN"];
    const isFromGMN = gmnStations.includes(fromStation);
    const isToGMN = gmnStations.includes(toStation);

    if (isFromGMN && isToGMN) {
      const lastDigit = parseInt(trainCodeStr.slice(-1));
      sheetName = (lastDigit % 2 === 0) ? "UPGMN" : "DNGMN";
    } else {
      direction = directionAndSection.startsWith("UP") ? "DN" : "UP";
      sheetName = direction + "HARBOUR";
    }

  } else {
    const isSE = stationsSEAndNE.se.includes(fromStation) && stationsSEAndNE.se.includes(toStation);
    const isNE = stationsSEAndNE.ne.includes(fromStation) && stationsSEAndNE.ne.includes(toStation);

    if (isSE) {
      sheetName = direction + "LOCALSSE";
    } else if (isNE) {
      sheetName = direction + "LOCALSNE";
    } else {
      if (!trainCode) {
        Logger.log("Train code not found. Defaulting to Slow Locals.");
        sheetName = direction + "SLOWLOCALS";
      } else {
        const slowTrainCodes = Object.values(trainCodes.mainLine.slowLocalsSE)
          .concat(Object.values(trainCodes.mainLine.slowLocalsNE))
          .concat(Object.values(trainCodes.mainLine.slowLocals)).flat();

        const fastTrainCodes = Object.values(trainCodes.mainLine.fastLocalsSE)
          .concat(Object.values(trainCodes.mainLine.fastLocalsNE))
          .concat(Object.values(trainCodes.mainLine.fastLocals)).flat();

        const harbourTrainCodes = trainCodes.harbourLine 
          ? Object.values(trainCodes.harbourLine).flatMap(subSection => Object.values(subSection).flat()) 
          : [];

        const isHarbour = harbourTrainCodes.some(pattern => trainCodeStr.startsWith(pattern.slice(0, 3)));
        const isSlow = slowTrainCodes.some(pattern => trainCodeStr.startsWith(pattern.slice(0, 3)));
        const isFast = fastTrainCodes.some(pattern => trainCodeStr.startsWith(pattern.slice(0, 3)));

        if (isHarbour) {
          sheetName = directionAndSection;
        } else if (isFast) {
          sheetName = direction + "FASTLOCALS";
        } else if (isSlow) {
          sheetName = direction + "SLOWLOCALS";
        } else {
          Logger.log("Train code does not match any category. Defaulting to Slow.");
          sheetName = direction + "SLOWLOCALS";
        }
      }
    }
  }

  const ss = SpreadsheetApp.openByUrl(url);

  // Get or create MAIN sheet
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log("Main sheet '" + sheetName + "' not found. Creating it.");
    sheet = ss.insertSheet(sheetName);
  }

  // Get or create OHE sheet
  const oheSheetName = sheetName + "_OHE";
  let oheSheet = ss.getSheetByName(oheSheetName);
  if (!oheSheet) {
    Logger.log("OHE sheet '" + oheSheetName + "' not found. Creating it.");
    oheSheet = ss.insertSheet(oheSheetName);
  }

  Logger.log("Main sheet selected: " + sheetName);
  Logger.log("OHE sheet selected: " + oheSheetName);

  return {
    trainData: trainData,
    sheetName: sheetName,
    sheet: sheet,
    oheSheetName: oheSheetName,
    oheSheet: oheSheet
  };
}

function parseSheetData(url, sheetName, fromStation, toStation) {
  const ss = SpreadsheetApp.openByUrl(url);
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();

  if (data.length < 2) return [];

  const headers = data[0].slice(1); // Station names from column B onward

  const fromIndex = headers.indexOf(fromStation);
  const toIndex = headers.indexOf(toStation);

  if (fromIndex === -1 || toIndex === -1) {
    Logger.log(`Stations not found: ${fromStation}, ${toStation}`);
    return [];
  }

  const start = Math.min(fromIndex, toIndex);
  const end = Math.max(fromIndex, toIndex);
  const stationHeaders = headers.slice(start, end + 1);

  const records = [];

  for (let i = 1; i < data.length; i++) {
    // Check if this row has valid data for our stations
    if (!isRowValid(data[i], start + 1, end + 1)) continue;
    
    const row = data[i].slice(start + 1, end + 2);
    const cumulativeDistances = [];
    const interStationDistances = [];
    
    // Important change: reset cumulative to zero at the starting station
    // This ensures all journeys start from 0 regardless of actual starting station
    let cumulative = 0;

    for (let j = 0; j < row.length; j++) {
      let distance = row[j] || 0;
      
      // Only for the very first station, force ISD to 0
      if (j === 0) distance = 0;
      
      cumulative += distance;
      interStationDistances.push(distance);
      cumulativeDistances.push(cumulative);
    }

    records.push({
      recordNumber: i,
      interStationDistances,
      cumulativeDistances
    });
  }

  return { stationHeaders, records };
}

function isRowValid(row, startIdx, endIdx) {
  // Check if there's at least one non-zero value in the range
  for (let i = startIdx; i <= endIdx; i++) {
    if (row[i] !== undefined && row[i] !== null && row[i] !== '') {
      return true;
    }
  }
  return false;
}

function removeDuplicateHalts(matchedHalts) {
  const filtered = [];

  for (let i = 0; i < matchedHalts.length; i++) {
    const current = matchedHalts[i];
    if (i === 0) {
      filtered.push(current);
      continue;
    }

    const prev = filtered[filtered.length - 1];
    if (current.station !== prev.station) {
      filtered.push(current);
    } else {
      const diff = Math.abs(current.distance - prev.distance);
      if (diff > 2) {
        filtered.push({ ...current, station: "Unknown" });
      }
    }
  }

  Logger.log("Filtered Halts:", filtered);
  return filtered;
}


function addActualISDToScheduledHalts(scheduled, nonScheduled) {
  const allHalts = [...scheduled, ...nonScheduled];
  
  // Sort all halts by their cumulative distance
  allHalts.sort((a, b) => a.distance - b.distance);

  // Build a map to quickly look up halt by station name
  const stationToHalt = new Map(allHalts.map(h => [h.station, h]));

  // Build result array
  const result = [];

  for (let i = 0; i < scheduled.length; i++) {
    const current = scheduled[i];
    const previous = scheduled[i - 1];

    if (!previous) {
      result.push({ ...current, actualISD: current.isd }); // First halt
      continue;
    }

    // Find all halts between previous and current
    const haltsBetween = allHalts.filter(h =>
      h.distance > previous.distance && h.distance <= current.distance
    );

    // Sum their ISDs
    const actualISD = haltsBetween.reduce((sum, h) => sum + (h.isd ?? 0), 0);

    result.push({ ...current, actualISD });
  }

  return result;
}

function getScheduledHalts() {
  const trainData = getLatestTrainData();
  if (trainData) {
    const { trainCode, from, to } = trainData;
    const sheetName = pastDataSheetSelector().sheetName;
    Logger.log(sheetName)

    // Pass pre-fetched data instead of calling again inside getTrainHalts
    const halts = getTrainHalts(trainCode, from, to, sheetName);
    trainData.halts = halts;
  }
  Logger.log(trainData)
  return trainData;
}

function getTrainHalts(trainCode, fromStation, toStation, sheetName) {
  const sheet = SpreadsheetApp.openByUrl(url).getSheetByName("Fast locals");
  if (!sheet) {
    Logger.log("Sheet 'Fast locals' not found.");
    return null;
  }

  // Check if both stations are in the same section (SE or NE)
  const isSE = stationsSEAndNE.se.includes(fromStation) && stationsSEAndNE.se.includes(toStation);
  const isNE = stationsSEAndNE.ne.includes(fromStation) && stationsSEAndNE.ne.includes(toStation);
  
  // If stations are in the same section (SE or NE), use all stations in that section
  if (isSE || isNE) {
    Logger.log("Both stations are in the " + (isSE ? "SE" : "NE") + " section. Using all stations in this section.");
    const stationData = parseSheetData(url, sheetName, fromStation, toStation);
    return stationData.stationHeaders.join(", ");
  }
  
  // If stations are not in the same section, use the train's defined halts
  const data = sheet.getDataRange().getValues();
  const searchTrainCode = String(trainCode).trim();
  
  for (let i = 1; i < data.length; i++) {
    const currentTrainCode = String(data[i][1]).trim();
    if (currentTrainCode === searchTrainCode) {
      return data[i][2]; // Return halts as defined for this train
    }
  }
  
  // Train not found, use all stations between fromStation and toStation
  Logger.log("Train code " + trainCode + " not found in 'Fast locals'. Using all stations.");
  const stationData = parseSheetData(url, sheetName, fromStation, toStation);
  return stationData.stationHeaders.join(", ");
}


function separateScheduledAndNonScheduledHalts(matchedHalts, scheduledHalts) {
  const scheduled = [];
  const nonScheduled = [];

  // Convert scheduled halts to a Set for O(1) lookup
  const scheduledSet = new Set(scheduledHalts);
Logger.log("GMN DEBUG")
  for (const halt of matchedHalts) {
    const { distance, station } = halt;

    if (scheduledSet.has(station)) {
      scheduled.push(halt);
    } else {
      nonScheduled.push(halt);
    }
  }

  Logger.log("Scheduled Halts:");
  Logger.log(scheduled);
  Logger.log("Non-Scheduled/Unknown Halts:");
  Logger.log(nonScheduled);

  return {
    scheduledHalts: scheduled,
    nonScheduledHalts: nonScheduled
  };
}

function getAdjustedISDForSkippedStations(scheduledWithActualISD, missedScheduled, pastData) {
  const adjustedISDMap = new Map(); // To store adjusted ISD for skipped scenarios

  // Ensure pastData has valid stationHeaders and records
  if (!pastData || !Array.isArray(pastData.stationHeaders) || pastData.stationHeaders.length === 0) {
    Logger.log("Error: Invalid or missing stationHeaders in pastData.");
    return adjustedISDMap;
  }

  if (!Array.isArray(pastData.records) || pastData.records.length === 0) {
    Logger.log("Error: No records found in pastData.");
    return adjustedISDMap;
  }

  // Use the first record's cumulativeDistances and interStationDistances
  const firstRecord = pastData.records[0];
  if (!firstRecord || !Array.isArray(firstRecord.cumulativeDistances) || !Array.isArray(firstRecord.interStationDistances)) {
    Logger.log("Error: Invalid or missing cumulativeDistances/interStationDistances in pastData records.");
    return adjustedISDMap;
  }

  const { cumulativeDistances, interStationDistances } = firstRecord;

  // Build a map of past data for quick lookup
  const pastDataMap = new Map();
  pastData.stationHeaders.forEach((station, index) => {
    pastDataMap.set(station, {
      cumulativeDistance: cumulativeDistances[index],
      interStationDistance: interStationDistances[index]
    });
  });

  // Iterate through scheduled halts to find skipped stations
  for (let i = 0; i < scheduledWithActualISD.length; i++) {
    const currentHalt = scheduledWithActualISD[i];
    const previousHalt = scheduledWithActualISD[i - 1];

    if (!previousHalt) continue; // Skip the first halt

    // Check if there are any missed stations between previousHalt and currentHalt
    const missedBetween = missedScheduled.filter(station =>
      pastDataMap.has(station) &&
      pastDataMap.get(station).cumulativeDistance > previousHalt.distance &&
      pastDataMap.get(station).cumulativeDistance < currentHalt.distance
    );

    if (missedBetween.length > 0) {
      // Calculate adjusted ISD from previousHalt to currentHalt (skipping missed stations)
      const previousPastData = pastDataMap.get(previousHalt.station);
      const currentPastData = pastDataMap.get(currentHalt.station);

      if (previousPastData && currentPastData) {
        const adjustedISD = currentPastData.cumulativeDistance - previousPastData.cumulativeDistance;
        adjustedISDMap.set(currentHalt.station, adjustedISD);
      }
    }
  }

  Logger.log("Adjusted ISD Map:");
  Logger.log(adjustedISDMap);

  return adjustedISDMap;
}

function createDynamicRoute(stationHaltDetails, pastStationData, tripDestinationStation) {

  
  if (!pastStationData || !pastStationData.stationIndex) {
    Logger.log("Missing stationIndex in pastStationData.");
    return [];
  }

  const stationIndex = pastStationData.stationIndex;
  const dynamicRouteISDs = [];
  let dynamicCumulative = 0;
  let actualCumulative = 0;
  let lastProcessedStationName = null;
  let penultimateStationDetail = null;

  // Debug log
  Logger.log(`Creating dynamic route with ${stationHaltDetails.length} halt details to ${tripDestinationStation}`);

  for (let i = 0; i < stationHaltDetails.length; i++) {
    const haltDetail = stationHaltDetails[i];
    const currentStationName = haltDetail.station;
    const currentISD = haltDetail.actualISD || haltDetail.isd; // Support both naming conventions

    if (currentStationName === "Station Not Found" || currentStationName === "Unknown"||currentStationName==="Extra Halt") continue;

    // Handle station repeats
    if (currentStationName === lastProcessedStationName) {
      if (currentStationName === tripDestinationStation && penultimateStationDetail) {
        dynamicRouteISDs.pop();
        dynamicCumulative -= penultimateStationDetail.dynamicInterStationDistance;
      } else {
        continue;
      }
    }

    // Update actual cumulative with current ISD
    actualCumulative += currentISD;

    // Debug log
    Logger.log(`Processing station ${currentStationName} with ISD ${currentISD}`);
    Logger.log(`Current actual cumulative: ${actualCumulative}, dynamic cumulative: ${dynamicCumulative}`);

    const pastStationRecords = stationIndex[currentStationName];
    let selectedDynamicISD = null;

    if (pastStationRecords && pastStationRecords.length > 0) {
      // Sort records by interStationDistance for easier processing
      pastStationRecords.sort((a, b) => a.interStationDistance - b.interStationDistance);
      
      // Find max value in past data
      const maxPastISD = pastStationRecords[pastStationRecords.length - 1].interStationDistance;
      Logger.log(`Past data max ISD: ${maxPastISD}`);
      
      // SIMPLE APPROACH:
      
      // Rule 1: If actual ISD is greater than max past ISD, use actual ISD
      if (currentISD > maxPastISD) {
        selectedDynamicISD = currentISD;
        Logger.log(`Actual ISD ${currentISD} exceeds max past ISD ${maxPastISD}, using actual ISD`);
      }
      // Rule 2: Look for values 3-5m higher than actual
      else {
        const preferredValues = pastStationRecords.filter(record => {
          const diff = record.interStationDistance - currentISD;
          return diff >= 3 && diff <= 5;
        });
        
        if (preferredValues.length > 0) {
          // Pick one in the middle of the range for stability
          const selectedIdx = Math.floor(preferredValues.length / 2);
          selectedDynamicISD = preferredValues[selectedIdx].interStationDistance;
          Logger.log(`Selected ISD ${selectedDynamicISD} (${selectedDynamicISD - currentISD}m higher than actual ${currentISD})`);
        }
        // Rule 3: If no 3-5m higher values, try exact match
        else if (pastStationRecords.some(r => Math.abs(r.interStationDistance - currentISD) <= 1)) {
          const exactMatch = pastStationRecords.find(r => Math.abs(r.interStationDistance - currentISD) <= 1);
          selectedDynamicISD = exactMatch.interStationDistance;
          Logger.log(`Using exact match ISD ${selectedDynamicISD}`);
        }
        // Rule 4: Otherwise use closest higher value from past data
        else {
          const higherValues = pastStationRecords.filter(r => r.interStationDistance > currentISD);
          if (higherValues.length > 0) {
            selectedDynamicISD = higherValues[0].interStationDistance;
            Logger.log(`Using closest higher ISD ${selectedDynamicISD} from past data`);
          } else {
            // Fallback to actual if no higher values available
            selectedDynamicISD = currentISD;
            Logger.log(`No higher values in past data, using actual ISD ${currentISD}`);
          }
        }
      }
      
      // CUMULATIVE CHECK: Ensure we maintain proper distance buffer
      
      // Calculate what the dynamic cumulative will be after adding this ISD
      const resultingDynamicCumulative = dynamicCumulative + selectedDynamicISD;
      const cumulativeDiff = resultingDynamicCumulative - actualCumulative;
      
      Logger.log(`Resulting cumulative diff: ${cumulativeDiff}m (dynamic ${resultingDynamicCumulative} - actual ${actualCumulative})`);
      
      // Adjust if needed to maintain 2-8m buffer
      if (cumulativeDiff < 2) {
        const adjustment = Math.ceil(2 - cumulativeDiff);
        const oldISD = selectedDynamicISD;
        selectedDynamicISD += adjustment;
        Logger.log(`Adjusted ISD from ${oldISD} to ${selectedDynamicISD} to maintain min +2m buffer`);
      } else if (cumulativeDiff > 8) {
        // Only adjust down if we're already using more than actual ISD
        if (selectedDynamicISD > currentISD) {
          const maxAdjustment = selectedDynamicISD - currentISD; // Never go below actual
          const neededAdjustment = Math.ceil(cumulativeDiff - 8);
          const adjustment = Math.min(maxAdjustment, neededAdjustment);
          
          const oldISD = selectedDynamicISD;
          selectedDynamicISD -= adjustment;
          Logger.log(`Adjusted ISD from ${oldISD} to ${selectedDynamicISD} to maintain max +8m buffer`);
        } else {
          Logger.log(`Cumulative diff exceeds +8m but already using actual ISD, cannot adjust down`);
        }
      }
    } else {
      // No past records, use actual ISD
      selectedDynamicISD = currentISD;
      Logger.log(`No past records for ${currentStationName}, using actual ISD ${currentISD}`);
      
      // Check if we need to adjust to maintain buffer
      const resultingDiff = (dynamicCumulative + currentISD) - actualCumulative;
      
      if (resultingDiff < 2) {
        const adjustment = Math.ceil(2 - resultingDiff);
        selectedDynamicISD += adjustment;
        Logger.log(`Adjusted ISD to ${selectedDynamicISD} to maintain min +2m buffer`);
      }
    }

    // Ensure we have a value and it's a clean integer
    if (selectedDynamicISD !== null) {
      selectedDynamicISD = Math.round(selectedDynamicISD);
      
      const dynamicStationDetail = {
        stationName: currentStationName,
        dynamicInterStationDistance: selectedDynamicISD,
        dynamicCumulativeDistance: dynamicCumulative + selectedDynamicISD,
        actualISD: currentISD,
        diff: selectedDynamicISD - currentISD
      };

      penultimateStationDetail = { ...dynamicStationDetail };
      dynamicRouteISDs.push(selectedDynamicISD);
      dynamicCumulative += selectedDynamicISD;
      
      // Final log showing the cumulative difference
      Logger.log(`Final selected ISD ${selectedDynamicISD}, resulting in cumulative ${dynamicCumulative} vs actual ${actualCumulative}`);
      Logger.log(`Difference: +${dynamicCumulative - actualCumulative}m`);
    }

    lastProcessedStationName = currentStationName;
  }

  // Log the final ISDs and cumulative difference
  Logger.log(`createDynamicRoute: Final ISDs: ${dynamicRouteISDs.join(', ')}`);
  Logger.log(`Total dynamic distance: ${dynamicCumulative}m vs actual: ${actualCumulative}m`);
  Logger.log(`Overall difference: +${dynamicCumulative - actualCumulative}m`);
  
  return dynamicRouteISDs;
}


function transformArrayForRoutes() {
  const tripRouteSetterOutput = tripRouteSetter()
  const joinSectionAndDistanceOutput = joinSectionAndDistance()

  const currentRouteList = processTripRoute(tripRouteSetterOutput, joinSectionAndDistanceOutput, stations)
  Logger.log("my Current route list")
  Logger.log(currentRouteList)
  currentRouteList[0][1] = 0;
  Logger.log(currentRouteList)
  const finalCurrentRouteList = calculateCumulativeSum(currentRouteList)

  Logger.log(finalCurrentRouteList)
  const spreadsheet = SpreadsheetApp.openByUrl(url);
  const sectionsSheet = spreadsheet.getSheetByName('SignalAndSpeed');
  sectionsSheet.getRange(2, 1, sectionsSheet.getLastRow(), 3).clearContent()
 sectionsSheet.getRange(2, 1, finalCurrentRouteList.length, finalCurrentRouteList[0].length).setValues(finalCurrentRouteList)
}

function processTripRoute(tripRouteSetterOutput, joinSectionAndDistanceOutput, stations) {
  // Create a Set of station names for quick lookup
  const stationNames = new Set(stations.map(station => station[1]));

  // Log original data for debugging
  Logger.log("Input data to processTripRoute:");
  Logger.log(tripRouteSetterOutput);
  Logger.log("Dynamic ISDs:");
  Logger.log(joinSectionAndDistanceOutput);

  // Skip the first array and iterate from the second element onwards
  for (let i = 1; i < tripRouteSetterOutput.length; i++) {
    const currentArray = tripRouteSetterOutput[i];
    const stationName = currentArray[2];

    // Only process actual stations (skip "Entry" markers)
    if (stationNames.has(stationName) && !stationName.includes("Entry")) {
      const distanceCurrent = currentArray[1]; // Station's distance in km
      const previousArray = tripRouteSetterOutput[i - 1]; // Previous row
      const key = previousArray[0]; // Section name (e.g., "KYN-DI")
      
      // Get dynamic ISD for this section
      const sectionDistance = joinSectionAndDistanceOutput[key]; // This is in meters

      // If we have an ISD for this section, use it
      if (sectionDistance !== undefined) {
        // Convert ISD from meters to kilometers
        const sectionDistanceKm = sectionDistance / 1000;
        
        // Calculate adjusted distance for the previous row
        // Previous row = section ISD minus current station's distance
        const adjustedDistance = Math.max(0, sectionDistanceKm - distanceCurrent);
        
        // Update the previous row's distance
        previousArray[1] = adjustedDistance;
        
        Logger.log(`For ${stationName}: Updated ${key} to ${adjustedDistance}km (${sectionDistanceKm} - ${distanceCurrent})`);
      }
    }
  }

  Logger.log("Process triproute output is:");
  Logger.log(tripRouteSetterOutput);
  return tripRouteSetterOutput;
}

function joinSectionAndDistance() {
  const dynamicRouteISDs = mainFunctionToGetDynamicRoute(); // Array of ISDs from dynamic route
  const stationPairs = clubStationsForTrip(); // Array of station pairs like [KYN-DI, DI-DW, ...]
  const scheduledHalts = processHalts().scheduled; // Array of scheduled halts with station, actualISD, etc.

  // Create a map to quickly look up scheduled halts by station name
  const scheduledHaltMap = new Map();
  scheduledHalts.forEach((halt, index) => {
    // Store the halt data along with its index in the dynamicRouteISDs array
    scheduledHaltMap.set(halt.station, {
      halt: halt,
      dynamicISDIndex: index - 1 // Subtract 1 because first station has no ISD (it's 0)
    });
  });

  Logger.log("Scheduled halt map created with stations: " + 
             Array.from(scheduledHaltMap.keys()).join(", "));

  const result = {};

  stationPairs.forEach(pair => {
    const [start, end] = pair.split("-");
    
    // Check if the end station of this pair is a scheduled halt
    if (scheduledHaltMap.has(end)) {
      const haltInfo = scheduledHaltMap.get(end);
      
      // If this station has a corresponding ISD in the dynamicRouteISDs array
      if (haltInfo.dynamicISDIndex >= 0 && 
          haltInfo.dynamicISDIndex < dynamicRouteISDs.length) {
        // Assign the corresponding dynamic ISD
        result[pair] = dynamicRouteISDs[haltInfo.dynamicISDIndex];
        Logger.log(`Assigned dynamic ISD ${dynamicRouteISDs[haltInfo.dynamicISDIndex]} to pair ${pair}`);
      } else {
        // If no matching index, fallback to the actualISD from the halt data
        result[pair] = haltInfo.halt.actualISD || 0;
        Logger.log(`No matching dynamic ISD index for ${pair}, using actualISD: ${haltInfo.halt.actualISD || 0}`);
      }
    } else {
      // No scheduled halt for this station pair's end station
      result[pair] = 0;
      Logger.log(`No scheduled halt found for ${end} in pair ${pair}, assigning 0`);
    }
  });

  Logger.log("Final result with dynamic ISDs mapped to station pairs:");
  Logger.log(result);
  
  return result;
}

function tripRouteSetter() {
  const trainType = getTrainTypeForTheTrip();
  const combinedData = joinSectionAndDistance(); // Unified function for both Fast and Slow trains

  // Filter sections data based on train type
  const filteredSectionsData = filterSectionsData(combinedData, trainType);

  Logger.log(filteredSectionsData);
  return filteredSectionsData;
}

function filterSectionsData(combinedData, trainType) {
  // Select the appropriate embedded data based on train type
  const sectionsData = trainType === 'fast' ? fastStationISD.slice(1) : hbAndlocalLineISD.slice(1);
  Logger.log("my sections data is")
Logger.log(sectionsData)
  // Get the trip sections from combinedData (e.g., ["CSMT-MSD", ..., "KOPR-DI"])
  const tripSections = Object.keys(combinedData);
Logger.log("trip section data is")
Logger.log(tripSections)
  // Filter rows where the section is in combinedData
  let filteredData = sectionsData.filter(row => tripSections.includes(row[0]));
Logger.log(filteredData)
  // Get the trip endpoints
  const { toStation } = tripStationInfo();

  // Find all unique sections in order
  const allSections = [];
  sectionsData.forEach(row => {
    if (!allSections.includes(row[0])) allSections.push(row[0]);
  });

  // Find the last section in the trip and determine the next section
  const lastTripSection = tripSections[tripSections.length - 1]; // e.g., "KOPR-DI"
  const lastIndex = allSections.indexOf(lastTripSection);

  // If there’s a next section, include the toStation’s row from it
  if (lastIndex < allSections.length - 1) {
    const nextSection = allSections[lastIndex + 1]; // e.g., "DI-THK"
    const toStationRow = sectionsData.find(row => row[0] === nextSection && row[2] === toStation);
    if (toStationRow) {
      filteredData.push(toStationRow); // Add the row like ["DI-THK", 0.276, "DI"]
    }
  }

  return filteredData;
}

function calculateCumulativeSum(array) {
  let cumulativeSum = 0;
  return array.map(item => {
    cumulativeSum += item[1];
    return [item[0], cumulativeSum, item[2]];
  });
}


function getCleanRouteData() {
  // Get the processed data from the original getRouteData function
  const { tripRouteData, joinSectionOutput, scheduledHalts } = getRouteData();
  
  Logger.log("Original trip route data:");
  Logger.log(tripRouteData);
  
  // Filter the data to remove zero-distance entries except the first one
  const cleanedData = [];
  let firstZeroDistanceKept = false;
  
  for (let i = 0; i < tripRouteData.length; i++) {
    const row = tripRouteData[i];
    const [section, distance, stationName] = row;
    
    // Check if this row has zero distance
    if (distance === 0 || distance === 0.0) {
      // Keep the first zero-distance entry (starting station)
      if (!firstZeroDistanceKept) {
        cleanedData.push(row);
        firstZeroDistanceKept = true;
        Logger.log(`Keeping first zero-distance entry: ${section}, ${distance}, ${stationName}`);
      } else {
        // Skip subsequent zero-distance entries
        Logger.log(`Removing zero-distance entry: ${section}, ${distance}, ${stationName}`);
      }
    } else {
      // Keep all non-zero distance entries
      cleanedData.push(row);
    }
  }
  
  Logger.log("Cleaned trip route data (removed zero distances except first):");
  Logger.log(cleanedData);
  
  // Write the cleaned data to the spreadsheet
  const spreadsheet = SpreadsheetApp.openByUrl(url);
  const sectionsSheet = spreadsheet.getSheetByName('SignalAndSpeed');
  
  // Clear existing data
  sectionsSheet.getRange(2, 1, sectionsSheet.getLastRow(), 3).clearContent();
  
  // Write the new cleaned data
  if (cleanedData.length > 0) {
    sectionsSheet.getRange(2, 1, cleanedData.length, cleanedData[0].length).setValues(cleanedData);
  }
  
  Logger.log("Cleaned data has been written to the SignalAndSpeed sheet.");
  
  return {
    tripRouteData: cleanedData,
    joinSectionOutput: joinSectionOutput,
    scheduledHalts: scheduledHalts
  };
}













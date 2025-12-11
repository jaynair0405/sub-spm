
function previousStationAndDistanceWithSpeed() {
  // First get the previous stations and distances
  var previousStations = previousDistanceAndStation();
  
  // Get the SPM Data sheet
  var spmSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  var spmData = spmSheet.getRange("A2:G" + spmSheet.getLastRow()).getValues();
  
  // Create a map of stations to their speeds
  var stationSpeedMap = {};
  spmData.forEach(row => {
    if (row[6] && row[2]) { // Assuming station name is in column G and speed in column C
      stationSpeedMap[row[6]] = parseFloat(row[2]);
    }
  });
  
  // Combine the data - only include halt stations
  var result = previousStations
    .filter(station => station.isHalt)
    .map(station => {
      return {
        station: station.station,
        distance: station.distance,
        speed: stationSpeedMap[station.station] || 0 // Default to 0 if speed not found
      };
    });
  Logger.log(result)
  return result;
}

function deleteChartInSpreadsheetSPMData() {
  var ss = SpreadsheetApp.openByUrl(url);
  var reportsSheet = ss.getSheetByName("SPM Data");

  // Clear existing charts
  var charts = reportsSheet.getCharts();
  charts.forEach(chart => reportsSheet.removeChart(chart));

}


function insertImageToSheet(dataURL) {
  console.log("DataURL received, length: " + dataURL.length);
  var ss = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=0#gid=0");
  var reportsSheet = ss.getSheetByName("Reports");
  var base64Data = dataURL.replace(/^data:image\/png;base64,/, "");
  console.log("Base64 data length after stripping prefix: " + base64Data.length);
  
  try {
    var blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      'image/png',
      'railway-diagram.png'
    );
    console.log("Blob created successfully");
    
    // Insert the image and capture the result
    var result = reportsSheet.insertImage(blob, 2, 53);
    console.log("Image inserted, result: " + result);
  } catch (e) {
    console.error("Error in insertImageToSheet: " + e.toString());
  }
}



function enhanceNonScheduledHaltsWithLocation(nonScheduledHalts, scheduledHalts) {
  return nonScheduledHalts.map(halt => ({
    ...halt,
    station: "Unknown", // Keep original station field
    location: findLocationBetweenStations(halt.distance, scheduledHalts) // Add new location field
  }));
}


function findLocationBetweenStations(unknownDistance, scheduledHalts) {
  // Sort scheduled halts by distance to ensure proper order
  const sortedScheduledHalts = [...scheduledHalts].sort((a, b) => a.distance - b.distance);
  
  // Find the two stations that the unknown distance falls between
  for (let i = 0; i < sortedScheduledHalts.length - 1; i++) {
    const currentStation = sortedScheduledHalts[i];
    const nextStation = sortedScheduledHalts[i + 1];
    
    if (unknownDistance >= currentStation.distance && unknownDistance <= nextStation.distance) {
      return `Between "${currentStation.station}" And "${nextStation.station}"`;
    }
  }
  
  // Handle edge cases
  if (unknownDistance < sortedScheduledHalts[0].distance) {
    return `Before "${sortedScheduledHalts[0].station}"`;
  } else if (unknownDistance > sortedScheduledHalts[sortedScheduledHalts.length - 1].distance) {
    return `After "${sortedScheduledHalts[sortedScheduledHalts.length - 1].station}"`;
  }
  
  return "Unknown Location";
}

function analyzeNonScheduledBrakingPatternWithLocation(nonScheduledHalts) {
  const spmDataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  const spmData = spmDataSheet.getRange("A2:F" + spmDataSheet.getLastRow()).getValues();
  
  // Filter out halts that are within 50 meters of each other, keeping the lower distance one
  const filteredNonScheduledHalts = filterCloseHalts(nonScheduledHalts, 50);
  
  const brakingPatterns = [];
  // Checkpoints for non-scheduled halts
  const checkPoints = [400, 350, 300, 250, 200, 150, 100, 50, 25, 20, 10, 5];
  
  for (const halt of filteredNonScheduledHalts) {
    // Find the corresponding SPM data entry for this halt
    const haltSpmIndex = findHaltInSpmData(spmData, halt.distance);
    
    if (haltSpmIndex !== -1) {
      const haltInfo = {
        distance: halt.distance,
        station: halt.station || "Unknown",
        location: halt.location || "Unknown Location", // Use location field
        timestamp: spmData[haltSpmIndex][0] + " " + spmData[haltSpmIndex][1]
      };
      
      const pattern = createNonScheduledBrakingPatternWithLocation(haltInfo, spmData, haltSpmIndex, checkPoints);
      brakingPatterns.push(pattern);
    }
  }
  
  Logger.log("Non-Scheduled Braking patterns with location found:");
  Logger.log(brakingPatterns);
  return brakingPatterns;
}

function filterCloseHalts(halts, toleranceMeters) {
  // Sort halts by distance
  const sortedHalts = [...halts].sort((a, b) => a.distance - b.distance);
  const filteredHalts = [];
  
  for (let i = 0; i < sortedHalts.length; i++) {
    const currentHalt = sortedHalts[i];
    let shouldInclude = true;
    
    // Check if this halt is within tolerance of any already included halt
    for (const includedHalt of filteredHalts) {
      if (Math.abs(currentHalt.distance - includedHalt.distance) <= toleranceMeters) {
        // If within tolerance, keep the one with lower distance
        if (currentHalt.distance >= includedHalt.distance) {
          shouldInclude = false;
          break;
        } else {
          // Remove the higher distance halt and include current one
          const indexToRemove = filteredHalts.findIndex(h => h.distance === includedHalt.distance);
          filteredHalts.splice(indexToRemove, 1);
          break;
        }
      }
    }
    
    if (shouldInclude) {
      filteredHalts.push(currentHalt);
    }
  }
  
  return filteredHalts;
}

function findHaltInSpmData(spmData, targetDistance) {
  // Find SPM data entry where speed = 0 and distance is closest to target
  let bestMatch = -1;
  let minDistanceDiff = Infinity;
  
  for (let i = 0; i < spmData.length; i++) {
    if (spmData[i][2] == 0 && spmData[i][3] == 0) { // Speed and acceleration are 0
      const distanceDiff = Math.abs(spmData[i][4] - targetDistance);
      if (distanceDiff < minDistanceDiff && distanceDiff <= 100) { // Within 100m tolerance
        minDistanceDiff = distanceDiff;
        bestMatch = i;
      }
    }
  }
  
  return bestMatch;
}

function createNonScheduledBrakingPatternWithLocation(haltInfo, spmData, haltIndex, checkPoints) {
  const pattern = {
    station: haltInfo.station,
    location: haltInfo.location, // Add location field
    haltDistance: haltInfo.distance,
    timestamp: haltInfo.timestamp,
    type: "Non-Scheduled"
  };
  
  // Get speeds at check points
  checkPoints.forEach(distance => {
    const result = findSpeedAtClosestDistance(spmData, haltIndex, distance);
    if (result) {
      pattern[`speed${distance}m`] = result.speed;
      pattern[`actual${distance}m`] = result.actualDistance.toFixed(1);
      pattern[`time${distance}m`] = result.timestamp;
    } else {
      pattern[`speed${distance}m`] = null;
      pattern[`actual${distance}m`] = null;
      pattern[`time${distance}m`] = null;
    }
  });
  
  // Add halt point (0 speed)
  pattern[`speed0m`] = 0;
  pattern[`actual0m`] = "0.0";
  pattern[`time0m`] = haltInfo.timestamp;
  
  Logger.log(pattern);
  return pattern;
}

function createNonScheduledBrakingReportWithLocation(nonScheduledHalts) {
  var ss = SpreadsheetApp.openByUrl(url);
  var destSheet = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=0#gid=0");
  //var reportSheet = ss.getSheetByName("Sheet10");
  var destReportSheet = destSheet.getSheetByName("Reports");
  
  // Get braking patterns for non-scheduled halts
  var brakingData = analyzeNonScheduledBrakingPatternWithLocation(nonScheduledHalts);
  
  // Headers for non-scheduled halts with all checkpoints - using "Location" instead of "Station"
  const headers = ["Location", "400m", "350m", "300m", "250m", "200m", "150m", "100m", "50m", "25m", "20m", "10m", "5m", "Halt"];
  const STATIONS_PER_SECTION = 5;
  
  // Format data into sections with headers
  let formattedData = [];
  
  // Add a section header to distinguish non-scheduled data
  formattedData.push(["NON-SCHEDULED HALTS", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
  formattedData.push(Array(14).fill("")); // Blank row
  
  for (let i = 0; i < brakingData.length; i += STATIONS_PER_SECTION) {
    // Add headers for each section
    formattedData.push(headers);
    
    // Add station data for this section - use location instead of station
    const sectionData = brakingData.slice(i, i + STATIONS_PER_SECTION).map(pattern => [
      pattern.location, // Use location field instead of station
      pattern.speed400m || "",
      pattern.speed350m || "",
      pattern.speed300m || "",
      pattern.speed250m || "",
      pattern.speed200m || "",
      pattern.speed150m || "",
      pattern.speed100m || "",
      pattern.speed50m || "",
      pattern.speed25m || "",
      pattern.speed20m || "",
      pattern.speed10m || "",
      pattern.speed5m || "",
      0  // Halt speed is always 0
    ]);
    formattedData = formattedData.concat(sectionData);
    
    // Add a blank row between sections
    formattedData.push(Array(14).fill(""));
  }
  
  // Write data to sheet
  if (formattedData.length > 0) {
    const startingRow = 13 + getExistingDataRows();
    destReportSheet.getRange(startingRow, 2, formattedData.length, 14).setValues(formattedData);
  }
  Logger.log("formattedData")
  Logger.log(formattedData)
  return formattedData;
}

function getExistingDataRows() {
  // Helper function to determine how many rows are already used
  // need to implement this based on the existing data structure
  // For now, returning a placeholder value
  return 250; // Adjust this based on the actual data
}

// Modified processHalts function to include non-scheduled braking analysis
function processHaltsWithLocation() {
  try {
    const matchedHalts = matchHaltsWithStations();
    const filteredHalts = removeDuplicateHalts(matchedHalts);

    const trainData = getScheduledHalts();
    const scheduledHalts = trainData.halts.split(",").map(s => s.trim());

    const {
      scheduledHalts: scheduled,
      nonScheduledHalts: nonScheduled
    } = separateScheduledAndNonScheduledHalts(filteredHalts, scheduledHalts);

    const { cumulativeDistances, interStationDistances } = getInterStationDistancesFromCumulative();
    const distanceToISD = new Map();
    cumulativeDistances.forEach((cd, i) => distanceToISD.set(cd, interStationDistances[i]));

    const attachISD = (halts) => halts.map(h => ({
      ...h,
      isd: distanceToISD.get(h.distance) ?? 0
    }));

    const scheduledWithISD = attachISD(scheduled);
    let nonScheduledWithISD = attachISD(nonScheduled);

    // Add Actual ISD now
    const scheduledWithActualISD = addActualISDToScheduledHalts(scheduledWithISD, nonScheduledWithISD);

    // Separate non-scheduled halts within 100m of scheduled halts
    const nearScheduledHalts = [];
    const trueNonScheduledHalts = [];

    nonScheduledWithISD.forEach(nonScheduledHalt => {
      const isNearScheduled = scheduledWithActualISD.some(scheduledHalt => 
        Math.abs(nonScheduledHalt.distance - scheduledHalt.distance) <= 100
      );

      if (isNearScheduled) {
        nearScheduledHalts.push(nonScheduledHalt);
      } else {
        trueNonScheduledHalts.push(nonScheduledHalt);
      }
    });

    // Enhance non-scheduled halts with location information
    const trueNonScheduledHaltsWithLocation = enhanceNonScheduledHaltsWithLocation(
      trueNonScheduledHalts, 
      scheduledWithActualISD
    );
    
    const nearScheduledHaltsWithLocation = enhanceNonScheduledHaltsWithLocation(
      nearScheduledHalts, 
      scheduledWithActualISD
    );

    // Find missed scheduled halts
    const missedScheduled = scheduledHalts.filter(station =>
      !scheduledWithActualISD.some(halt => halt.station === station)
    );

    // Get adjusted ISD for skipped stations
    const pastData = getPastData();
    const adjustedISDMap = getAdjustedISDForSkippedStations(scheduledWithActualISD, missedScheduled, pastData);

    Logger.log("Scheduled Halts:");
    Logger.log(scheduledWithActualISD);
    Logger.log("Non-Scheduled Halts Near Scheduled (within 100m):");
    Logger.log(nearScheduledHaltsWithLocation);
    Logger.log("Non-Scheduled/Unknown Halts with Location:");
    Logger.log(trueNonScheduledHaltsWithLocation);
    Logger.log("Missed Scheduled Halts:");
    Logger.log(missedScheduled);

    // Log the adjusted ISD Map in a readable format
    Logger.log("Adjusted ISD Map:");
    Logger.log(Object.fromEntries(adjustedISDMap));

    return {
      scheduled: scheduledWithActualISD,
      nearScheduled: nearScheduledHaltsWithLocation.length > 0 ? nearScheduledHaltsWithLocation : null,
      nonScheduled: trueNonScheduledHaltsWithLocation,
      missedScheduled: missedScheduled.length > 0 ? missedScheduled : null,
      adjustedISDMap: adjustedISDMap.size > 0 ? Object.fromEntries(adjustedISDMap) : null
    };
  } catch (error) {
    Logger.log(`Error in processHaltsWithLocation: ${error.message}`);
    return null;
  }
}

function processHaltsWithBraking() {
  const ss = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=0#gid=0");
  const sheet = ss.getSheetByName("Reports");
  sheet.getRange("A265:O"+sheet.getLastRow()).clearContent()
  const haltData = processHaltsWithLocation(); // Use the location-enhanced function
  
  if (haltData && haltData.nonScheduled && haltData.nonScheduled.length > 0) {
    Logger.log("Creating braking report for non-scheduled halts...");
    
    // Create braking report for non-scheduled halts with location
    const nonScheduledBrakingReport = createNonScheduledBrakingReportWithLocation(haltData.nonScheduled);
    
    Logger.log("Non-scheduled braking report created successfully");
    Logger.log("Report data:");
    Logger.log(nonScheduledBrakingReport);
    
    return {
      ...haltData,
      nonScheduledBrakingReport: nonScheduledBrakingReport
    };
  } else {
    Logger.log("No non-scheduled halts found or haltData is null");
  }
  
  return haltData;
}


function createBrakingLineChartsForNonScheduledHalts() {
  const ss = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=0#gid=0");
  const sheet = ss.getSheetByName("Reports");
  
  const dataRange = sheet.getRange("B265:O" + sheet.getLastRow());
  const rawData = dataRange.getValues();

  // var charts = sheet.getCharts();

  

  // for (var i = 0; i < charts.length; i++) {

  //   sheet.removeChart(charts[i]);

  // }
  
  // Colors for stations
  const colors = ['#4285f4', '#ea4335', '#fbbc05', '#34a853'];
  
  let chartIndex = 0;
  let startRow = 265;
  
  while (startRow < sheet.getLastRow()) {
    // Identify the start of the data section
    while (startRow < sheet.getLastRow() && rawData[startRow - 265][0] === "") {
      startRow++;
    }
    
    // Find the end of the current data section
    let endRow = startRow + 1;
    while (endRow < sheet.getLastRow() && rawData[endRow - 265][0] !== "") {
      endRow++;
    }
    
    // Ensure we have valid data
    if (startRow >= sheet.getLastRow()) {
      break;
    }
    
    // Define the range for this chart section (including headers)
    const chartRange = sheet.getRange(startRow, 2, endRow - startRow + 1, 14); // Including column C (Station)
    Logger.log(endRow - startRow + 1)
    // Create the chart
    const chart = sheet.newChart()
      .asLineChart()
      .addRange(chartRange)
      .setPosition(270 + (chartIndex * 15), 2, 0, 0)
      .setOption('title', `Speed vs Distance`) //(Stations ${startRow - 235} to ${endRow - 196})`)
      .setOption('width', 700)
      .setOption('height', 300)
      .setOption('curveType', 'function')
      .setTransposeRowsAndColumns(true) // Switch rows/columns
      .setOption('useFirstColumnAsHeaders', true) // Use column C as headers
      .setOption('legend', { position: 'right' }) // Legend visible on all charts
      .setOption('hAxis', {
        title: 'Distance',
        titleTextStyle: { bold: true },
        ticks: ['300m', '130m', '100m', '75m', '50m', '25m', '20m', '15m', '10m', '5m', 'Halt']
      })
      .setOption('vAxis', {
        title: 'Speed',
        titleTextStyle: { bold: true },
        viewWindow: {
          min: 0,
          max: 100
        }
      })
      .setOption('lineWidth', 2)
      .setOption('pointSize', 5)
       .setNumHeaders(1);
    // Insert the chart
    sheet.insertChart(chart.build());
    
    // Move to the next section
    startRow = endRow + 1;
    chartIndex++;
  }
}


function getInterSignalDataForTrip() {
  // Get the sections and train type
  const sections = clubStationsForTrip();
  const trainType = getTrainTypeForTheTrip();

  // Determine the appropriate inter-signal data based on train type
  const interSignalData = trainType === "fast" ? interSignalDataFastSection : interSignalDistance;

  // Filter the data to include only rows where the section matches
  const filteredData = interSignalData.filter(row => sections.includes(row[0]));

  // Initialize variables for cumulative distance calculation
  let cumulativeDistance = 0; // Tracks the running total distance

  // Array to store the modified data with cumulative distances
  const cumulativeData = [];

  // Iterate through the filtered data
  for (const row of filteredData) {
    const [section, signal, distance] = row;

    // For the first signal, set cumulative distance to 0
    if (cumulativeData.length === 0) {
      cumulativeDistance = 0;
    } else {
      // Otherwise, add the distance to the running total
      cumulativeDistance += distance;
    }

    // Add the cumulative distance to the row and push it to the result array
    cumulativeData.push([section, signal, cumulativeDistance]);
  }

  // Log the cumulative data for debugging purposes
  Logger.log(cumulativeData);

  // Return the cumulative data
  return cumulativeData;
}


function findClosestSignal(haltDistance, interSignalData, tolerance = 200) {
  let closestSignal = null;
  let minDistance = Infinity;
  
  // Find the signal with the smallest distance difference
  for (const [section, signal, signalDistance] of interSignalData) {
    const distanceDiff = Math.abs(haltDistance - signalDistance);
    
    if (distanceDiff < minDistance && distanceDiff <= tolerance) {
      minDistance = distanceDiff;
      closestSignal = {
        section: section,
        signal: signal,
        signalDistance: signalDistance,
        haltDistance: haltDistance,
        distanceDiff: distanceDiff
      };
    }
  }
  
  return closestSignal;
}

function findSignalLocationForHalt(haltDistance, tolerance = 200) {
  const interSignalData = getInterSignalDataForTrip();
  const closestSignal = findClosestSignal(haltDistance, interSignalData, tolerance);
  
  if (closestSignal) {
    // Simple format: "At Signal [SignalName]"
    const locationString = `At Signal ${closestSignal.signal}`;
    return {
      location: locationString,
      signalInfo: closestSignal,
      type: "signal"
    };
  }
  
  // Fallback to between-stations logic if no close signal found
  return null;
}

function enhanceNonScheduledHaltsWithSignalLocation(nonScheduledHalts, scheduledHalts, signalTolerance = 200) {
  return nonScheduledHalts.map(halt => {
    // First try to find a close signal
    const signalLocation = findSignalLocationForHalt(halt.distance, signalTolerance);
    
    if (signalLocation) {
      return {
        ...halt,
        station: "Unknown",
        location: signalLocation.location,
        signalInfo: signalLocation.signalInfo,
        locationType: "signal"
      };
    } else {
      // Fallback to between-stations logic
      const betweenStationsLocation = findLocationBetweenStations(halt.distance, scheduledHalts);
      return {
        ...halt,
        station: "Unknown",
        location: betweenStationsLocation,
        signalInfo: null,
        locationType: "between_stations"
      };
    }
  });
}

function findDetailedSignalLocation(haltDistance, tolerance = 200) {
  const interSignalData = getInterSignalDataForTrip();
  const closestSignal = findClosestSignal(haltDistance, interSignalData, tolerance);
  
  if (closestSignal) {
    const { section, signal, signalDistance, distanceDiff } = closestSignal;
    
    // Determine if halt is before or after the signal
    const position = haltDistance < signalDistance ? "before" : "after";
    const directionText = haltDistance < signalDistance ? "approaching" : "past";
    
    return {
      location: `At Signal "${signal}" (${distanceDiff.toFixed(1)}m ${directionText})`,
      detailedLocation: `${section} - Signal ${signal}`,
      signalInfo: closestSignal,
      position: position,
      type: "signal"
    };
  }
  
  return null;
}

// Updated main processing function with signal location
function processHaltsWithSignalLocation() {
  try {
    const matchedHalts = matchHaltsWithStations();
    const filteredHalts = removeDuplicateHalts(matchedHalts);

    const trainData = getScheduledHalts();
    const scheduledHalts = trainData.halts.split(",").map(s => s.trim());

    const {
      scheduledHalts: scheduled,
      nonScheduledHalts: nonScheduled
    } = separateScheduledAndNonScheduledHalts(filteredHalts, scheduledHalts);

    const { cumulativeDistances, interStationDistances } = getInterStationDistancesFromCumulative();
    const distanceToISD = new Map();
    cumulativeDistances.forEach((cd, i) => distanceToISD.set(cd, interStationDistances[i]));

    const attachISD = (halts) => halts.map(h => ({
      ...h,
      isd: distanceToISD.get(h.distance) ?? 0
    }));

    const scheduledWithISD = attachISD(scheduled);
    let nonScheduledWithISD = attachISD(nonScheduled);

    // Add Actual ISD now
    const scheduledWithActualISD = addActualISDToScheduledHalts(scheduledWithISD, nonScheduledWithISD);

    // Separate non-scheduled halts within 100m of scheduled halts
    const nearScheduledHalts = [];
    const trueNonScheduledHalts = [];

    nonScheduledWithISD.forEach(nonScheduledHalt => {
      const isNearScheduled = scheduledWithActualISD.some(scheduledHalt => 
        Math.abs(nonScheduledHalt.distance - scheduledHalt.distance) <= 100
      );

      if (isNearScheduled) {
        nearScheduledHalts.push(nonScheduledHalt);
      } else {
        trueNonScheduledHalts.push(nonScheduledHalt);
      }
    });

    // Enhance non-scheduled halts with signal location information (primary) and station fallback
    const trueNonScheduledHaltsWithSignalLocation = enhanceNonScheduledHaltsWithSignalLocation(
      trueNonScheduledHalts, 
      scheduledWithActualISD,
      200 // 200m tolerance for signal matching
    );
    
    const nearScheduledHaltsWithSignalLocation = enhanceNonScheduledHaltsWithSignalLocation(
      nearScheduledHalts, 
      scheduledWithActualISD,
      200
    );

    // Find missed scheduled halts
    const missedScheduled = scheduledHalts.filter(station =>
      !scheduledWithActualISD.some(halt => halt.station === station)
    );

    // Get adjusted ISD for skipped stations
    const pastData = getPastData();
    const adjustedISDMap = getAdjustedISDForSkippedStations(scheduledWithActualISD, missedScheduled, pastData);

    Logger.log("Scheduled Halts:");
    Logger.log(scheduledWithActualISD);
    Logger.log("Non-Scheduled Halts Near Scheduled (within 100m):");
    Logger.log(nearScheduledHaltsWithSignalLocation);
    Logger.log("Non-Scheduled/Unknown Halts with Signal Location:");
    Logger.log(trueNonScheduledHaltsWithSignalLocation);
    Logger.log("Missed Scheduled Halts:");
    Logger.log(missedScheduled);

    // Log the adjusted ISD Map in a readable format
    Logger.log("Adjusted ISD Map:");
    Logger.log(Object.fromEntries(adjustedISDMap));

    return {
      scheduled: scheduledWithActualISD,
      nearScheduled: nearScheduledHaltsWithSignalLocation.length > 0 ? nearScheduledHaltsWithSignalLocation : null,
      nonScheduled: trueNonScheduledHaltsWithSignalLocation,
      missedScheduled: missedScheduled.length > 0 ? missedScheduled : null,
      adjustedISDMap: adjustedISDMap.size > 0 ? Object.fromEntries(adjustedISDMap) : null
    };
  } catch (error) {
    Logger.log(`Error in processHaltsWithSignalLocation: ${error.message}`);
    return null;
  }
}

// Updated braking analysis to use signal location
function processHaltsWithSignalBraking() {
  const haltData = processHaltsWithSignalLocation();
  
  if (haltData && haltData.nonScheduled && haltData.nonScheduled.length > 0) {
    Logger.log("Creating braking report for non-scheduled halts with signal locations...");
    
    // Create braking report for non-scheduled halts with signal location
    const nonScheduledBrakingReport = createNonScheduledBrakingReportWithSignalLocation(haltData.nonScheduled);
    
    Logger.log("Non-scheduled braking report with signal locations created successfully");
    
    return {
      ...haltData,
      nonScheduledBrakingReport: nonScheduledBrakingReport
    };
  } else {
    Logger.log("No non-scheduled halts found or haltData is null");
  }
  
  return haltData;
}

// Updated braking report function for signal locations
function createNonScheduledBrakingReportWithSignalLocation(nonScheduledHalts) {
  try {
    Logger.log("Starting createNonScheduledBrakingReportWithSignalLocation...");
    Logger.log("Input nonScheduledHalts with signal info:");
    Logger.log(nonScheduledHalts);
    
    var ss = SpreadsheetApp.openByUrl(url);
    var destSheet = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=0#gid=0");
    var destReportSheet = destSheet.getSheetByName("Reports");
    
    // Get braking patterns for non-scheduled halts
    var brakingData = analyzeNonScheduledBrakingPatternWithSignalLocation(nonScheduledHalts);
    
    if (!brakingData || brakingData.length === 0) {
      Logger.log("No braking data found - returning empty array");
      return [];
    }
    
    // Headers - keeping original order: Location, 400m, 350m, etc.
    const headers = ["Location", "400m", "350m", "300m", "250m", "200m", "150m", "100m", "50m", "25m", "20m", "10m", "5m", "Halt"];
    const STATIONS_PER_SECTION = 4;
    
    let formattedData = [];
    
    // Add section header
    formattedData.push(["NON-SCHEDULED HALTS (SIGNAL LOCATIONS)", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    formattedData.push(Array(14).fill(""));
    
    for (let i = 0; i < brakingData.length; i += STATIONS_PER_SECTION) {
      formattedData.push(headers);
      
      const sectionData = brakingData.slice(i, i + STATIONS_PER_SECTION).map(pattern => [
        pattern.location, // Signal location in first column
        pattern.speed400m || "",
        pattern.speed350m || "",
        pattern.speed300m || "",
        pattern.speed250m || "",
        pattern.speed200m || "",
        pattern.speed150m || "",
        pattern.speed100m || "",
        pattern.speed50m || "",
        pattern.speed25m || "",
        pattern.speed20m || "",
        pattern.speed10m || "",
        pattern.speed5m || "",
        0
      ]);
      formattedData = formattedData.concat(sectionData);
      formattedData.push(Array(14).fill(""));
    }
    
    // Write to sheet
    if (formattedData.length > 0) {
      try {
        const startingRow = 13 + getExistingDataRows();
        destReportSheet.getRange(startingRow, 2, formattedData.length, 14).setValues(formattedData);
        Logger.log("Data written to sheet successfully");
      } catch (writeError) {
        Logger.log(`Error writing to sheet: ${writeError.message}`);
        destReportSheet.getRange(100, 2, formattedData.length, 14).setValues(formattedData);
        Logger.log("Data written to fallback location successfully");
      }
    }
    
    return formattedData;
    
  } catch (error) {
    Logger.log(`Error in createNonScheduledBrakingReportWithSignalLocation: ${error.message}`);
    return [];
  }
}

function analyzeNonScheduledBrakingPatternWithSignalLocation(nonScheduledHalts) {
  const spmDataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  const spmData = spmDataSheet.getRange("A2:F" + spmDataSheet.getLastRow()).getValues();
  
  const filteredNonScheduledHalts = filterCloseHalts(nonScheduledHalts, 50);
  const brakingPatterns = [];
  const checkPoints = [400, 350, 300, 250, 200, 150, 100, 50, 25, 20, 10, 5];
  
  for (const halt of filteredNonScheduledHalts) {
    const haltSpmIndex = findHaltInSpmData(spmData, halt.distance);
    
    if (haltSpmIndex !== -1) {
      const haltInfo = {
        distance: halt.distance,
        station: halt.station || "Unknown",
        location: halt.location || "Unknown Location",
        signalInfo: halt.signalInfo || null,
        locationType: halt.locationType || "unknown",
        timestamp: spmData[haltSpmIndex][0] + " " + spmData[haltSpmIndex][1]
      };
      
      const pattern = createNonScheduledBrakingPatternWithSignalInfo(haltInfo, spmData, haltSpmIndex, checkPoints);
      brakingPatterns.push(pattern);
    }
  }
  
  Logger.log("Non-Scheduled Braking patterns with signal locations found:");
  Logger.log(brakingPatterns);
  return brakingPatterns;
}

function createNonScheduledBrakingPatternWithSignalInfo(haltInfo, spmData, haltIndex, checkPoints) {
  const pattern = {
    station: haltInfo.station,
    location: haltInfo.location,
    signalInfo: haltInfo.signalInfo,
    locationType: haltInfo.locationType,
    haltDistance: haltInfo.distance,
    timestamp: haltInfo.timestamp,
    type: "Non-Scheduled"
  };
  
  // Get speeds at check points
  checkPoints.forEach(distance => {
    const result = findSpeedAtClosestDistance(spmData, haltIndex, distance);
    if (result) {
      pattern[`speed${distance}m`] = result.speed;
      pattern[`actual${distance}m`] = result.actualDistance.toFixed(1);
      pattern[`time${distance}m`] = result.timestamp;
    } else {
      pattern[`speed${distance}m`] = null;
      pattern[`actual${distance}m`] = null;
      pattern[`time${distance}m`] = null;
    }
  });
  
  // Add halt point
  pattern[`speed0m`] = 0;
  pattern[`actual0m`] = "0.0";
  pattern[`time0m`] = haltInfo.timestamp;
  
  return pattern;
}


function processHaltsWithSectionBasedSignalLocation() {
  try {
    const matchedHalts = matchHaltsWithStations();
    const filteredHalts = removeDuplicateHalts(matchedHalts);

    const trainData = getScheduledHalts();
    const scheduledHalts = trainData.halts.split(",").map(s => s.trim());

    const {
      scheduledHalts: scheduled,
      nonScheduledHalts: nonScheduled
    } = separateScheduledAndNonScheduledHalts(filteredHalts, scheduledHalts);
    Logger.log("non scheduled halts")
    Logger.log(nonScheduled)

    const { cumulativeDistances, interStationDistances } = getInterStationDistancesFromCumulative();
    const distanceToISD = new Map();
    cumulativeDistances.forEach((cd, i) => distanceToISD.set(cd, interStationDistances[i]));

    const attachISD = (halts) => halts.map(h => ({
      ...h,
      isd: distanceToISD.get(h.distance) ?? 0
    }));

    const scheduledWithISD = attachISD(scheduled);
    let nonScheduledWithISD = attachISD(nonScheduled);

    // Add Actual ISD now
    const scheduledWithActualISD = addActualISDToScheduledHalts(scheduledWithISD, nonScheduledWithISD);

    // Separate non-scheduled halts within 100m of scheduled halts
    const nearScheduledHalts = [];
    const trueNonScheduledHalts = [];

    nonScheduledWithISD.forEach(nonScheduledHalt => {
      const isNearScheduled = scheduledWithActualISD.some(scheduledHalt => 
        Math.abs(nonScheduledHalt.distance - scheduledHalt.distance) <= 100
      );

      if (isNearScheduled) {
        nearScheduledHalts.push(nonScheduledHalt);
      } else {
        trueNonScheduledHalts.push(nonScheduledHalt);
      }
    });

    // Enhance non-scheduled halts with section-based signal location
    const trueNonScheduledHaltsWithSectionSignalLocation = enhanceNonScheduledHaltsWithSectionBasedSignalLocation(
      trueNonScheduledHalts, 
      scheduledWithActualISD,
      200
    );
    
    const nearScheduledHaltsWithSectionSignalLocation = enhanceNonScheduledHaltsWithSectionBasedSignalLocation(
      nearScheduledHalts, 
      scheduledWithActualISD,
      200
    );

    // Find missed scheduled halts
    const missedScheduled = scheduledHalts.filter(station =>
      !scheduledWithActualISD.some(halt => halt.station === station)
    );

    // Get adjusted ISD for skipped stations
    const pastData = getPastData();
    const adjustedISDMap = getAdjustedISDForSkippedStations(scheduledWithActualISD, missedScheduled, pastData);

    Logger.log("Scheduled Halts:");
    Logger.log(scheduledWithActualISD);
    Logger.log("Non-Scheduled Halts Near Scheduled (within 100m):");
    Logger.log(nearScheduledHaltsWithSectionSignalLocation);
    Logger.log("Non-Scheduled/Unknown Halts with Section-Based Signal Location:");
    Logger.log(trueNonScheduledHaltsWithSectionSignalLocation);
    Logger.log("Missed Scheduled Halts:");
    Logger.log(missedScheduled);

    return {
      scheduled: scheduledWithActualISD,
      nearScheduled: nearScheduledHaltsWithSectionSignalLocation.length > 0 ? nearScheduledHaltsWithSectionSignalLocation : null,
      nonScheduled: trueNonScheduledHaltsWithSectionSignalLocation,
      missedScheduled: missedScheduled.length > 0 ? missedScheduled : null,
      adjustedISDMap: adjustedISDMap.size > 0 ? Object.fromEntries(adjustedISDMap) : null
    };
  } catch (error) {
    Logger.log(`Error in processHaltsWithSectionBasedSignalLocation: ${error.message}`);
    return null;
  }
}


function findNearestRearStation(haltDistance, stationHalts) {
  let nearestRearStation = null;
  let maxRearDistance = -1;
  
  // Find the station with the highest distance that is still less than halt distance
  for (const station of stationHalts) {
    if (station.distance < haltDistance && station.distance > maxRearDistance) {

      maxRearDistance = station.distance;
      Logger.log("maxreardistance is")
      Logger.log(maxRearDistance)
      nearestRearStation = station;
      Logger.log(nearestRearStation)
    }
  }
  
  return nearestRearStation;
}

function findNearestForwardStation(haltDistance, stationHalts) {
  let nearestForwardStation = null;
  let minForwardDistance = Infinity;
  
  // Find the station with the lowest distance that is still greater than halt distance
  for (const station of stationHalts) {
    if (station.distance > haltDistance && station.distance < minForwardDistance) {

      minForwardDistance = station.distance;
      Logger.log("minforward dist is")
      Logger.log(minForwardDistance)
      nearestForwardStation = station;
    }
  }
  
  return nearestForwardStation;
}

function getSectionName(rearStation, forwardStation) {
  // Create section name in format "REAR-FORWARD"
  if (rearStation && forwardStation) {
    return `${rearStation.station}-${forwardStation.station}`;
  }
  return null;
}



function findSignalInSectionWithRelativeDistance(haltDistance, stationHalts, tolerance = 200) {
  const trainType = getTrainTypeForTheTrip();
  const trainData = getLatestTrainData();
  
  // Find the nearest rear and forward stations
  const rearStation = findNearestRearStation(haltDistance, stationHalts);
  const forwardStation = findNearestForwardStation(haltDistance, stationHalts);
  
  if (!rearStation) {
    Logger.log(`No rear station found for halt at distance: ${haltDistance}`);
    return null;
  }
  
  // Calculate relative distance from rear station
  const relativeDistance = haltDistance - rearStation.distance;
  
  Logger.log(`Halt at ${haltDistance}: Rear station: ${rearStation.station} (${rearStation.distance}), Relative distance: ${relativeDistance}`);
  
  // Get section name
  const sectionName = getSectionName(rearStation, forwardStation);
  
  if (!sectionName) {
    Logger.log(`Could not determine section for halt at distance: ${haltDistance}`);
    return null;
  }
  
  Logger.log(`Looking for signals in section: ${sectionName}`);
  
  // Get signals for this section
  let sectionSignals = getSignalsForSection(sectionName, trainType);
  
  // Apply edge cases if needed
  sectionSignals = applySectionEdgeCases(sectionName, sectionSignals, trainData, stationHalts);
  
  if (sectionSignals.length === 0) {
    Logger.log(`No signals found for section: ${sectionName}`);
    return null;
  }
  
  // Calculate cumulative distances within the section starting from 0
  let cumulativeDistance = 0;
  const sectionSignalsWithCumulative = [];
  
  for (const [section, signal, distance] of sectionSignals) {
    if (sectionSignalsWithCumulative.length === 0) {
      cumulativeDistance = 0; // First signal starts at 0
    } else {
      cumulativeDistance += distance;
    }
    
    sectionSignalsWithCumulative.push([section, signal, cumulativeDistance]);
  }
  
  Logger.log(`Section signals with cumulative distances:`, sectionSignalsWithCumulative);
  
  // Find the closest signal within the section
  let closestSignal = null;
  let minDistanceDiff = Infinity;
  
  for (const [section, signal, signalCumulativeDistance] of sectionSignalsWithCumulative) {
    const distanceDiff = Math.abs(relativeDistance - signalCumulativeDistance);
    
    if (distanceDiff < minDistanceDiff && distanceDiff <= tolerance) {
      minDistanceDiff = distanceDiff;
      closestSignal = {
        section: section,
        signal: signal,
        signalDistance: signalCumulativeDistance,
        relativeDistance: relativeDistance,
        distanceDiff: distanceDiff,
        rearStation: rearStation.station,
        forwardStation: forwardStation ? forwardStation.station : "End"
      };
    }
  }
  
  return closestSignal;
}



function enhanceNonScheduledHaltsWithSectionBasedSignalLocation(nonScheduledHalts, scheduledHalts, signalTolerance = 200) {
  // Get all station data including scheduled halts
  const stationHalts = matchHaltsWithStations();
  
  return nonScheduledHalts.map(halt => {
    // Use section-based approach to find signal
    const signalLocation = findSignalInSectionWithRelativeDistance(halt.distance, stationHalts, signalTolerance);
    
    if (signalLocation) {
      const locationString = `At Signal ${signalLocation.signal}`;
      return {
        ...halt,
        station: "Unknown",
        location: locationString,
        signalInfo: signalLocation,
        locationType: "signal_section_based"
      };
    } else {
      // Fallback to between-stations logic
      const betweenStationsLocation = findLocationBetweenStations(halt.distance, scheduledHalts);
      return {
        ...halt,
        station: "Unknown", 
        location: betweenStationsLocation,
        signalInfo: null,
        locationType: "between_stations"
      };
    }
  });
}
// **************************************************************//



function applySectionEdgeCases(sectionName, sectionSignals, trainData, stationHalts) {
  // Apply VDLR edge case
  if (sectionName === "VDLR-GTBN" && shouldUseVDLREdgeCase(trainData)) {
    Logger.log(`Applying VDLR edge case for section: ${sectionName}`);
    return [
      ['VDLR-GTBN', 'RVJ S-7', 0.0], 
      ['VDLR-GTBN', 'RVJ S-15', 517.0],
      ['VDLR-GTBN', 'RVJ S-22', 465.0], 
      ['VDLR-GTBN', 'H-41', 909.0], 
      ['VDLR-GTBN', 'H-43', 755.0]
    ];
  }
  
  // Apply TNA edge case
  if (sectionName === "TNA-MLND" && shouldUseTNAEdgeCase(trainData, stationHalts)) {
    Logger.log(`Applying TNA edge case for section: ${sectionName}`);
    return [
      ['TNA-MLND', 'TNA S-44', 0],
      ['TNA-MLND', 'TNA S-8', 582.0],
      ['TNA-MLND', 'L-092', 504.0],
      ['TNA-MLND', 'MLND S-17', 419.0], 
      ['TNA-MLND', 'MLND S-15', 460.0]
    ];
  }
  
  return sectionSignals;
}






function processHaltsWithSimplifiedSectionBasedSignalLocation() {
  try {
    // Get the processed halts data
    const haltsData = processHalts();
    
    if (!haltsData || !haltsData.scheduled || !haltsData.nonScheduled) {
      Logger.log("No halts data available");
      return haltsData;
    }
    
    const { scheduled, nonScheduled, missedScheduled, adjustedISDMap } = haltsData;
    
    // Separate non-scheduled halts within 100m of scheduled halts
    const nearScheduledHalts = [];
    const trueNonScheduledHalts = [];

    nonScheduled.forEach(nonScheduledHalt => {
      const isNearScheduled = scheduled.some(scheduledHalt => 
        Math.abs(nonScheduledHalt.distance - scheduledHalt.distance) <= 100
      );

      if (isNearScheduled) {
        nearScheduledHalts.push(nonScheduledHalt);
      } else {
        trueNonScheduledHalts.push(nonScheduledHalt);
      }
    });

    // Enhance non-scheduled halts with simplified section-based signal location
    const trueNonScheduledHaltsWithSignalLocation = enhanceNonScheduledHaltsWithSimplifiedSectionSignalLocation(
      trueNonScheduledHalts, 
      scheduled,
      200
    );
    
    const nearScheduledHaltsWithSignalLocation = enhanceNonScheduledHaltsWithSimplifiedSectionSignalLocation(
      nearScheduledHalts, 
      scheduled,
      200
    );

    Logger.log("Scheduled Halts:");
    Logger.log(scheduled);
    Logger.log("Non-Scheduled Halts Near Scheduled (within 100m):");
    Logger.log(nearScheduledHaltsWithSignalLocation);
    Logger.log("Non-Scheduled/Unknown Halts with Simplified Section-Based Signal Location:");
    Logger.log(trueNonScheduledHaltsWithSignalLocation);
    Logger.log("Missed Scheduled Halts:");
    Logger.log(missedScheduled);

    return {
      scheduled: scheduled,
      nearScheduled: nearScheduledHaltsWithSignalLocation.length > 0 ? nearScheduledHaltsWithSignalLocation : null,
      nonScheduled: trueNonScheduledHaltsWithSignalLocation,
      missedScheduled: missedScheduled,
      adjustedISDMap: adjustedISDMap
    };
  } catch (error) {
    Logger.log(`Error in processHaltsWithSimplifiedSectionBasedSignalLocation: ${error.message}`);
    return null;
  }
}

function enhanceNonScheduledHaltsWithSimplifiedSectionSignalLocation(nonScheduledHalts, scheduledHalts, signalTolerance = 200) {
  return nonScheduledHalts.map(halt => {
    // Use simplified section-based approach to find signal
    const signalLocation = findSignalInSectionUsingScheduledStations(halt.distance, scheduledHalts, signalTolerance);
    
    if (signalLocation) {
      const locationString = `At Signal ${signalLocation.signal}`;
      return {
        ...halt,
        station: "Unknown",
        location: locationString,
        signalInfo: signalLocation,
        locationType: "signal_section_based_simplified"
      };
    } else {
      // Fallback to between-stations logic
      const betweenStationsLocation = findLocationBetweenStations(halt.distance, scheduledHalts);
      return {
        ...halt,
        station: "Unknown", 
        location: betweenStationsLocation,
        signalInfo: null,
        locationType: "between_stations"
      };
    }
  });
}


function shouldUseVDLREdgeCase(trainData) {
  const trainNo = trainData.trainNo;
  
  if (!trainNo) return false;
  
  // Check if train starts with GNPL
  if (trainNo.startsWith('GNPL')) {
    return true;
  }
  
  // Check for PLVD, VVD, or BRVD with odd numbers
  const vdPatterns = ['PLVD', 'VVD', 'BRVD'];
  
  for (const pattern of vdPatterns) {
    if (trainNo.startsWith(pattern)) {
      // Extract the number after the pattern
      const numberPart = trainNo.substring(pattern.length);
      const number = parseInt(numberPart);
      
      // Check if it's a valid odd number
      if (!isNaN(number) && number % 2 === 1) {
        return true;
      }
    }
  }
  
  return false;
}

function shouldUseTNAEdgeCase(trainData, scheduledHalts) {
  // Check if "from" station is "TNA"
  if (trainData.from !== "TNA") {
    return false;
  }
  
  // Find MLND station in scheduled halts
  const mlndHalt = scheduledHalts.find(halt => halt.station === "MLND");
  
  if (mlndHalt && mlndHalt.distance < 2500) {
    return true;
  }
  
  return false;
}
// ****************************26/06/2025************************************//


function findRearAndForwardStationsFromScheduled(haltDistance, scheduledHalts) {
  // Sort scheduled halts by distance to ensure proper order
  const sortedScheduledHalts = [...scheduledHalts].sort((a, b) => a.distance - b.distance);
  
  let rearStation = null;
  let forwardStation = null;
  
  // Find the closest lower distance (rear station)
  for (const station of sortedScheduledHalts) {
    if (station.distance <= haltDistance) {
      rearStation = station;
    } else {
      // First station with distance > haltDistance is the forward station
      forwardStation = station;
      break;
    }
  }
  
  return { rearStation, forwardStation };
}

function getSectionsForStationRange(rearStation, forwardStation) {
  const allSections = clubStationsForTrip();
  
  if (!rearStation || !forwardStation) {
    return [];
  }
  
  // Find the start section (rear station is the first part of section name)
  let startSectionIndex = -1;
  // Find the end section (forward station is the second part of section name)  
  let endSectionIndex = -1;
  
  for (let i = 0; i < allSections.length; i++) {
    const section = allSections[i];
    const [sectionStart, sectionEnd] = section.split('-');
    
    // Check if this section starts with our rear station
    if (sectionStart === rearStation.station) {
      startSectionIndex = i;
    }
    
    // Check if this section ends with our forward station
    if (sectionEnd === forwardStation.station) {
      endSectionIndex = i;
    }
  }
  
  // Get all sections from start to end (inclusive)
  if (startSectionIndex !== -1 && endSectionIndex !== -1 && startSectionIndex <= endSectionIndex) {
    return allSections.slice(startSectionIndex, endSectionIndex + 1);
  }
  
  Logger.log(`Could not find proper section range for ${rearStation.station} to ${forwardStation.station}`);
  Logger.log(`Start section index: ${startSectionIndex}, End section index: ${endSectionIndex}`);
  Logger.log(`Available sections: ${allSections.join(', ')}`);
  
  return [];
}

function getSignalsForMultipleSections(sectionNames, trainType) {
  // Get appropriate inter-signal data based on train type
  const interSignalData = trainType === "fast" ? interSignalDataFastSection : interSignalDistance;
  
  let allSectionSignals = [];
  
  // Collect signals from all sections
  for (const sectionName of sectionNames) {
    const sectionSignals = interSignalData.filter(row => row[0] === sectionName);
    allSectionSignals = allSectionSignals.concat(sectionSignals);
  }
  
  return allSectionSignals;
}
function applySectionEdgeCasesForMultipleSections(sectionNames, allSectionSignals, trainData, scheduledHalts) {
  let modifiedSignals = [...allSectionSignals];
  
  // Apply edge cases for each section
  for (const sectionName of sectionNames) {
    // Apply VDLR edge case
    if (sectionName === "VDLR-GTBN" && shouldUseVDLREdgeCase(trainData)) {
      Logger.log(`Applying VDLR edge case for section: ${sectionName}`);
      
      // Remove original VDLR-GTBN signals
      modifiedSignals = modifiedSignals.filter(row => row[0] !== 'VDLR-GTBN');
      
      // Add edge case signals
      const edgeCaseOfVDLR = [
        ['VDLR-GTBN', 'RVJ S-7', 0.0], 
        ['VDLR-GTBN', 'RVJ S-15', 517.0],
        ['VDLR-GTBN', 'RVJ S-22', 465.0], 
        ['VDLR-GTBN', 'H-41', 909.0], 
        ['VDLR-GTBN', 'H-43', 755.0]
      ];
      
      // Insert at the correct position based on section order
      const insertIndex = findInsertPositionForSection(sectionName, sectionNames, modifiedSignals);
      modifiedSignals.splice(insertIndex, 0, ...edgeCaseOfVDLR);
    }
    
    // Apply TNA edge case
    if (sectionName === "TNA-MLND" && shouldUseTNAEdgeCase(trainData, scheduledHalts)) {
      Logger.log(`Applying TNA edge case for section: ${sectionName}`);
      
      // Remove original TNA-MLND signals
      modifiedSignals = modifiedSignals.filter(row => row[0] !== 'TNA-MLND');
      
      // Add edge case signals
      const edgeCaseOfTNA = [
        ['TNA-MLND', 'TNA S-44', 0],
        ['TNA-MLND', 'TNA S-8', 582.0],
        ['TNA-MLND', 'L-092', 504.0],
        ['TNA-MLND', 'MLND S-17', 419.0], 
        ['TNA-MLND', 'MLND S-15', 460.0]
      ];
      
      // Insert at the correct position based on section order
      const insertIndex = findInsertPositionForSection(sectionName, sectionNames, modifiedSignals);
      modifiedSignals.splice(insertIndex, 0, ...edgeCaseOfTNA);
    }
  }
  
  return modifiedSignals;
}
function findInsertPositionForSection(targetSection, sectionNames, signals) {
  const targetSectionIndex = sectionNames.indexOf(targetSection);
  
  if (targetSectionIndex === 0) {
    return 0; // Insert at beginning
  }
  
  // Find where signals for previous sections end
  let insertIndex = 0;
  for (let i = 0; i < targetSectionIndex; i++) {
    const sectionName = sectionNames[i];
    const sectionSignalCount = signals.filter(row => row[0] === sectionName).length;
    insertIndex += sectionSignalCount;
  }
  
  return insertIndex;
}

function findSignalInSectionUsingScheduledStations(haltDistance, scheduledHalts, tolerance = 200) {
  const trainType = getTrainTypeForTheTrip();
  const trainData = getLatestTrainData();
  
  // Find rear and forward stations from scheduled halts
  const { rearStation, forwardStation } = findRearAndForwardStationsFromScheduled(haltDistance, scheduledHalts);
  
  if (!rearStation) {
    Logger.log(`No rear station found for halt at distance: ${haltDistance}`);
    return null;
  }
  
  // Calculate relative distance from rear station
  const relativeDistance = haltDistance - rearStation.distance;
  
  Logger.log(`Halt at ${haltDistance}: Rear station: ${rearStation.station} (${rearStation.distance}), Forward station: ${forwardStation ? forwardStation.station : 'End'}, Relative distance: ${relativeDistance}`);
  
  // Get all sections between rear and forward stations
  const sectionNames = getSectionsForStationRange(rearStation, forwardStation);
  
  if (sectionNames.length === 0) {
    Logger.log(`No sections found between ${rearStation.station} and ${forwardStation ? forwardStation.station : 'End'}`);
    return null;
  }
  
  Logger.log(`Sections to search: ${sectionNames.join(', ')}`);
  
  // Get signals for all sections
  let allSectionSignals = getSignalsForMultipleSections(sectionNames, trainType);
  
  // Apply edge cases if needed
  allSectionSignals = applySectionEdgeCasesForMultipleSections(sectionNames, allSectionSignals, trainData, scheduledHalts);
  
  if (allSectionSignals.length === 0) {
    Logger.log(`No signals found for sections: ${sectionNames.join(', ')}`);
    return null;
  }
  
  // Calculate cumulative distances across all sections starting from 0
  let cumulativeDistance = 0;
  const allSignalsWithCumulative = [];
  
  for (const [section, signal, distance] of allSectionSignals) {
    if (allSignalsWithCumulative.length === 0) {
      cumulativeDistance = 0; // First signal starts at 0
    } else {
      cumulativeDistance += distance;
    }
    
    allSignalsWithCumulative.push([section, signal, cumulativeDistance]);
  }
  
  Logger.log(`All signals with cumulative distances:`, allSignalsWithCumulative);
  
  // Find the closest signal across all sections
  let closestSignal = null;
  let minDistanceDiff = Infinity;
  
  for (const [section, signal, signalCumulativeDistance] of allSignalsWithCumulative) {
    const distanceDiff = Math.abs(relativeDistance - signalCumulativeDistance);
    
    if (distanceDiff < minDistanceDiff && distanceDiff <= tolerance) {
      minDistanceDiff = distanceDiff;
      closestSignal = {
        section: section,
        signal: signal,
        signalDistance: signalCumulativeDistance,
        relativeDistance: relativeDistance,
        distanceDiff: distanceDiff,
        rearStation: rearStation.station,
        forwardStation: forwardStation ? forwardStation.station : "End",
        sectionsSearched: sectionNames
      };
    }
  }
  
  return closestSignal;
}

function getSignalsForSection(sectionName, trainType) {
  // Get appropriate inter-signal data based on train type
  const interSignalData = trainType === "fast" ? interSignalDataFastSection : interSignalDistance;
  
  // Filter signals for the specific section
  const sectionSignals = interSignalData.filter(row => row[0] === sectionName);
  
  return sectionSignals;
}
















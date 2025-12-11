var url = "https://docs.google.com/spreadsheets/d/1qvvcsXclHGevILgosBypTZoxt6rgv01oXiyk88Us0XE/edit?gid=0#gid=0"


function findClosestDistance(data, targetDistance) {
  var closestDistance = null;
  var minDiff = Infinity;
  
  for (var i = 1; i < data.length; i++) {
    var distance = data[i][1] * 1000; // Multiply by 1000 to match the units
    var diff = Math.abs(distance - targetDistance);
    
    if (diff < minDiff) {
      minDiff = diff;
      closestDistance = distance;
    }
  }
  
  return closestDistance / 1000; // Divide by 1000 to return the value in the original units
}

function getStation(data, distance) {
  const tolerance = 0.0001; // Adjust this tolerance as needed
  Logger.log('Looking for distance: ' + distance);
Logger.log('Available distances: ' + data.map(row => row[1]).join(', '));
  for (var i = 1; i < data.length; i++) {
    // Use Math.abs() to check if the difference is within tolerance
    if (Math.abs(data[i][1] - distance) <= tolerance) {
      return data[i][2];
    }
  }
  
  // If no match found within tolerance, find the closest station
  let closestStation = null;
  let minDiff = Infinity;
  
  for (var i = 1; i < data.length; i++) {
    const diff = Math.abs(data[i][1] - distance);
    if (diff < minDiff) {
      minDiff = diff;
      closestStation = data[i][2];
    }
  }
  
  return closestStation;
}

function getPreviousDistanceAndStation(distance) {
  var dataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SignalAndSpeed");
  var data = dataSheet.getRange("A2:C"+dataSheet.getLastRow()).getValues();
  
  // Special case for first station (distance = 0)
  if (parseFloat(distance) <= parseFloat(data[0][1])) {
    return { distance: 0, station: data[0][2] };  // Return first station
  }
  
  for (var i = 1; i < data.length; i++) {
    if (parseFloat(data[i][1]) >= parseFloat(distance)) {
      if (i > 1) {
        return { distance: data[i-1][1], station: data[i-1][2] };
      }
    }
  }
  
  return null;
}
function filterStationData(dataSheet) {
  var data = dataSheet.getRange("A2:C" + dataSheet.getLastRow()).getValues();
  var stationSet = new Set(stations.map(st => st[1]));
  return data.filter(row => stationSet.has(row[2].trim()));
}

function filterNonHaltingStationData(dataSheet) {
  var data = dataSheet.getRange("A2:C" + dataSheet.getLastRow()).getValues();
  var stationSet = new Set(stations.map(st => st[1]));
  return data.filter(row => !stationSet.has(row[2].trim()));
}

function findClosestNonHaltingStationEntries() {
  var dataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SignalAndSpeed");
  var spmDataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  
  // Get the station data filtered by the predefined stations array
  var filteredData = filterNonHaltingStationData(dataSheet);
  
  var haltingStationsWithEntry = stationEntryOfNonHaltingStations();
  
  var results = filteredData.filter(function(station) {
    return !haltingStationsWithEntry.some(function(haltingStation) {
      return haltingStation.replace(/\s+/g, '') === station[2].replace(/\s+/g, '');
    });
  }).map(function(station) {
    return {
      station: station[2],
      distance: station[1],
      isHalt: false
    };
  });
  
  Logger.log(results)
  return results;
}


function findStationWithinTolerance(data, targetDistance, tolerance) {
  for (var i = 0; i < data.length; i++) {
    var stationDistance = data[i][1] * 1000; // Convert to meters
    if (Math.abs(stationDistance - targetDistance) <= tolerance) {
      return data[i];
    }
  }
  return null;
}
function findClosestStations() {
  var dataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SignalAndSpeed");
  var spmDataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  
  // Get the station data filtered by the predefined stations array
  var filteredData = filterStationData(dataSheet);
  
  // Get the SPM data
  var spmData = spmDataSheet.getDataRange().getValues();
  
  var results = [];
  
  // Add all stations from filtered data
  for (var i = 0; i < filteredData.length; i++) {
    var station = filteredData[i][2];
    var distance = filteredData[i][1];
    
    results.push({
      station: station,
      distance: distance,
      isHalt: false // Add a flag to track if this is a halt station
    });
  }
  
  // Mark halt stations
  for (var i = 1; i < spmData.length; i++) {
    var cumDist = spmData[i][4];
    var speed = spmData[i][2];
    var nextSpeed = spmData[i][3];
    // var status = spmData[i][5] ? spmData[i][5].toLowerCase() : "";
    
    if (speed == 0 && nextSpeed == 0) {
      var closestStation = findStationWithinTolerance(filteredData, cumDist, 175);
      if (closestStation) {
        // Find and mark the corresponding station in results
        for (var j = 0; j < results.length; j++) {
          if (results[j].station === closestStation[2]) {
            results[j].isHalt = true;
            break;
          }
        }
      }
    }
  }
 Logger.log(results)
  return results;
}

function separateHaltingStations(stations) {
  var haltingStations = stations.filter(function(station) {
    return station.isHalt === true;
  });
  
  var nonHaltingStations = stations.filter(function(station) {
    return station.isHalt === false;
  });
  
  return {
    haltingStations: haltingStations,
    nonHaltingStations: nonHaltingStations
  };
}

function haltingAndNonHaltingStations(){
var closestStations = findClosestStations();
var separatedStations = separateHaltingStations(closestStations);
Logger.log(separatedStations.haltingStations);
Logger.log(separatedStations.nonHaltingStations);

return separateHaltingStations
}

function stationEntryOfNonHaltingStations(){
var closestStations = findClosestStations();
  var separatedStations = separateHaltingStations(closestStations);
  Logger.log(separatedStations.haltingStations);
  Logger.log(separatedStations.nonHaltingStations);

  var haltingStationsWithEntry = separatedStations.haltingStations.map(function(station) {
    return station.station + " Entry";
  });
Logger.log(haltingStationsWithEntry)
  return haltingStationsWithEntry;


}


function previousDistanceAndStation() {
  var results = findClosestStations();
  var previousStations = [];
  
  // Only process stations where isHalt is true
  for (var i = 0; i < results.length; i++) {
    if (results[i].isHalt) {
      var previous = getPreviousDistanceAndStation(results[i].distance);
      
      if (previous) {
        previousStations.push({ 
          station: previous.station, 
          distance: previous.distance,
          isHalt: true
        });
      } else {
        previousStations.push({ 
          station: "Not Found", 
          distance: null,
          isHalt: true
        });
      }
    }
  }
  // Logger.log(previousStations)
  return previousStations;
}

function previousDistanceAndStationForNonHalt() {
  var results = findClosestStations();
  var previousNonHaltStations = [];
  
  // Only process stations where isHalt is false
  for (var i = 0; i < results.length; i++) {
    if (!results[i].isHalt) {
      var previous = getPreviousDistanceAndStation(results[i].distance);
      Logger.log("Previous for non-halt station:", previous);
      if (previous) {
        previousNonHaltStations.push({ 
          station: previous.station, 
          distance: previous.distance,
          isHalt: false
        });
      } else {
        previousNonHaltStations.push({ 
          station: "Not Found", 
          distance: null,
          isHalt: false
        });
      }
    }
  }
  Logger.log("Previous Non-Halt Stations:", previousNonHaltStations);
  return previousNonHaltStations;
}


function findClosestCumulativeDistance(spmData, targetDistance) {
  var minDiff = Infinity;
  var closestDistance = null;
  
  for (var i = 1; i < spmData.length; i++) {
    var distance = spmData[i][4];
    var diff = Math.abs(distance - targetDistance * 1000);
    
    if (diff < minDiff) {
      minDiff = diff;
      closestDistance = distance / 1000; // Convert back to original units
    }
  }
  
  return closestDistance;
}
function findClosestValuesInSPMData(closestStations, previousStations) {
  var spmDataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  var spmData = spmDataSheet.getDataRange().getValues();
  
  var previousStationsWithClosestValues = [];
  var closestStationsWithClosestValues = [];
  
  // Find closest values in the "SPM Data" sheet
  for (var i = 0; i < previousStations.length; i++) {
    var closestDistance =  findClosestCumulativeDistance(spmData, previousStations[i].distance);
     Logger.log('previous debug')
    // Logger.log(closestDistance)
    Logger.log(previousStations[i].station)
    Logger.log(previousStations[i].distance)
    previousStationsWithClosestValues.push({ station: previousStations[i].station, distance: closestDistance });
  }
  
  for (var i = 0; i < closestStations.length; i++) {
    var closestDistance = findClosestCumulativeDistance(spmData, closestStations[i].distance);
    closestStationsWithClosestValues.push({ station: closestStations[i].station, distance: closestDistance });
  }
  Logger.log(previousStationsWithClosestValues)
  return { 
    previousStationsWithClosestValues: previousStationsWithClosestValues, 
    closestStationsWithClosestValues: closestStationsWithClosestValues 
  };
}



function setClosestStationName(closestStationsWithClosestValues) {
  var spmDataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  var spmData = spmDataSheet.getDataRange().getValues();
  
  for (var i = 0; i < closestStationsWithClosestValues.length; i++) {
    var closestValue = closestStationsWithClosestValues[i].closestValue;
    var closestStation = closestStationsWithClosestValues[i].distance; // Note: This is actually the distance, not the station name
    
    // Find the row where Column C and Column D values are 0 and Column E matches the closestValue
    for (var j = 1; j < spmData.length; j++) {
      if (spmData[j][2] == 0 && spmData[j][3] == 0 && spmData[j][4] == closestValue) {
        // Set the closest station name in columns G and H
        spmDataSheet.getRange(j + 1, 7).setValue(closestStation);
        spmDataSheet.getRange(j + 1, 8).setValue(closestStation);
        break;
      }
    }
  }
}


function createComboChart() {
  var spmDataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
var dataRange =spmDataSheet.getRange("G1:L"+spmDataSheet.getLastRow() )
var chart = spmDataSheet.newChart()
    .asComboChart()
    .addRange(dataRange)
    .setOption("useFirstColumnAsDomain", true)
    .setOption("series", {
       0: {type: "bars",color:'brown',lineWidth:50},
       2: {type: "steppedArea",color:'lightgreen'},
       3: {type: "steppedArea",color:'blue'},
       //4: {type: "line",lineWidth: 4,color: 'yellow'},//, targetAxisIndex: 1
    //   4: {
    //   type: "bars",
    //   color: "red"
    // }
    })
    
    .setOption('width', 975)
    .setOption('legend','none')
    .setOption('isStacked', false)
    // .setOption('bar', {lineWidth:4})
    // .setOption('series', {2: {color: 'lightgreen'}})
    
    .setOption('vAxis', { ticks: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110], gridlines: { count: 12 ,color:'lightgray'} })

    .setPosition(1, 1, 0, 0)
    .build();

 spmDataSheet.insertChart(chart);
}


function createRoutesArray(fromStn, toStn) {
  const trainType = getTrainTypeForTheTrip();
  const routesToUse = trainType === 'fast' ? fastRoutes : routes;
  
  for (let i = 0; i < routesToUse.length; i++) {
    const routeArr = routesToUse[i];
    if (routeArr.includes(fromStn) && routeArr.includes(toStn)) {
      return routeArr;
    }
  }
  
  return null;
}
function finalRoutesList(){
  const tripInfo = tripStationInfo();  // Get station info
  const fromStn = tripInfo.fromStation;
  const toStn = tripInfo.toStation;
const routeArr = createRoutesArray(fromStn,toStn)
Logger.log(routeArr)
if (!routeArr) {
    Logger.log(`No route found between ${fromStn} and ${toStn}`);
    return null;
  }
  
  const fromIndex = routeArr.indexOf(fromStn);
  const toIndex = routeArr.indexOf(toStn);
  
  // Handle case where start and end stations are the same
  if (fromStn === toStn) {
    return [fromStn];
  }
  
  if (fromIndex < toIndex) {
    Logger.log(routeArr.slice( fromIndex,toIndex+1))
    return routeArr.slice(fromIndex, toIndex + 1);  // Forward route
  } else {
    Logger.log(routeArr.slice(toIndex, fromIndex + 1).reverse()) 
    return routeArr.slice(toIndex, fromIndex + 1).reverse();  // Reverse route
  }
}



 function clubStationsForTrip(){
   
    const sections = finalRoutesList()
    let subSections = []

    for (let i = 0; i < sections.length-1; i++) {    
     subSections.push(sections[i]+"-"+sections[i+1])  
    }
    Logger.log(subSections)
    return subSections
 }

function getSectionsForTheTrip() {
  const trainData = getLatestTrainData();
  const trainType = getTrainTypeForTheTrip();
  
  // Check if the train belongs to trans-harbour line
  const isTransHarbour = isTrainTransHarbour(trainData.trainCode);
  Logger.log(isTransHarbour)
  // Choose appropriate data source based on train type and line
  let data;
  if (isTransHarbour) {
    data = sectionsListTHB;
  } else {
    data = trainType === 'fast' ? fastSectionsList : sectionsList;
    
  }
  
  const subSections = clubStationsForTrip();
  
  let tripSections = [];
  for (let item of data) {
    if (subSections.includes(item[0])) {
      tripSections.push(item);
    }
  }
  Logger.log(tripSections);
  return tripSections;
}

// Helper function to check if train code belongs to trans-harbour line
function isTrainTransHarbour(trainCode) {
 
  if (!trainCode) return false;
  
  // Convert trainCode to string to ensure we can use string methods
  const trainCodeStr = String(trainCode);
  
  // Check if the trainCode matches any of the trans-harbour train codes
  const transHarbourCategoryCodes = trainCodes.harbourLine.transHarbour;
  
  // Log for debugging
  Logger.log("Checking train code: " + trainCodeStr);
  
  // Iterate through all routes in transHarbour
  for (const route in transHarbourCategoryCodes) {
    const codePatterns = transHarbourCategoryCodes[route];
    Logger.log("Checking route: " + route + " with patterns: " + JSON.stringify(codePatterns));
    
    for (const pattern of codePatterns) {
      // Extract prefix from pattern (removing 'XX')
      const prefix = pattern.replace('XX', '');
      Logger.log("Checking prefix: " + prefix);
      
      // Check if the trainCodeStr starts with the prefix
      if (trainCodeStr.startsWith(prefix)) {
        Logger.log("Match found: " + trainCodeStr + " starts with " + prefix);
        return true;
      }
    }
  }
  
  return false;
}

function transformArray(filteredValues) {
  // Check if the array is empty
  if (filteredValues.length === 0) return filteredValues;

  // Set the second element of the first item to 0


  filteredValues[0][1] = 0;
  filteredValues[0][2] = filteredValues[0][3]
  for (var i = 1; i < filteredValues.length - 1; i++) {
    var currentValue = filteredValues[i][1];
    filteredValues[i][1] = filteredValues[i - 1][2]
    var sum = filteredValues[i][1] + filteredValues[i][3];
    filteredValues[i][2] = sum;
    filteredValues[i + 1][1] = sum
    prevValue = currentValue;

  }
  filteredValues[filteredValues.length - 1][2] = filteredValues[filteredValues.length - 1][1] + filteredValues[filteredValues.length - 1][3]
  // Logger.log(filteredValues)
  return filteredValues;
}

function modifyPSRArray() {
  var filterValues = getSectionsForTheTrip()

  const modifiedPSRArray = transformArray(filterValues)

  Logger.log(modifiedPSRArray)
  return modifiedPSRArray

}

// function getTSRData() {
//   const tsrSheet = SpreadsheetApp.openByUrl(url).getSheetByName("TSR Data");
//   const lr = tsrSheet.getLastRow();
//   if (lr <= 1) return []; // Return empty array if only header row exists
  
//   // Get data from columns A to D (From, To, Span, Speed)
//   const tsrData = tsrSheet.getRange(2, 1, lr-1, 4).getValues();
//    Logger.log(tsrData)
//   // Filter out rows with empty crucial data
//   const validTSRData = tsrData.filter(row => row[0] && row[1] && row[3]);
//   // Logger.log(validTSRData)
//   // Transform into required format [startKm, endKm, span, speed]
//   const rawTSRArray = validTSRData.map(row => [
//     parseFloat(row[0]), // From km
//     parseFloat(row[1]), // To km
//     parseFloat((Math.abs(row[1]-row[0])*50)+260), // Span
//     parseFloat(row[3])  // Speed
//   ]);
//    Logger.log(rawTSRArray)
//   // Use the same transformArray function as PSR
//   // const transformedTSRData = transformArray(rawTSRArray);
//   // Logger.log(transformedTSRData)
//   return rawTSRArray;
// }

function getClosestRow(value, array) {
  var closestRow = 0;
  var closestDifference = Math.abs(value - array[0][0]);

  for (var i = 0; i < array.length; i++) {
    var difference = Math.abs(value - array[i][0]);
    if (difference < closestDifference) {
      closestRow = i;
      closestDifference = difference;

    }
  }
  //Logger.log(closestRow)
  return closestRow;
}

function findClosestValueInSheetForPSR(){
  var dataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  var lr = dataSheet.getLastRow()
  var kmData = dataSheet.getRange("E2:E"+lr).getValues();
//Logger.log(kmData)
  var nearestStartRow
  var nearestEndRow 
  const psrData = modifyPSRArray()
   for(let i=0;i<psrData.length;i++){

    var psrStartKm = psrData[i][1]
    var psrEndKm = psrData[i][2]

    nearestStartRow = getClosestRow(psrStartKm,kmData)
    nearestEndRow = getClosestRow(psrEndKm,kmData)
    Logger.log(nearestStartRow+2)
    Logger.log(nearestEndRow+2)
     dataSheet.getRange(nearestStartRow+2,11,parseInt(nearestEndRow-nearestStartRow)+1,1).setValue(psrData[i][4])
   }
  
}


function findClosestValueInSheetForTSR() {
  const dataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  const lr = dataSheet.getLastRow();
  const kmData = dataSheet.getRange("E2:E" + lr).getValues()//.flat() Flatten to 1D array

  const TSR_SPAN = 50;    // Average span of one structure in meters
  const TRAIN_LENGTH = 260;  // Train length in meters

  const tsrData = modifyTSRArray(); // [From, To, Span, Speed]

  for (let i = 0; i < tsrData.length; i++) {
    let fromVal = tsrData[i][0];  // e.g., 34.213
    let toVal = tsrData[i][1];    // e.g., 34.215
    let speed = tsrData[i][3];

    // Extract KM and Structure parts
    let fromKm = Math.floor(fromVal);               // 34
    let fromStruct = Math.round((fromVal - fromKm) * 1000); // 213

    let toKm = Math.floor(toVal);
    let toStruct = Math.round((toVal - toKm) * 1000);

    // Determine direction
    let direction = (fromStruct < toStruct) ? 1 : -1;

    // Structure count (every 2 is a valid structure in same direction)
    let structCount = Math.floor(Math.abs(toStruct - fromStruct) / 2) + 1;

    // Total TSR span in meters
    let totalSpan = structCount * TSR_SPAN + TRAIN_LENGTH;

    // Start in meters
    let tsrStartMeters = fromKm * 1000 + fromStruct; // or reverse calculation if needed
    let tsrEndMeters = tsrStartMeters + (direction * totalSpan);  // Can be + or -
Logger.log(tsrStartMeters)
Logger.log(tsrEndMeters)
    // Ensure start is always less than end
    let start = Math.min(tsrStartMeters, tsrEndMeters);
    let end = Math.max(tsrStartMeters, tsrEndMeters);
Logger.log(start)
Logger.log("this is end km")
Logger.log(end)
    // Find the nearest rows
    let nearestStartRow = getClosestRow(start, kmData);
    let nearestEndRow = getClosestRow(end, kmData);
    Logger.log(nearestStartRow)
Logger.log(nearestEndRow)

    if (nearestStartRow !== -1 && nearestEndRow !== -1) {
      let rangeStart = Math.min(nearestStartRow, nearestEndRow);
      let rangeLen = Math.abs(nearestEndRow - nearestStartRow) + 1;
      dataSheet.getRange(rangeStart + 2, 12, rangeLen, 1).setValue(speed);
    }
  }
}

function filterAndTransformData() {
  var ss = SpreadsheetApp.openByUrl(url);
  var sheet = ss.getSheetByName("SECTIONS");
  var tempSheet = ss.getSheetByName("SignalAndSpeed");
  var trainType = getTrainTypeForTheTrip();
  var filterValues = clubStationsForTrip(); // Get the required sections
  Logger.log("filtervalues from clubbing")
  Logger.log(filterValues)
  let filteredValues;
  
  if (trainType === "fast") {
    // Filter fastStationISD array based on the sections from clubStationsForTrip
    filteredValues = fastStationISD.slice(1).filter(function(row) {
      return filterValues.indexOf(row[0]) !== -1;
    });
    
    // Sort according to the order in filterValues
    filteredValues.sort(function(a, b) {
      return filterValues.indexOf(a[0]) - filterValues.indexOf(b[0]);
    });
    
    // Set the first row of the second column as 0
    filteredValues[0][1] = 0;
    
    // Calculate running total for the second column starting from the second row
    for (var i = 1; i < filteredValues.length; i++) {
      filteredValues[i][1] = filteredValues[i-1][1] + filteredValues[i][1];
    }
    Logger.log(filteredValues)
    var lastSection = filterValues[filterValues.length - 1];
    var lastStationEntry = fastStationISD.find(row => 
      row[0] === lastSection && row[2].includes("Entry")
    );
    
    if (lastStationEntry) {
      var finalStation = lastStationEntry[2].split(" ")[0];
      var lastRow = fastStationISD.find(row => 
        row[2].trim() === finalStation
      );
      
      if (lastRow) {
        var lastValue = filteredValues[filteredValues.length - 1][1];
        var newLastRow = [...lastRow];
        newLastRow[1] = lastRow[1] + lastValue;
        filteredValues.push(newLastRow);
      }
    }
  } else {
    // Original functionality for non-fast trains
    var lrow = sheet.getRange("A1").getDataRegion().getLastRow();
    var dataRange = sheet.getRange("A1:C"+lrow);
    var values = dataRange.getValues();
   
    filteredValues = values.filter(function(row) {
      return filterValues.indexOf(row[0]) !== -1;
    });

    filteredValues.sort(function(a, b) {
      return filterValues.indexOf(a[0]) - filterValues.indexOf(b[0]);
    });
    Logger.log(filteredValues)
    // Set the first row of the second column as 0
    filteredValues[0][1] = 0;
    
    // Calculate running total for the second column starting from the second row
    for (var i = 1; i < filteredValues.length; i++) {
      filteredValues[i][1] = filteredValues[i-1][1] + filteredValues[i][1];
    }

    // Add the last row logic (only for non-fast trains)
    var lastMatchRow = -1;
    for (var i = values.length-1; i >= 0; i--) {
      if (filterValues.indexOf(values[i][0]) !== -1 && values[i][0] === filterValues[filterValues.length-1]) {
        lastMatchRow = i;
        break;
      }
    }

    if (lastMatchRow !== -1) {
      var nextRow = lastMatchRow + 1;
      var lastStn = values[nextRow][0].split("-")[0];
      var prevStn = values[lastMatchRow][0].split("-")[1];
      
      if (nextRow < lrow) {
        filteredValues.push(values[nextRow]);
        
        // Modify second column values for the last row
        var lastValue = filteredValues[filteredValues.length - 1][1];
        var secondLastValue = filteredValues[filteredValues.length - 2][1];
        
        if (lastStn == prevStn) {
          filteredValues[filteredValues.length - 1][1] = lastValue + secondLastValue;
        }
      }
    }
  }
  
  // Clear and paste the results
  var outputRange = tempSheet.getRange(2, 1, tempSheet.getLastRow(), 3);
  outputRange.clearContent();
  outputRange = tempSheet.getRange(2, 1, filteredValues.length, 3);
  outputRange.setValues(filteredValues);
}


function duplicateDataRemover(){

  const sheet = SpreadsheetApp.openByUrl(url).getSheetByName("SignalAndSpeed")
   var dataRange = sheet.getRange("A1").getDataRegion()
   var lastRow =  dataRange.getLastRow()
   //Logger.log(lastRow)

            var signalList = sheet.getRange("A2:C"+lastRow).getValues()
            var distDifference = calculateDifferences(signalList)
             Logger.log(distDifference)
             Logger.log(signalList[signalList.length-1])
 
              var lastSignal= signalList.pop()
              Logger.log(lastSignal)
              var tempArr =[]
      for(i=0;i<signalList.length-1;i++){
          var status = signalList[i][0].split("-")[1]===signalList[i+1][0].split("-")[1]
         // Logger.log(status)
          var sigStatus = signalList[i][2]===signalList[i+1][2]
          Logger.log([i,status,sigStatus,signalList[i][2],signalList[i+1][2]])
                    if(!status && sigStatus){
                      
                          var itemToRemove = i 
                          Logger.log(itemToRemove)
                          signalList.splice(itemToRemove,1)
                          distDifference.splice(itemToRemove,1)
                    }
      }

 //signalList.push(lastSignal)
  // if(itemToRemove>=1){
  //   signalList.splice(itemToRemove,1)
  //   distDifference.splice(itemToRemove,1)
  // }
var resultantDist = cumulativeSum(distDifference)
tempArr.push(resultantDist)
var finalSignalList = replaceSecondElement(signalList,tempArr)
  Logger.log(distDifference)
  // Logger.log(signalList)
  // Logger.log(itemToRemove)
  // Logger.log(tempArr)
  // Logger.log(finalSignalList)
  dataRange.clearContent()
  sheet.getRange(2,1,finalSignalList.length,3).setValues(finalSignalList)
}

function calculateDifferences(arr) {
  var result = [arr[0][1]]; // Start with the second element of the first array

  for (var i = 1; i < arr.length; i++) {
    var diff = findDifference(arr[i][1],arr[i - 1][1])     // arr[i][1] - arr[i - 1][1];
    result.push(diff);
  }

  return result;
}
function findDifference(a, b) {
  if (a > b) {
    return a - b;
  } else {
    return b - a;
  }
}
function cumulativeSum(array) {
  const result = [];
  let sum = 0;

  for (let i = 0; i < array.length; i++) {
    sum += array[i];
    result.push(sum);
  }

  return result;
}

function replaceSecondElement(array1, array2) {
  const result = [];

  for (let i = 0; i < array1.length; i++) {
    const subArray = [...array1[i]];
    subArray[1] = array2[0][i];
    result.push(subArray);
  }

  return result;
}

function findoutClosestValuesInSPMData() {
  
  var closestStations = findClosestStations();
  var previousStations = previousDistanceAndStation();
  var result = findClosestValuesInSPMData(closestStations, previousStations);
  var previousStationsWithClosestValues = result.previousStationsWithClosestValues;
  var closestStationsWithClosestValues = result.closestStationsWithClosestValues;
  
 
  Logger.log("Previous Stations with Closest Values:");
  Logger.log(previousStationsWithClosestValues);
  
  // Logger.log("Closest Stations with Closest Values:");
  // Logger.log(closestStationsWithClosestValues);
    return result;
}

function getAndSetStationNamesInSPMData() {
  var result = findoutClosestValuesInSPMData();
  var closestStationsWithClosestValues = result.closestStationsWithClosestValues;
  Logger.log(closestStationsWithClosestValues)
  var previousStationsWithClosestValues = result.previousStationsWithClosestValues;
  var nonHaltingEntries = findClosestNonHaltingStationEntries();
  Logger.log(result)
  Logger.log("debug one")
  Logger.log(closestStationsWithClosestValues)
  setStationNamesInSPMData(closestStationsWithClosestValues, previousStationsWithClosestValues,nonHaltingEntries);
}

function setStationNamesInSPMDatawithtolerenc(closestStationsWithClosestValues, previousStationsWithClosestValues, nonHaltingEntries) {
  var spmDataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  var spmData = spmDataSheet.getDataRange().getValues();
  
  function isCloseEnough(a, b, tolerance = 0.001) {
    return Math.abs(a - b) <= tolerance;
  }
  // Get stations with halt information
  var stationsWithHaltInfo = findClosestStations();
  
  // Create a map of station names to their halt status
  var stationHaltMap = {};
  stationsWithHaltInfo.forEach(station => {
    stationHaltMap[station.station.trim()] = station.isHalt;
  });
  
  // Split stations into halt and non-halt stations
  var haltStations = closestStationsWithClosestValues.filter(station => 
    stationHaltMap[station.station.trim()] === true
  );
  Logger.log("my halts")
  Logger.log(haltStations)
  var nonHaltStations = closestStationsWithClosestValues.filter(station => 
    stationHaltMap[station.station.trim()] === false
  );
  
  // Process halt stations first (unchanged)
  for (var i = 0; i < haltStations.length; i++) {
    var distance = haltStations[i].distance;
    var station = haltStations[i].station;
    
    var count = 0;
    for (var row = 1; row < spmData.length; row++) {
      if (isCloseEnough(Math.round(spmData[row][4]) / 1000, distance)) {
        count++;
      }
    }

    if (count > 1) {
      var targetRow = null;
      for (var row = 1; row < spmData.length; row++) {
       if (Math.abs((Math.round(spmData[row][4]) / 1000) - distance) < 0.01) {
          if (spmData[row][2] == 0 && spmData[row][3] == 0 || 
              ((spmData[row][5].toLowerCase() == "halt" || spmData[row][5].toLowerCase() == "stop"))) {
            targetRow = row + 1;
            break;
          }
        }
      }
      if (targetRow != null) {
        spmDataSheet.getRange(targetRow, 7).setValue(station);
        spmDataSheet.getRange(targetRow, 8).setValue(station);
        spmDataSheet.getRange(targetRow, 9).setValue(20);
      }
    } else {
      for (var row = 1; row < spmData.length; row++) {
       if (Math.abs((Math.round(spmData[row][4]) / 1000) - distance) < 0.01) {
          spmDataSheet.getRange(row + 1, 7).setValue(station);
          spmDataSheet.getRange(row + 1, 8).setValue(station);
          spmDataSheet.getRange(row + 1, 9).setValue(20);
        }
      }
    }

    // Set entry for halt station
    if (entryDistance) {
      for (var row = 1; row < spmData.length; row++) {
        if (Math.abs((Math.round(spmData[row][4]) / 1000) - distance) < 0.01) {
          spmDataSheet.getRange(row + 1, 7).setValue(stationEntry);
          spmDataSheet.getRange(row + 1, 8).setValue(stationEntry);
          spmDataSheet.getRange(row + 1, 9).setValue(40);
          break;
        }
      }
    }
  }
  
  // Get starting index for non-halt stations in previousStationsWithClosestValues
  var startIndex = haltStations.length;
  
  // Process non-halt stations
  for (var i = 0; i < nonHaltStations.length; i++) {
    var distance = nonHaltStations[i].distance;
    var station = nonHaltStations[i].station;
    
    // Find matching non-halting entry
    var matchingEntry = nonHaltingEntries.find(entry => 
      entry.station.replace(/\s+/g, '').includes(station.replace(/\s+/g, ''))
    );

    // Set non-halt station
    for (var row = 1; row < spmData.length; row++) {
      if (Math.round(spmData[row][4]) / 1000 == distance) {
        spmDataSheet.getRange(row + 1, 7).setValue(station);
        spmDataSheet.getRange(row + 1, 8).setValue(station);
        spmDataSheet.getRange(row + 1, 9).setValue(30);
        break;
      }
    }
    
    // Set entry for non-halt station if found
    if (matchingEntry) {
      var entryDistance = findClosestCumulativeDistance(spmData, matchingEntry.distance);
      for (var row = 1; row < spmData.length; row++) {
        if (Math.round(spmData[row][4]) / 1000 == entryDistance) {
          spmDataSheet.getRange(row + 1, 7).setValue(matchingEntry.station);
          spmDataSheet.getRange(row + 1, 8).setValue(matchingEntry.station);
          spmDataSheet.getRange(row + 1, 9).setValue(40);
          break;
        }
      }
    }
  }
}
function setStationNamesInSPMData(closestStationsWithClosestValues, previousStationsWithClosestValues, nonHaltingEntries) {
  var spmDataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  var spmData = spmDataSheet.getDataRange().getValues();
  
  // Extract distances from column 4 (index 4) and store row mapping
  var distanceToRowMap = {};
  var sortedDistances = [];

  for (var row = 1; row < spmData.length; row++) {
    var roundedDistance = Math.round(spmData[row][4]) / 1000;  // Normalize distance
    sortedDistances.push(roundedDistance);
    distanceToRowMap[roundedDistance] = row + 1; // Store row index (+1 for 1-based index)
  }

  // Sort distances (if not already sorted, but should be in this case)
  sortedDistances.sort((a, b) => a - b);

  // Tolerance for distance matching (you can adjust this value)
  const TOLERANCE = 0.001;

  // Binary search function to find closest match
  function binarySearch(target) {
    var left = 0, right = sortedDistances.length - 1;
    while (left <= right) {
      var mid = Math.floor((left + right) / 2);
      var diff = Math.abs(sortedDistances[mid] - target);
      if (diff < TOLERANCE) {
        return sortedDistances[mid]; // Return the closest match if within tolerance
      }
      if (sortedDistances[mid] < target) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return null; // If no close match found
  }

  // Function to update the SPM data
  function updateSPMData(distance, station, value) {
    var closestMatch = binarySearch(distance);
    if (closestMatch !== null) {
      var rowIndex = distanceToRowMap[closestMatch];
      spmDataSheet.getRange(rowIndex, 7).setValue(station);
      spmDataSheet.getRange(rowIndex, 8).setValue(station);
      spmDataSheet.getRange(rowIndex, 9).setValue(value);
    }
  }

  // Process halt stations
  closestStationsWithClosestValues.forEach(stationObj => {
    if (stationObj.station === "VVH") {
      Logger.log("Processing VVH station: " + stationObj.distance);
    }
    updateSPMData(stationObj.distance, stationObj.station, 20);
  });

  // Process previous halt stations
  previousStationsWithClosestValues.forEach(prevStationObj => {
    updateSPMData(prevStationObj.distance, prevStationObj.station, 40);
  });

  // Process non-halt stations
  nonHaltingEntries.forEach(nonHaltObj => {
    updateSPMData(nonHaltObj.distance, nonHaltObj.station, 30);
  });
}

function analyzeBrakingPattern() {
  const dataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SignalAndSpeed");
  const spmDataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  
  const filteredData = filterStationData(dataSheet);
  filteredData.shift()
  const spmData = spmDataSheet.getRange("A2:F" + spmDataSheet.getLastRow()).getValues();
  Logger.log(filteredData)
  const brakingPatterns = [];
  // Updated checkpoints to include all desired distances
  const checkPoints = [300, 130, 100, 75, 50, 25, 20, 15, 10, 5];
  
  // Process each station directly from filtered data
  filteredData.forEach(stationData => {
    const stationName = stationData[2];
    const stationDistanceKm = stationData[1];
    const stationDistanceM = stationDistanceKm * 1000; // Convert to meters
    
    const pattern = createBrakingPatternForStation(stationName, stationDistanceM, spmData, checkPoints);
    if (pattern) {
      brakingPatterns.push(pattern);
    }
  });
  
  Logger.log("Braking patterns found:");
  Logger.log(brakingPatterns[0]);
  return brakingPatterns;
}

function createBrakingPatternForStation(stationName, stationDistance, spmData, checkPoints) {
  const pattern = {
    station: stationName,
    stationDistance: stationDistance
  };
  
  // Get speeds at check points by working backwards from station distance
  checkPoints.forEach(distance => {
    const targetDistance = stationDistance - distance;
    const result = findSpeedAtDistance(spmData, targetDistance);
    if (result) {
      pattern[`speed${distance}m`] = result.speed;
      pattern[`actual${distance}m`] = (stationDistance - result.actualDistance).toFixed(1);
      pattern[`time${distance}m`] = result.timestamp;
    } else {
      pattern[`speed${distance}m`] = null;
      pattern[`actual${distance}m`] = null;
      pattern[`time${distance}m`] = null;
    }
  });
  
  Logger.log(pattern);
  return pattern;
}

function findSpeedAtDistance(spmData, targetDistance) {
  let closestIndex = -1;
  let minDifference = Infinity;
  
  // Find the data point closest to the target distance
  for (let i = 0; i < spmData.length; i++) {
    const difference = Math.abs(spmData[i][4] - targetDistance);
    if (difference < minDifference) {
      minDifference = difference;
      closestIndex = i;
    }
  }
  
  if (closestIndex !== -1) {
    return {
      speed: spmData[closestIndex][2],
      actualDistance: spmData[closestIndex][4],
      timestamp: spmData[closestIndex][0] + " " + spmData[closestIndex][1]
    };
  }
  
  return null;
}

function createBrakingPattern(haltInfo, spmData, haltIndex, checkPoints) {
  const pattern = {
    station: haltInfo.station,
    haltDistance: haltInfo.distance,
    timestamp: haltInfo.timestamp
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
  Logger.log(pattern);
  return pattern;
}
function checkOverspeeding() {
  const sheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  const data = sheet.getRange("A2:E" + sheet.getLastRow()).getValues();  // Fetch trip data
  const segments = modifyPSRArray();  // Get segment data
  
  let overspeedingRecords = [];

  data.forEach(row => {
    const date = row[0];
    const time = row[1];
    const actualSpeed = row[2];
    const cumDist = row[4];  // Column E (Cumulative Distance)

    // Find which segment the cumulative distance falls into
    const segment = segments.find(seg => cumDist >= seg[1] && cumDist <= seg[2]);

    if (segment) {
      const segmentName = segment[0];  // Segment name (e.g., PNVL-KNDS)
      const allowedSpeed = segment[4];  // Speed limit

      // Compare actual speed with allowed speed
      if (actualSpeed > allowedSpeed+3) {
        overspeedingRecords.push([ date,time,cumDist, actualSpeed, allowedSpeed, segmentName]);
      }
    }
  });
//  var repsheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Reports");
//   repsheet.getRange(50,1,sectionsList.length,sectionsList[1].length).setValues(sectionsList)
  if (overspeedingRecords.length > 0) {
    Logger.log("Overspeeding Detected:");
    overspeedingRecords.forEach(record => Logger.log(record));
    Logger.log(overspeedingRecords.length)
  } else {
    Logger.log("No overspeeding detected.");
  }
  return overspeedingRecords
  
}

function isNewHalt(currentHalt, lastProcessedHalt, tolerance) {
  if (!lastProcessedHalt.distance) return true;
  
  const distanceDiff = Math.abs(currentHalt.distance - lastProcessedHalt.distance);
  return distanceDiff > tolerance || currentHalt.station !== lastProcessedHalt.station;
}
function findSpeedAtClosestDistance(data, haltIndex, targetDistance) {
    const haltCumDist = data[haltIndex][4];
    const desiredCumDist = haltCumDist - targetDistance;
    
    let closestIndex = -1;
    let minDifference = Infinity;
    
    // Search backwards from halt point to find closest match
    for (let i = haltIndex; i >= 0; i--) {
      const difference = Math.abs(data[i][4] - desiredCumDist);
      if (difference < minDifference) {
        minDifference = difference;
        closestIndex = i;
      }
      
      // If we've gone too far back (beyond our target + some buffer), stop searching
      if (data[i][4] < desiredCumDist - 50) {
        break;
      }
    }
    
    if (closestIndex !== -1) {
      return {
        speed: data[closestIndex][2],
        actualDistance: haltCumDist - data[closestIndex][4],
        timestamp: data[closestIndex][0] + " " + data[closestIndex][1]
      };
    }
    
    return null;
  }
function findOverspeedingInstances() {
  const data = checkOverspeeding();
  let overspeedingInstances = [];
  let currentInstance = [];
  
  Logger.log(data);
  
  // Return early with "No Violations" if no data
  if (!data || data.length === 0) {
    return [['','','',"No Violations", "-"]];
  }
  
  // Keep minimum sequence length at 5
  const MIN_SEQUENCE_LENGTH = 5;
  
  for (let i = 0; i < data.length; i++) {
    const currentRow = data[i];
    const nextRow = data[i + 1];
    
    // Add current row to instance
    currentInstance.push(currentRow);
    
    // Check if this is the end of a continuous overspeeding instance
    if (
      // If this is the last row
      !nextRow ||
      // Or if there's a gap in continuous readings (more than 1 second difference)
      (nextRow && Math.abs(nextRow[2] - currentRow[2]) > 100) ||
      // Or if we're switching to a different segment
      (nextRow && nextRow[5] !== currentRow[5])
    ) {
      // Only record instances that are 5 seconds or longer
      if (currentInstance.length >= MIN_SEQUENCE_LENGTH) {
        const startTime = currentInstance[0][1];
        const endTime = currentInstance[currentInstance.length - 1][1];
        const duration = currentInstance.length;
        const allowedSpeed = currentInstance[0][4];
        const maxSpeed = Math.max(...currentInstance.map(row => row[3]));
        
        overspeedingInstances.push([
          startTime,
          endTime,
          duration,
          allowedSpeed,
          maxSpeed
        ]);
        
        Logger.log(`Instance detected:`);
        Logger.log(`Time: From ${startTime} to ${endTime}`);
        Logger.log(`Duration: ${duration} seconds`);
        Logger.log(`Max Speed: ${maxSpeed} km/h`);
        Logger.log(`Allowed Speed: ${allowedSpeed} km/h`);
        Logger.log('------------------------');
      }
      
      // Reset the current instance
      currentInstance = [];
    }
  }
  
  Logger.log(overspeedingInstances);
  Logger.log("Final Overspeeding Instances: " + JSON.stringify(overspeedingInstances));
  
  // Return the no violations message if we still have no instances
  if (overspeedingInstances.length === 0) {
    return [['','','',"No Violations", "-"]];
  }
  
  return overspeedingInstances;
}


function getFormattedData() {
  // Open the spreadsheet and get the sheet by name
  var sheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  
  // Get the data range and values from the sheet
  var dataRange = sheet.getDataRange();
  var data = dataRange.getValues();
  
  // Initialize an array to hold the formatted data
  var formattedData = [];
  
  // Add the header row with single quotes
  formattedData.push(["'cum dist'", "'station'", "'speed'", "'psr'", "'tsr'", "'location'", "'location label'"]);

  // Loop through the data starting from the second row (index 1) to skip the header
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    
    // Extract the required columns and handle empty cells
    var cumDist = row[4] !== "" ? row[4] : "''"; // Cum Dist (Column E)
    var station = row[8] !== "" ? "'" + row[8] + "'" : "''"; // Station (Column I)
    var speed = row[2] !== "" ? row[2] : "''"; // Speed (Column C)
    var psr = row[10] !== "" ? row[10] : "''"; // PSR (Column K)
    var tsr = row[11] !== "" ? row[11] : "''"; // TSR (Column L)
    var location = row[6] !== "" ? "'" + row[6] + "'" : "''"; // Location (Column G)
    var locationLabel = row[7] !== "" ? "'" + row[7] + "'" : "''"; // Location Label (Column H)
    
    // Push the extracted data into the formattedData array
    formattedData.push([cumDist, station, speed, psr, tsr, location, locationLabel]);
  }
  
  // Log the formatted data to the console (for debugging purposes)
  console.log(formattedData);
  
  // Return the formatted data
  return formattedData;
}


function getSPMDataForChart() {
  
  var sheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  Logger.log(url)
  var dataRange = sheet.getRange("A2:L"+sheet.getLastRow());
  var data = dataRange.getValues();
  Logger.log(data.length)
  var headers = ['Distance', 'Station', 'Speed Line', 'Max Speed Limit', 'TSR', 'Label1', 'Label2'];
  var output = [headers];
  
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    
    // Convert numerical values to numbers and ensure proper handling of empty cells
    var outputRow = [
      Number(row[4]) || 0,  // Convert to number, default to 0 if NaN
      row[8] === "" ? null : Number(row[8]),  // Convert to number, null if empty
      Number(row[9]) || 0,
      Number(row[10]) || 0,
      row[11] === "" ? 0 : Number(row[11]),  // TSR can be null if empty --null changed to 0 14/1/25
      row[6] || "",  // No need for extra quotes
      row[7] || ""   // No need for extra quotes
    ];
    output.push(outputRow);
  }
  
  Logger.log(output);
  return output;
}




/**
 * Finds the last image row in the destReportSheet
 */
function getLastImageRow(sheet) {

  var destSheet = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/1u5VPXl4AddgUox6JLiCm8m4Rv9RLYgvKa3_T98wMWSo/edit?gid=1526749896#gid=1526749896")
  var destReportSheet = destSheet.getSheetByName("Reports")
  sheet = destReportSheet
  var images = sheet.getImages();
  if (images.length === 0) return 0;
  
  
  var lastImage = images[images.length - 1];
  Logger.log(lastImage.getAnchorCell().getRow())
  //return lastImage.getAnchorCell().getRow(); // Get the last image's row
  for(let i=0;i<images.length;i++){
    images[i].remove()

  }
}


function getDataForChart() {
  var sheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  var dataRange = sheet.getRange("A1100:L2000");
  var data = dataRange.getValues();
  
  // Create headers with ' ' symbol for text columns
  var headers = [
    'Cum Dist', 'Location Label', 'Station', 'Speed for Chart', 'PSR', 'Halt', 'Location'
  ];
  
  // Map data to desired columns
  var chartData = data.map(function(row, index) {
    if (index === 0) return headers; // Return headers for first row
    return [
      row[4], // Cum Dist
      row[8], // Location Label
      row[9], // Station
      row[10], // Speed for Chart
      row[11], // PSR
      (row[6] === "" ? "''" : "'" + row[6] + "'"), // Halt with ' ' symbol
      (row[7] === "" ? "''" : "'" + row[7] + "'")  // Location with ' ' symbol
    ];
  });
  
  Logger.log(chartData)
  return chartData;
}


function getStationRowNumbers() {
  var sheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  var dataRange = sheet.getRange("A1:L"+sheet.getLastRow());
  var data = dataRange.getValues();
  
  var stationList = finalRoutesList();
  var stationRowNumbers = [];
  
  for (var i = 0; i < stationList.length; i++) {
    for (var j = 0; j < data.length; j++) {
      if (data[j][6] === stationList[i]) {
        stationRowNumbers.push(j + 1); // +1 because array indices start at 0
        break;
      }
    }
  }
  Logger.log(stationRowNumbers)
  return stationRowNumbers;
}

function getDataBlock(startRow, endRow) {
  var sheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  var dataRange = sheet.getRange(startRow, 1, endRow - startRow + 1, 12);
  
  if (!dataRange) {
    throw new Error("Data range not found");
  }
  
  var data = dataRange.getValues();
  
  var headers = ['Distance', 'Station', 'Speed Line', 'Max Speed Limit', 'TSR', 'Label1', 'Label2'];
  var output = [headers];
  
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var outputRow = [
      Number(row[4]) || 0,
      row[8] === "" ? null : Number(row[8]),
      Number(row[9]) || 0,
      Number(row[10]) || 0,
      row[11] === "" ? null : Number(row[11]),
      row[6] || "",
      row[7] || ""
    ];
    output.push(outputRow);
  }
  
  return output;
}

function getDataForStationBlock(stationBlockIndex) {
  
  var stationRowNumbers = getStationRowNumbers();
  if (!stationRowNumbers) {
    throw new Error("Station row numbers not found");
  }
  
  var startRow = stationRowNumbers[stationBlockIndex * 4];
  Logger.log(startRow)
  
  // If this is the first block, start from row 1
  if (stationBlockIndex === 0) {
    startRow = 2;
  }
  
  var endRow = stationRowNumbers[(stationBlockIndex + 1) * 4 - 1];
  
  if (!startRow || !endRow) {
    throw new Error("Invalid start or end row");
  }
  Logger.log(getDataBlock(startRow, endRow))
  return getDataBlock(startRow, endRow);
}
function getPaginatedData(pageNumber) {
  var stationList = finalRoutesList();
  var stationsPerPage = 4;
  var startStationIndex = (pageNumber - 1) * stationsPerPage;
  var endStationIndex = startStationIndex + stationsPerPage - 1;
  
  var startStation = stationList[startStationIndex];
  var endStation = stationList[endStationIndex];
  
  return getDataBlock(startStation, endStation);
}


function getLatestAnalysisData() {
  const ss = SpreadsheetApp.openByUrl(url);
  const sheet = ss.getSheetByName("Database");
  const lastRow = sheet.getLastRow();
  
  // Get the last row data
  const data = sheet.getRange(lastRow, 1, 1, 13).getValues()[0];
  
  // Create an object with the data
  const analysisData = {
    dateWorking: formatDate(data[0]),     // Column A
    mmanId: data[1],                      // Column B
    mmanName: data[2],                    // Column C
    trainNumber: data[3],                 // Column D
    fromStation: data[4],                 // Column E
    toStation: data[5],                   // Column F
    unitNumber: data[6],                  // Column G
    rake: data[7],                        // Column H
    shed: data[8],                        // Column I
    ncli: data[9],                        // Column J
    analysedBy: data[10],                 // Column K
    dateAnalysis: formatDate(data[11]),    // Column L
    trainType:data[12]
  };
  
  return analysisData;
}

// Helper function to format date
function formatDate(date) {
  if (!date) return '';
  return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'dd/MM/yyyy');
}
function createBrakingReport() {
  var ss = SpreadsheetApp.openByUrl(url);
  var destSheet = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/1NniWYZ3oXRhCYmdKR_8T8PBEFDYDHMaB97aePvRLSSQ/edit?gid=1526749896#gid=1526749896");
  var reportSheet = ss.getSheetByName("Sheet10");
  var destReportSheet = destSheet.getSheetByName("Reports");
  
  // Get braking patterns
  var brakingData = analyzeBrakingPattern();
  
  // Clear existing content if needed
  // reportSheet.clear();
  
  // Updated headers with all the data points
  const headers = ["Station", "300m", "130m", "100m", "75m", "50m", "25m", "20m", "15m", "10m", "5m", "Halt"];
  const STATIONS_PER_SECTION = 4;
  
  // Format data into sections with headers
  let formattedData = [];
  for (let i = 0; i < brakingData.length; i += STATIONS_PER_SECTION) {
    // Add headers for each section
    formattedData.push(headers);
    
    // Add station data for this section
    const sectionData = brakingData.slice(i, i + STATIONS_PER_SECTION).map(pattern => [
      pattern.station,
      pattern.speed300m || "",
      pattern.speed130m || "",
      pattern.speed100m || "",
      pattern.speed75m || "",
      pattern.speed50m || "",
      pattern.speed25m || "",
      pattern.speed20m || "",
      pattern.speed15m || "",
      pattern.speed10m || "",
      pattern.speed5m || "",
      0  // Halt speed is always 0
    ]);
    formattedData = formattedData.concat(sectionData);
    
    // Add a blank row between sections (optional)
    formattedData.push(Array(12).fill(""));  // Updated array length to match number of columns
  }
  
  // Write all data at once
  if (formattedData.length > 0) {
    // reportSheet.getRange(13, 3, formattedData.length, 12).setValues(formattedData);
    destReportSheet.getRange(13, 3, formattedData.length, 12).setValues(formattedData);
  }
  Logger.log(formattedData)
  return formattedData;
}

function pasteReportsToSheet(){

const dataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("Database");
const reportDataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("Sheet10");
var destSheet = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=1526749896#gid=1526749896")
var destReportSheet = destSheet.getSheetByName("Reports")
const lr = dataSheet.getLastRow();
const tripData = dataSheet.getRange(lr,1,1,14).getValues();


destReportSheet.getRange("C14:N17").clearContent();
destReportSheet.getRange("C20:N23").clearContent();
destReportSheet.getRange("C26:N29").clearContent();
destReportSheet.getRange("C32:N35").clearContent();
destReportSheet.getRange("C38:N41").clearContent();
destReportSheet.getRange("C44:N47").clearContent();
destReportSheet.getRange("C50:N53").clearContent();

const brakingProfile =createBrakingReport()

destReportSheet.getRange("D4").setValue(tripData.flat()[11])
destReportSheet.getRange("D5").setValue(tripData.flat()[10])
destReportSheet.getRange("D6").setValue(tripData.flat()[1])
destReportSheet.getRange("D7").setValue(tripData.flat()[2])
destReportSheet.getRange("D9").setValue(tripData.flat()[9])
destReportSheet.getRange("D10").setValue(tripData.flat()[0])
destReportSheet.getRange("H4").setValue(tripData.flat()[3])			
destReportSheet.getRange("H5").setValue(tripData.flat()[6])
destReportSheet.getRange("H6").setValue(tripData.flat()[8])
destReportSheet.getRange("H7").setValue(tripData.flat()[4])
destReportSheet.getRange("H8").setValue(tripData.flat()[5])
destReportSheet.getRange("H9").setValue(tripData.flat()[7])
destReportSheet.getRange("H10").setValue(tripData.flat()[12])


destReportSheet.getRange(13,3,brakingProfile.length,brakingProfile[1].length).setValues(brakingProfile)

const travelStats = getTravelStats()
const maxSpeed = travelStats.maxSpeed
const totalDistance = travelStats.totalDistance/1000
const totalTime= travelStats.totalTime
const depTime=travelStats.depTime
const arrTime=travelStats.arrTime
destReportSheet.getRange("L4").setValue(depTime)
destReportSheet.getRange("L5").setValue(arrTime)
destReportSheet.getRange("L6").setValue(maxSpeed)
destReportSheet.getRange("L7").setValue(totalTime)
destReportSheet.getRange("L8").setValue(totalDistance)
}
function reportOfOverspeeding() {
  const overSpeedData = findOverspeedingInstances();
  const destSheet = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=1526749896#gid=1526749896");
  const destReportSheet = destSheet.getSheetByName("Reports");
  const headers = [["From Time", "To Time", "Duration(seconds)", "Allowed Speed(km/h)", "Actual Speed(km/h)"]];
  
  Logger.log(overSpeedData);
  
  // Write headers
  destReportSheet.getRange(72, 9, 1, 5).setValues(headers);
  
  // Check if we have data before trying to write it
  if (overSpeedData && overSpeedData.length > 0) {
    destReportSheet.getRange(73, 9, overSpeedData.length, 5).setValues(overSpeedData);
  } else {
    // Write a default "No violations" row if no data
    destReportSheet.getRange(73, 9, 1, 5).setValues([['','','',"No Violations", "-"]]);
  }
}



function createLineChartsInSheet() {
  var ss = SpreadsheetApp.openByUrl(url);
  var reportDataSheet = ss.getSheetByName("Sheet10"); // Sheet where data is pasted
  var brakingData = reportDataSheet.getRange("C13:G" + reportDataSheet.getLastRow()).getValues(); // Get braking data

  const HALTS_PER_CHART = 4; // Number of stations per chart
  const numberOfCharts = Math.ceil((brakingData.length - 1) / HALTS_PER_CHART); // Subtract 1 for headers

  // Loop through each chart segment
  for (let chartIndex = 0; chartIndex < numberOfCharts; chartIndex++) {
    const startIndex = chartIndex * HALTS_PER_CHART + 1; // Skip header row
    const endIndex = Math.min(startIndex + HALTS_PER_CHART, brakingData.length);
    const chartPatterns = brakingData.slice(startIndex, endIndex);

    // Create a data table for this chart
    const dataTable = [["Distance"].concat(chartPatterns.map(pattern => pattern[0]))]; // Add headers

    // Add rows for each distance (300m, 130m, 25m, Halt)
    const distances = ["300m", "130m", "25m", "Halt"];
    distances.forEach((distance, rowIndex) => {
      const row = [distance];
      chartPatterns.forEach((pattern) => {
        row.push(pattern[rowIndex + 1]); // Add speed values for each station
      });
      dataTable.push(row);
    });

    // Transpose the data table to match the required format
    const transposedDataTable = transposeDataTable(dataTable);

    // Create a new sheet for the transposed data (temporary)
    const chartDataSheet = ss.insertSheet(`ChartData_${chartIndex}`);
    chartDataSheet.getRange(1, 1, transposedDataTable.length, transposedDataTable[0].length).setValues(transposedDataTable);

    // Create a new chart for this segment
    var chart = chartDataSheet.newChart()
      .asLineChart()
      .addRange(chartDataSheet.getRange(1, 1, transposedDataTable.length, transposedDataTable[0].length)) // Use transposed data
      .setOption("useFirstColumnAsDomain", true)
      .setOption("title", `Speed vs Distance`)//(Stations ${startIndex} to ${endIndex - 1})
      .setOption("hAxis", {
        title: "Distance",
        titleTextStyle: { bold: true },
      })
      .setOption("vAxis", {
        title: "Speed",
        titleTextStyle: { bold: true },
        viewWindow: { min: 0, max: 50 },
      })
      .setOption("curveType", "function")
      .setOption("lineWidth", 3)
      .setOption("pointSize", 5)
      .setOption("legend", { position: "top" })
      .setPosition((chartIndex * 20) + 1, 1, 0, 0) // Position charts one below the other
      .build();

    // Insert the chart into the sheet
    chartDataSheet.insertChart(chart);

    // Move the chart to the main report sheet
    var chartCopy = chart.copy();
    reportDataSheet.insertChart(chartCopy);

    // Delete the temporary chart data sheet
    ss.deleteSheet(chartDataSheet);
  }
}

// Helper function to transpose the data table
function transposeDataTable(dataTable) {
  return dataTable[0].map((_, colIndex) => dataTable.map(row => row[colIndex]));
}

function createBrakingLineCharts() {
  const ss = SpreadsheetApp.openByUrl(url);
  const sheet = ss.getSheetByName("Sheet10");
  
  const dataRange = sheet.getRange("C13:G" + sheet.getLastRow());
  const rawData = dataRange.getValues();
  
  // Colors for stations
  const colors = ['#4285f4', '#ea4335', '#fbbc05', '#34a853'];
  
  let chartIndex = 0;
  let startRow = 13;
  
  while (startRow < sheet.getLastRow()) {
    // Identify the start of the data section
    while (startRow < sheet.getLastRow() && rawData[startRow - 13][0] === "") {
      startRow++;
    }
    
    // Find the end of the current data section
    let endRow = startRow + 1;
    while (endRow < sheet.getLastRow() && rawData[endRow - 13][0] !== "") {
      endRow++;
    }
    
    // Ensure we have valid data
    if (startRow >= sheet.getLastRow()) {
      break;
    }
    
    // Define the range for this chart section (including headers)
    const chartRange = sheet.getRange(startRow, 3, endRow - startRow + 1, 5); // Including column C (Station)
    
    // Create the chart
    const chart = sheet.newChart()
      .asLineChart()
      .addRange(chartRange)
      .setPosition(5 + (chartIndex * 25), 8, 0, 0)
      .setOption('title', `Speed vs Distance`)//(Stations ${startRow - 13} to ${endRow - 14})
      .setOption('width', 800)
      .setOption('height', 400)
      .setOption('curveType', 'function')
      .setTransposeRowsAndColumns(true) // Switch rows/columns
      .setOption('useFirstColumnAsHeaders', true) // Use column C as headers
      .setOption('legend', { position: 'right' }) // Legend visible on all charts
      .setOption('hAxis', {
        title: 'Distance',
        titleTextStyle: { bold: true },
        ticks: ['300m', '130m', '25m', 'Halt']
      })
      .setOption('vAxis', {
        title: 'Speed',
        titleTextStyle: { bold: true },
        viewWindow: {
          min: 0,
          max: 40
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

function createBrakingLineChartsInDestinationSheet() {
  const ss = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=1526749896#gid=1526749896");
  const sheet = ss.getSheetByName("Reports");
  
  const dataRange = sheet.getRange("C13:N" + sheet.getLastRow());
  const rawData = dataRange.getValues();

  var charts = sheet.getCharts();

  

  for (var i = 0; i < charts.length; i++) {

    sheet.removeChart(charts[i]);

  }
  
  // Colors for stations
  const colors = ['#4285f4', '#ea4335', '#fbbc05', '#34a853'];
  
  let chartIndex = 0;
  let startRow = 13;
  
  while (startRow < sheet.getLastRow()) {
    // Identify the start of the data section
    while (startRow < sheet.getLastRow() && rawData[startRow - 13][0] === "") {
      startRow++;
    }
    
    // Find the end of the current data section
    let endRow = startRow + 1;
    while (endRow < sheet.getLastRow() && rawData[endRow - 13][0] !== "") {
      endRow++;
    }
    
    // Ensure we have valid data
    if (startRow >= sheet.getLastRow()) {
      break;
    }
    
    // Define the range for this chart section (including headers)
    const chartRange = sheet.getRange(startRow, 3, endRow - startRow + 1, 12); // Including column C (Station)
    
    // Create the chart
    const chart = sheet.newChart()
      .asLineChart()
      .addRange(chartRange)
      .setPosition(60 + (chartIndex * 15), 2, 0, 0)
      .setOption('title', `Speed vs Distance`) // (`Stations ${startRow - 13} to ${endRow - 14})`)
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
          max: 50
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

function getBottomOfExistingCharts(sheet) {

  const ss = SpreadsheetApp.openByUrl(url)//("https://docs.google.com/spreadsheets/d/1NniWYZ3oXRhCYmdKR_8T8PBEFDYDHMaB97aePvRLSSQ/edit?gid=1526749896#gid=1526749896");
 sheet = ss.getSheetByName("Sheet10");
  // Get all charts in the sheet.
  const charts = sheet.getCharts();

  

  if (charts.length === 0) {
    return 1; // No charts, start at row 1.
  }

  let maxBottomRow = 0;

  // Iterate through each chart to find the chart furthest down the sheet.
  charts.forEach(chart => {
    const position = chart.getPosition();
    const topRow = position.getRow();
    const heightInRows = position.getHeight(); // This height is in units that correspond roughly to row height but isn't exact.
    const bottomRow = topRow + heightInRows;

    maxBottomRow = Math.max(maxBottomRow, bottomRow);
  });
Logger.log(maxBottomRow)
  return maxBottomRow + 1; // Return the row *below* the bottom-most chart.
}


function getChartRowNumber(){

  const ss = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=1526749896#gid=1526749896");
 sheet = ss.getSheetByName("Reports");
 var lastChart = getLastChart(sheet);
 

var chartPosition = getChartPosition(lastChart); 
const width = lastChart.getOptions().get('width');
Logger.log(width)
console.log("Chart position: Row " + chartPosition.row + ", Column " + chartPosition.column);
}

function getLastChart(sheet) {
  var charts = sheet.getCharts();
  return charts[charts.length - 1]; // Return the last chart
}
function getChartPosition(chart) {
  var containerInfo = chart.getContainerInfo(); // Get the container information
  var anchorRow = containerInfo.getAnchorRow(); // Row of the anchor cell
  var anchorCol = containerInfo.getAnchorColumn(); // Column of the anchor cell
  return { row: anchorRow, column: anchorCol };
}


function createComboChartSections() {
  var destSheet = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=1526749896#gid=1526749896");
  var destReportSheet = destSheet.getSheetByName("Reports");

  removeExistingImages(destReportSheet)
  var spmDataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  var dataRange = spmDataSheet.getRange("G2:L" + spmDataSheet.getLastRow());
  var data = dataRange.getValues();
  var headers = spmDataSheet.getRange("G1:L1").getValues()[0];

  const ROWS_PER_CHART = 1100; // Adjust as needed..changed 800 to 1100 on 23/05/25
  let startIndex = 0;
  let chartIndex = 0;

  // Find last chart's row and set image row placement accordingly
  var lastChart = getLastChart(destReportSheet);
  var imgRow = lastChart ? getChartPosition(lastChart).row + Math.ceil(lastChart.getOptions().get('height') / 20) + 1 : 2;

  while (startIndex < data.length) {
    let endIndex = Math.min(startIndex + ROWS_PER_CHART, data.length);

    // Ensure we don't cut off in the middle of a station
    while (endIndex < data.length - 1 && data[endIndex][0] === data[endIndex + 1][0]) {
      endIndex++;
    }

    var chartSegment = [headers].concat(data.slice(startIndex, endIndex));

    var chart = spmDataSheet.newChart()
      .asComboChart()
      .addRange(spmDataSheet.getRange(`G${startIndex + 2}:L${endIndex + 1}`))
      .setOption("useFirstColumnAsDomain", true)
      .setOption("series", {
        0: { type: "bars", color: 'brown', lineWidth: 50 },
        2: { type: "steppedArea", color: 'lightgreen' },
        3: { type: "steppedArea", color: 'blue' },
      })
      .setOption('width', 975)
      .setOption('legend', 'none')
      .setOption('isStacked', false)
      .setOption('vAxis', {
        ticks: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110],
        gridlines: { count: 12, color: 'lightgray' }
      })
      .setPosition((chartIndex * 20) + 1, 1, 0, 0) // Position in source sheet
      .build();

    spmDataSheet.insertChart(chart);
     
    // Convert chart to image and insert in Reports sheet
    var blob = chart.getAs('image/png');
    var img = destReportSheet.insertImage(blob, 1, imgRow);

    imgRow += Math.ceil(img.getHeight() / 20) + 1; // Convert pixels to rows, then increment for next image

    startIndex = endIndex;
    chartIndex++;
  }
}

function removeExistingImages(sheet) {

  var images = sheet.getImages();
  if (images.length === 0) return 0;
  
  for(let i=0;i<images.length;i++){
    images[i].remove()
  }
}


function getTravelStats() {
// Get the data from the spreadsheet.
var ss = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=1526749896#gid=1526749896");;
var sheet = ss.getSheetByName("SPMDATA")
var data = sheet.getRange("A2:E" + sheet.getLastRow()).getValues();
var depTime = sheet.getRange("B2").getValue()
var arrTime = sheet.getRange("B"+sheet.getLastRow()).getValue()
Logger.log(data.length)
// Find the maximum speed.
var maxSpeed = 0;
for (var i = 0; i < data.length; i++) {
if (data[i][2] > maxSpeed) {
maxSpeed = data[i][2];
}
}

// Find the total distance travelled.
var totalDistance = (data[data.length - 1][4])
var totalTime = 0;
for (var i = 0; i < data.length - 2; i++) {
  var startTime = data[i][1].getTime(); // Convert to milliseconds
  var endTime = data[i + 1][1].getTime(); // Convert to milliseconds

  // Check if the end time is less than the start time (indicating a date change).
  if (endTime < startTime) {
    endTime += 24 * 60 * 60 * 1000; // Add 24 hours (in milliseconds) to the end time.
  }

  totalTime += endTime - startTime;
}

totalTime=formatTime(totalTime)
 Logger.log(depTime)
Logger.log(maxSpeed)
Logger.log(totalDistance/1000)
Logger.log(totalTime)

// Return the results.
return {
maxSpeed: maxSpeed,
totalDistance: totalDistance,
totalTime: totalTime,
depTime:depTime,
arrTime:arrTime
};
}


function formatTime(milliseconds) {
  var hours = Math.floor(milliseconds / (1000 * 60 * 60));
  var minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
  
  var formattedTime = "";
  if (hours > 0) {
    formattedTime += hours + "h ";
  }
  if (minutes > 0) {
    formattedTime += minutes + "m ";
  }
  if (seconds > 0) {
    formattedTime += seconds + "s";
  }
  
  return formattedTime;
}


function findChartsToDelete() {
  const ss = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=1526749896#gid=1526749896")
  const checkSheet = ss.getSheetByName("Reports"); // Replace with your actual sheet name
  
  let chartIdToDelete = [];
  const charts = checkSheet.getCharts();

  charts.forEach(chart => {
    const chartTitle = chart.getOptions().get("title");; //Chart title
    const chartId = chart.getChartId();  // **USE getChartId() since getId() returns null**
    const ranges = chart.getRanges();

    for (const range of ranges) {
      const startRow = parseInt(range.getRow());
      Logger.log(startRow)
      const checkRow = checkSheet.getRange("D" + (startRow+1));
      const isRowBlank = checkRow.isBlank();
      Logger.log(`Chart: ${chartTitle}, ID: ${chartId}, Row: ${startRow}, Range: ${range.getA1Notation()}, Is Blank: ${isRowBlank}`);

      if (!isRowBlank) {
        Logger.log(`Row ${startRow} in column D is NOT blank, skipping delete.`);
        return;  // Skip to the next chart
      }
    }

    Logger.log(`Chart ${chartTitle} has all specified rows blank. Adding to delete list. ID: ${chartId}`);
    chartIdToDelete.push(chartId);
  });

  // Log the charts to delete (for verification)
  Logger.log("Charts to Delete:");
  Logger.log(chartIdToDelete);

  // Delete the charts (after careful verification!)
  deleteCharts(checkSheet, chartIdToDelete);
}

function deleteCharts(sheet, chartIds) {
    chartIds.forEach(chartId => {
        const charts = sheet.getCharts();  //Get array of chart
        //const chart = sheet.getCharts().find(c => c.getId() === chartId); //wrong, as c.getId will null
        //Use ChartID to find the correct chart.
        const chart = charts.find(c => c.getChartId() === chartId);  // find the correct chart with same ID
        if (chart) {
            sheet.removeChart(chart);
            Logger.log(`Chart with ID ${chartId} deleted.`);
        } else {
            Logger.log(`Chart with ID ${chartId} not found on the sheet.`);
        }
    });
}




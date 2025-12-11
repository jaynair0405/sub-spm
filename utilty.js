function updateSpmSheet() {
  const tsrData = getTSRData();
  const oheData = getOheDataForSections();
  const combinedData = getCombinedData(tsrData, oheData);

  const spmSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM DATA");
  const spmData = spmSheet.getDataRange().getValues();
  const spmCumulativeDistances = spmData.map(row => row[4]); // column E is index 4
   spmSheet.getRange("L2:L"+spmSheet.getLastRow()).clearContent();
  combinedData.forEach(data => {
    const fromIndex = findClosestIndex(spmCumulativeDistances, data.fromCumulativeDistance);
    const toIndex = findClosestIndex(spmCumulativeDistances, data.toCumulativeDistance+260);
    Logger.log(toIndex)
    if (fromIndex !== null && toIndex !== null) {
      for (let i = fromIndex; i <= toIndex; i++) {
        spmData[i][11] = data.speed; // column L is index 11
      }
    }
  });

  for (let i = 0; i < spmData.length; i++) {
    spmSheet.getRange(i + 1, 12).setValue(spmData[i][11]);
  }
}

function findClosestIndex(arr, target) {
  if (target === null) return null;

  let closestIndex = null;
  let closestDistance = Infinity;

  arr.forEach((value, index) => {
    const distance = Math.abs(value - target);
    if (distance < closestDistance) {
      closestIndex = index;
      closestDistance = distance;
    }
  });

  return closestIndex;
}

function getOheDataForSections() {
  const { oheSheet } = pastDataSheetSelector();
  const oheSheetData = oheSheet.getDataRange().getValues();

  if (oheSheetData.length < 2) {
    Logger.log("OHE sheet is empty or has no data.");
    return [];
  }

  const headers = oheSheetData[0];
  const sectionIndex = headers.indexOf("Section");

  if (sectionIndex === -1) {
    Logger.log("Column 'Section' not found in OHE sheet.");
    return [];
  }

  const targetSections = clubStationsForTrip();
  const matchingRows = oheSheetData.slice(1).filter(row => targetSections.includes(row[sectionIndex]));
  matchingRows.unshift(headers); // Add header row to the filtered data

  Logger.log("Matching OHE rows: " + matchingRows.length);
  Logger.log(matchingRows[matchingRows.length - 1]);

  return matchingRows;
}

function getCombinedData(tsrData, oheData) {
  const oheStructureNumbers = oheData.slice(1).map(row => row[1]);
  const oheCumulativeDistances = oheData.slice(1).map(row => row[3]);

  return tsrData.map(tsr => {
    const normalizedFrom = tsr.from;
    const normalizedTo = tsr.to;
    const fromIndex = oheStructureNumbers.map(normalizeStructureId).indexOf(normalizedFrom);
    const toIndex = oheStructureNumbers.map(normalizeStructureId).indexOf(normalizedTo);

    return {
      from: tsr.from,
      fromCumulativeDistance: fromIndex !== -1 ? oheCumulativeDistances[fromIndex] : null,
      to: tsr.to,
      toCumulativeDistance: toIndex !== -1 ? oheCumulativeDistances[toIndex] : null,
      span: tsr.span,
      speed: tsr.speed
    };
  });
}
function getTSRData() {
  const tsrSheet = SpreadsheetApp.openByUrl(url).getSheetByName("TSR Data");
  const lr = tsrSheet.getLastRow();
  if (lr <= 1) return [];

  const tsrData = tsrSheet.getRange(2, 1, lr - 1, 4).getValues();

  // Filter out rows missing From, To, or Speed
  const validTSRData = tsrData.filter(row => row[0] && row[1] && row[3]);

  // Normalize From/To fields
  const normalizedTSR = validTSRData.map(row => {
    const fromNorm = normalizeStructureId(row[0]);
    const toNorm = normalizeStructureId(row[1]);
    return {
      from: fromNorm,
      to: toNorm,
      span: row[2],
      speed: row[3]
    };
  });

  return normalizedTSR;
}


function normalizeStructureId(raw) {
  if (!raw) return '';

  let str = String(raw).trim();

  // Replace dot, dash, space with slash
  str = str.replace(/[\.\-\s]/g, '/');

  // Remove any letter (e.g., H) before slash (e.g., 34H/128 -> 34/128)
  str = str.replace(/([0-9]+)[A-Za-z]+\/([0-9]+)/, '$1/$2');
// Logger.log(str)
  return str;
}

function compareArrays(baseArray, comparisonArrays) {
    // Function to calculate the absolute difference between two numbers
    const calculateDifference = (a, b) => Math.abs(a - b);

    // Function to calculate the total number of close values in an array
    const calculateCloseValues = (comparingArray) => {
        return baseArray.reduce((count, baseValue, index) => {
            // Check if the difference is within a small threshold
            return count + (calculateDifference(baseValue, comparingArray[index]) <= 10 ? 1 : 0);
        }, 0);
    };

    // Function to calculate the total variation (sum of absolute differences)
    const calculateVariation = (comparingArray) => {
        return baseArray.reduce((totalVariation, baseValue, index) => {
            return totalVariation + calculateDifference(baseValue, comparingArray[index]);
        }, 0);
    };

    // If no comparison arrays are provided, return null
    if (comparisonArrays.length === 0) {
        return null;
    }

    // Step 1: Find the maximum number of close values
    const closeValuesCounts = comparisonArrays.map(calculateCloseValues);
    const maxCloseValues = Math.max(...closeValuesCounts);

    // Step 2: Filter arrays with the maximum number of close values
    const mostCloseArrays = comparisonArrays.filter((_, index) => 
        closeValuesCounts[index] === maxCloseValues
    );

    // Step 3: If multiple arrays have the same max close values, 
    // select the one with the least variation
    if (mostCloseArrays.length > 1) {
        const variations = mostCloseArrays.map(calculateVariation);
        const minVariationIndex = variations.indexOf(Math.min(...variations));
        return mostCloseArrays[minVariationIndex];
    }

    // If only one array has the max close values, return it
    return mostCloseArrays[0];
}

// Example usage
// const baseArray = [3748,1440,1303,4490,2414,4554,2474,2713,2220,1641,1906,1834,3694,1343,2502,2577,2653,1248,1188,1868,752,1090,1824,1183,1243];
[1440,1303,4490,2414,4554,2474,2713,2220,1641,1906,1834,3694,1343,2502,2577,2653,1248,1188,1868,752,1090,1824,1183,1243]

const comparisonArrays = [['DI', 1435.0, 'KOPR', 1297.0, 'DW', 4472.0, 'MBQ', 2407.0, 'KLVA', 4536.0, 'TNA', 2465.0, 'MLND', 2704.0, 'NHR', 2211.0, 'BND', 1632.0, 'KJMG', 1900.0, 'VK', 1829.0, 'GC', 3675.0, 'VVH', 1339.0, 'CLA', 2491.0, 'SION', 2569.0, 'MTN', 2639.0, 'DR', 1245.0, 'PR', 1185.0, 'CRD', 1859.0, 'CHG', 748.0, 'BY', 1086.0, 'SNRD', 1819.0, 'MSD', 1179.0, 'CSMT', 1244.0], ['DI', 1440.0, 'KOPR', 1303.0, 'DW', 4490.0, 'MBQ', 2414.0, 'KLVA', 4554.0, 'TNA', 2474.0, 'MLND', 2713.0, 'NHR', 2220.0, 'BND', 1641.0, 'KJMG', 1906.0, 'VK', 1834.0, 'GC', 3694.0, 'VVH', 1343.0, 'CLA', 2502.0, 'SION', 2577.0, 'MTN', 2653.0, 'DR', 1248.0, 'PR', 1188.0, 'CRD', 1868.0, 'CHG', 752.0, 'BY', 1090.0, 'SNRD', 1824.0, 'MSD', 1183.0, 'CSMT', 1243.0], ['DI', 1438.0, 'KOPR', 1301.0, 'DW', 4479.0, 'MBQ', 2408.0, 'KLVA', 4543.0, 'TNA', 2465.0, 'MLND', 2708.0, 'NHR', 2215.0, 'BND', 1638.0, 'KJMG', 1902.0, 'VK', 1830.0, 'GC', 3687.0, 'VVH', 1337.0, 'CLA', 2497.0, 'SION', 2572.0, 'MTN', 2647.0, 'DR', 1246.0, 'PR', 1185.0, 'CRD', 1863.0, 'CHG', 750.0, 'BY', 1086.0, 'SNRD', 1821.0, 'MSD', 1179.0, 'CSMT', 1244.0], ['DI', 1443.0, 'KOPR', 1303.0, 'DW', 4488.0, 'MBQ', 2412.0, 'KLVA', 4555.0, 'TNA', 2471.0, 'MLND', 2714.0, 'NHR', 2220.0, 'BND', 1642.0, 'KJMG', 1903.0, 'VK', 1836.0, 'GC', 3694.0, 'VVH', 1344.0, 'CLA', 2500.0, 'SION', 2575.0, 'MTN', 2654.0, 'DR', 1249.0, 'PR', 1187.0, 'CRD', 1869.0, 'CHG', 753.0, 'BY', 1087.0, 'SNRD', 1824.0, 'MSD', 1183.0, 'CSMT', 1244.0]]
class TrainDistanceAnalyzer11{
    constructor(baseThreshold = 10, maxComparisons = 50) {
        // Store historical distance arrays
        this.historicalDistanceArrays = [];
        
        // Threshold for considering values 'close' (in meters)
        this.closeValueThreshold = baseThreshold;
        
        // Maximum number of historical arrays to maintain
        this.maxComparisons = maxComparisons;
    }

    // Advanced comparison method
    compareDistanceArrays(currentArray, historicalArrays) {
        // Metrics to evaluate array similarity
        const metrics = {
            // Total number of close values
            closeValueCount: (arr) => this.countCloseValues(currentArray, arr),
            
            // Statistical variation
            variationScore: (arr) => this.calculateVariationScore(currentArray, arr),
            
            // Percentage difference analysis
            percentageDifferenceScore: (arr) => this.calculatePercentageDifference(currentArray, arr)
        };

        // Score each historical array
        const scoredArrays = historicalArrays.map(arr => ({
            array: arr,
            closeValues: metrics.closeValueCount(arr),
            variation: metrics.variationScore(arr),
            percentageDifference: metrics.percentageDifferenceScore(arr)
        }));

        // Sort by multiple criteria
        const rankedArrays = scoredArrays.sort((a, b) => {
            // Primary sort: Most close values
            if (a.closeValues !== b.closeValues) {
                return b.closeValues - a.closeValues;
            }
            
            // Secondary sort: Lowest variation
            if (a.variation !== b.variation) {
                return a.variation - b.variation;
            }
            
            // Tertiary sort: Lowest percentage difference
            return a.percentageDifference - b.percentageDifference;
        });

        return rankedArrays[0]?.array || null;
    }

    // Count values within a close threshold
    countCloseValues(baseArray, compareArray, threshold = this.closeValueThreshold) {
        return baseArray.reduce((count, baseValue, index) => {
            const difference = Math.abs(baseValue - compareArray[index]);
            return difference <= threshold ? count + 1 : count;
        }, 0);
    }

    // Calculate statistical variation score
    calculateVariationScore(baseArray, compareArray) {
        return baseArray.reduce((total, baseValue, index) => {
            return total + Math.abs(baseValue - compareArray[index]);
        }, 0);
    }

    // Percentage difference calculation
    calculatePercentageDifference(baseArray, compareArray) {
        return baseArray.reduce((total, baseValue, index) => {
            const difference = Math.abs(baseValue - compareArray[index]);
            const percentDiff = (difference / baseValue) * 100;
            return total + percentDiff;
        }, 0) / baseArray.length;
    }

    // Add new distance array to historical database
    addToHistoricalDatabase(distanceArray) {
        // Prevent duplicate entries
        const isDuplicate = this.historicalDistanceArrays.some(
            arr => JSON.stringify(arr) === JSON.stringify(distanceArray)
        );

        if (!isDuplicate) {
            this.historicalDistanceArrays.push(distanceArray);

            // Maintain maximum historical entries
            if (this.historicalDistanceArrays.length > this.maxComparisons) {
                this.historicalDistanceArrays.shift();
            }
        }
    }

    // Primary analysis method
    analyzeTrainRoute(currentDistanceArray) {
        if (this.historicalDistanceArrays.length === 0) {
            return currentDistanceArray;
        }

        return this.compareDistanceArrays(currentDistanceArray, this.historicalDistanceArrays);
    }
}

class TrainDistanceAnalyzer {
    constructor(baseThreshold = 10, maxComparisons = 50) {
        // Store historical distance arrays
        this.historicalDistanceArrays = [];
        
        // Threshold for considering values 'close' (in meters)
        this.closeValueThreshold = baseThreshold;
        
        // Maximum number of historical arrays to maintain
        this.maxComparisons = maxComparisons;
    }

    // Advanced comparison method
    compareDistanceArrays(currentArray, historicalArrays) {
        // Metrics to evaluate array similarity
        const metrics = {
            // Total number of close values (only compare distance values at odd indices)
            closeValueCount: (arr) => this.countCloseValues(currentArray, arr),
            
            // Statistical variation (only compare distance values at odd indices)
            variationScore: (arr) => this.calculateVariationScore(currentArray, arr),
            
            // Percentage difference analysis (only compare distance values at odd indices)
            percentageDifferenceScore: (arr) => this.calculatePercentageDifference(currentArray, arr)
        };

        // Score each historical array
        const scoredArrays = historicalArrays.map(arr => ({
            array: arr,
            closeValues: metrics.closeValueCount(arr),
            variation: metrics.variationScore(arr),
            percentageDifference: metrics.percentageDifferenceScore(arr)
        }));

        // Sort by multiple criteria
        const rankedArrays = scoredArrays.sort((a, b) => {
            // Primary sort: Most close values
            if (a.closeValues !== b.closeValues) {
                return b.closeValues - a.closeValues;
            }
            
            // Secondary sort: Lowest variation
            if (a.variation !== b.variation) {
                return a.variation - b.variation;
            }
            
            // Tertiary sort: Lowest percentage difference
            return a.percentageDifference - b.percentageDifference;
        });

        return rankedArrays.length > 0 ? rankedArrays[0].array : null;
    }

    // Count values within a close threshold (only compare distance values at odd indices)
    countCloseValues(baseArray, compareArray, threshold = this.closeValueThreshold) {
        let count = 0;
        // Only compare distance values (odd indices)
        for (let i = 1; i < baseArray.length; i += 2) {
            const baseValue = parseFloat(baseArray[i]);
            const compareValue = parseFloat(compareArray[i]);
            
            // Skip if either value is not a valid number
            if (isNaN(baseValue) || isNaN(compareValue)) continue;
            
            const difference = Math.abs(baseValue - compareValue);
            if (difference <= threshold) {
                count++;
            }
        }
        return count;
    }

    // Calculate statistical variation score (only compare distance values at odd indices)
    calculateVariationScore(baseArray, compareArray) {
        let total = 0;
        let validComparisons = 0;
        
        // Only compare distance values (odd indices)
        for (let i = 1; i < baseArray.length; i += 2) {
            const baseValue = parseFloat(baseArray[i]);
            const compareValue = parseFloat(compareArray[i]);
            
            // Skip if either value is not a valid number
            if (isNaN(baseValue) || isNaN(compareValue)) continue;
            
            total += Math.abs(baseValue - compareValue);
            validComparisons++;
        }
        
        return validComparisons > 0 ? total : Infinity;
    }

    // Percentage difference calculation (only compare distance values at odd indices)
    calculatePercentageDifference(baseArray, compareArray) {
        let total = 0;
        let validComparisons = 0;
        
        // Only compare distance values (odd indices)
        for (let i = 1; i < baseArray.length; i += 2) {
            const baseValue = parseFloat(baseArray[i]);
            const compareValue = parseFloat(compareArray[i]);
            
            // Skip if either value is not a valid number
            if (isNaN(baseValue) || baseValue === 0 || isNaN(compareValue)) continue;
            
            const difference = Math.abs(baseValue - compareValue);
            const percentDiff = (difference / baseValue) * 100;
            total += percentDiff;
            validComparisons++;
        }
        
        return validComparisons > 0 ? total / validComparisons : Infinity;
    }

    // Add new distance array to historical database
    addToHistoricalDatabase(distanceArray) {
        // Prevent duplicate entries
        const isDuplicate = this.historicalDistanceArrays.some(
            arr => JSON.stringify(arr) === JSON.stringify(distanceArray)
        );

        if (!isDuplicate) {
            this.historicalDistanceArrays.push(distanceArray);

            // Maintain maximum historical entries
            if (this.historicalDistanceArrays.length > this.maxComparisons) {
                this.historicalDistanceArrays.shift();
            }
        }
    }

    // Primary analysis method
    analyzeTrainRoute(currentDistanceArray) {
        if (this.historicalDistanceArrays.length === 0) {
            this.addToHistoricalDatabase(currentDistanceArray);
            return currentDistanceArray;
        }

        const bestHistoricalMatch = this.compareDistanceArrays(currentDistanceArray, this.historicalDistanceArrays);
        
        // Add current array to historical database after finding a match
        this.addToHistoricalDatabase(currentDistanceArray);
        
        return bestHistoricalMatch;
    }
}






function findBestRouteFromOldDatas(){

const distanceAnalyzer = new TrainDistanceAnalyzer(
    5,   // Close value threshold (meters)
    50    // Maximum historical comparisons
);

// Initial historical arrays
const historicalArrays = comparisonArrays

historicalArrays.forEach(arr => distanceAnalyzer.addToHistoricalDatabase(arr));

// New train route to analyze
const newTrainRouteDistances =  [ 1443.0,  1303.0, 4488.0, 2412.0,  4555.0,  2471.0, 2714.0,  2220.0,  1642.0,  1903.0,  1836.0,  3694.0,  1344.0,  2500.0,  2575.0,  2654.0,  1249.0,  1187.0,  1869.0,  753.0,  1087.0,  1824.0,  1183.0,  1244.0];

const bestMatchingRoute = distanceAnalyzer.analyzeTrainRoute(newTrainRouteDistances);
console.log("Best Matching Routes are:", bestMatchingRoute);

}


function routeChecker(){
// Run the comparison
const result = compareArrays(baseArray, comparisonArrays);
console.log("Best matching array:", result);

// Demonstrate the criteria
comparisonArrays.forEach((arr, index) => {
    const closeValues = baseArray.reduce((count, baseValue, i) => {
        return count + (Math.abs(baseValue - arr[i]) <= 10 ? 1 : 0);
    }, 0);
    const variation = baseArray.reduce((total, baseValue, i) => {
        return total + Math.abs(baseValue - arr[i]);
    }, 0);
    
    console.log(`Array ${index + 1}:`);
    console.log(`Close Values: ${closeValues}`);
    console.log(`Total Variation: ${variation}`);
    console.log('---');
});

}




function getAllDataWithStations() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const numRows = data.length;
  const numCols = data[0].length;
  const result =[]

  // Iterate through columns (starting from the second column)
  for (let col = 1; col < numCols; col++) {
    const columnData =[]

    // Iterate through rows
    for (let row = 0; row < numRows; row++) {
      columnData.push(data[row][0]); // Add station name
      columnData.push(data[row][col]); // Add distance from current column
    }

    result.push(columnData);
  }

  return result;
}


function findBestMatchingPath(currentISDs, currentStationList, historicalData, historicalRouteOrders) {
  let bestMatch = null;
  let bestMatchIndex = -1;
  let lowestClosenessScore = Infinity;
  Logger.log(historicalRouteOrders.length)
  Logger.log(currentStationList.length)
  for (let h = 0; h < historicalData.length; h++) {
    const historicalDataObject = historicalData[h];
    const historicalRouteOrder = historicalRouteOrders[h];

    // 1. Find Matching Station Segment (Check if currentStationList is subsequence)
    let startIndex = -1;
    for (let i = 0; i <= historicalRouteOrder.length - currentStationList.length; i++) {
      let match = true;
      for (let j = 0; j < currentStationList.length; j++) {
        if (historicalRouteOrder[i + j] !== currentStationList[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        startIndex = i;
        break;
      }
    }

    if (startIndex !== -1) { // Matching segment found
      let currentClosenessScore = 0;

      // 2. Calculate Closeness Score
      for (let i = 1; i < currentStationList.length; i++) {
        const currentStation = currentStationList[i];
        const previousStationCurrentRoute = currentStationList[i - 1];
        const currentISD = currentISDs[i - 1];

        let historicalISD = historicalDataObject[currentStation]; // Get historical ISD

        if (historicalISD !== undefined) { // Ensure historical ISD exists for the station
          const difference = Math.abs(currentISD - historicalISD);
          currentClosenessScore += difference;
        } else {
          // Handle case where historical data doesn't have ISD for this station (optional - decide how to handle)
          // For now, we'll assume historical data should have all relevant stations if route matches.
          console.warn(`Historical data missing ISD for station: ${currentStation} in route: ${historicalRouteOrder.join(', ')}`);
          currentClosenessScore = Infinity; // Penalize this historical data object, or handle differently
          break; // No point continuing closeness score calculation for this historical data
        }
      }

      // 3. Update Best Match
      if (currentClosenessScore < lowestClosenessScore) {
        lowestClosenessScore = currentClosenessScore;
        bestMatch = historicalDataObject;
        bestMatchIndex = h;
      }
    }
  }

  return {
    bestMatch: bestMatch,
    bestMatchIndex: bestMatchIndex,
    closenessScore: lowestClosenessScore === Infinity ? -1 : lowestClosenessScore // Return -1 if no valid match found
  };
}


function testBestPathFinder(){

var currISD = [0,
2577,
2653,
1248,
1188,
1868,
752,
1090,
1824,
1183,
1243]
var currStnList = finalRoutesList()
var historicalISD = convertSheetsDataToObjects()
var historicalRouteOrder = getStationNames()

var result = findBestMatchingPath(currISD,currStnList,historicalISD,historicalRouteOrder)
Logger.log(result)

}


function getStationList(){
  var dataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("Data");
 var data = dataSheet.getRange("A178:M203").getValues()  
  Logger.log(data.flat())
  return data
}
function getStationNames(){
  var dataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("Data");
 var data = dataSheet.getRange("A178:A203").getValues()  
  Logger.log(data.flat())
  return data
}
function convertSheetsDataToObjects(data) {
  data = getStationList()
  // Check if data is valid
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  const result = [];
  
  // Determine how many columns we have
  const numColumns = Math.max(...data.map(row => row.length));
  
  // For each column (starting from the second column, index 1)
  for (let colIndex = 1; colIndex < numColumns; colIndex++) {
    const columnObject = {};
    
    // For each row
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      
      // Skip if this row doesn't have enough columns
      if (row.length <= colIndex) continue;
      
      const key = row[0];
      const value = row[colIndex];
      
      // Only add to the object if both key and value exist and value is not empty
      if (key && value !== undefined && value !== null && value !== '') {
        // Convert numeric strings to numbers
        const numericValue = !isNaN(value) ? Number(value) : value;
        columnObject[key] = numericValue;
      }
    }
    
    // Only add non-empty objects to the result
    if (Object.keys(columnObject).length > 0) {
      result.push(columnObject);
    }
  }
  Logger.log(result)
  return result;
}


function analyzeTrainMovements(data, platform_lengths, train_length = 260) {
  const stations = data.stations;
  const pastTrains = data.pastTrains;
  const currentTrain = data.currentTrain;
Logger.log(stations.length)
Logger.log(currentTrain.length)
  if (!stations || !pastTrains || !currentTrain || !platform_lengths) {
    return { error: "Missing input data." };
  }

  if (stations.length !== platform_lengths.length) {
    return { error: "Station names and platform lengths arrays must have the same length." };
  }
  if (stations.length !== currentTrain.length) {
      return { error: "Station names and current train data arrays must have the same length." };
  }
  if (pastTrains.length > 0 && stations.length !== pastTrains[0].length) {
      return { error: "Station names and past train data arrays must have the same length." };
  }


  // 1. Find the most suitable past train path
  let minDifference = Infinity;
  let suitableTrainIndex = -1;

  for (let i = 0; i < pastTrains.length; i++) {
    let currentDifference = 0;
    for (let j = 1; j < stations.length; j++) { // Start from station 1 (index 1) as station 0 is starting point
      currentDifference += Math.abs(currentTrain[j] - pastTrains[i][j]);
    }
    if (currentDifference < minDifference) {
      minDifference = currentDifference;
      suitableTrainIndex = i;
    }
  }

  const suitablePastTrain = suitableTrainIndex !== -1 ? pastTrains[suitableTrainIndex] : null;

  const analysisResults = [];

  for (let i = 1; i < stations.length; i++) { // Start from station 1 (index 1)
    const stationName = stations[i];
    const platformLength = platform_lengths[i] || 0; // Default to 0 if platform length is missing
    const currentTrainDistance = currentTrain[i];
    const pastTrainDistance = suitablePastTrain ? suitablePastTrain[i] : null;

    const isFrontWithinPlatform = (currentTrainDistance <= platformLength);
    const isRearWithinPlatform = (currentTrainDistance >= train_length); // Ensuring entire train within platform. You can adjust this condition as needed.

    analysisResults.push({
      station: stationName,
      platformLength: platformLength,
      currentTrainStopDistance: currentTrainDistance,
      suitablePastTrainStopDistance: pastTrainDistance,
      isFrontWithinPlatform: isFrontWithinPlatform,
      isRearWithinPlatform: isRearWithinPlatform,
      platformIssue: !isFrontWithinPlatform || !isRearWithinPlatform, // Flag for platform issue
      overshotWarning: currentTrainDistance > (pastTrainDistance * 1.10) && pastTrainDistance !== null // Example overshoot detection: Current distance is 10% more than past. Adjust threshold as needed.
    });
  }

  return {
    suitablePastTrainIndex: suitableTrainIndex,
    suitablePastTrainData: suitablePastTrain,
    analysis: analysisResults
  };
}

function analyzeTrainMovementsSegmented(data, platform_lengths, train_length = 260, segmentLength = 4) { // Added segmentLength parameter
    const stations = data.stations;
    const pastTrains = data.pastTrains;
    const currentTrain = data.currentTrain;
  Logger.log(stations.length)
  Logger.log(currentTrain.length)
    if (!stations || !pastTrains || !currentTrain || !platform_lengths) {
        return { error: "Missing input data." };
    }

    if (stations.length !== platform_lengths.length) {
        return { error: "Station names and platform lengths arrays must have the same length." };
    }
    if (stations.length !== currentTrain.length) {
        return { error: "Station names and current train data arrays must have the same length." };
    }
    if (pastTrains.length > 0 && stations.length !== pastTrains[0].length) {
        return { error: "Station names and past train data arrays must have the same length." };
    }

    const numStations = stations.length;
  
    const bestPastTrainIndicesPerSegment = []; // To store the best past train index for each segment
    const bestPathData = new Array(numStations).fill(null); // Initialize an array for the best path

    // Iterate through segments
    for (let segmentStartStationIndex = 1; segmentStartStationIndex < numStations; segmentStartStationIndex += segmentLength) {
        const segmentEndStationIndex = Math.min(segmentStartStationIndex + segmentLength, numStations); // Handle last segment being shorter
        let minSegmentDifference = Infinity;
        let bestSegmentTrainIndex = -1;

        // Find the best past train for this segment
        for (let trainIndex = 0; trainIndex < pastTrains.length; trainIndex++) {
            let currentSegmentDifference = 0;
            for (let stationIndex = segmentStartStationIndex; stationIndex < segmentEndStationIndex; stationIndex++) {
                currentSegmentDifference += Math.abs(currentTrain[stationIndex] - pastTrains[trainIndex][stationIndex]);
            }

            if (currentSegmentDifference < minSegmentDifference) {
                minSegmentDifference = currentSegmentDifference;
                bestSegmentTrainIndex = trainIndex;
            }
        }
        bestPastTrainIndicesPerSegment.push({startIndex: segmentStartStationIndex, endIndex: segmentEndStationIndex -1, trainIndex: bestSegmentTrainIndex}); // Store best train index for this segment

        // Populate bestPathData with the segment from the best past train
        if (bestSegmentTrainIndex !== -1) {
            for (let stationIndex = segmentStartStationIndex; stationIndex < segmentEndStationIndex; stationIndex++) {
                bestPathData[stationIndex] = pastTrains[bestSegmentTrainIndex][stationIndex];
            }
        }
    }


    const analysisResults = [];

    for (let i = 1; i < stations.length; i++) {
        const stationName = stations[i];
        const platformLength = platform_lengths[i] || 0;
        const currentTrainDistance = currentTrain[i];
        const pastTrainDistance = bestPathData[i]; // Use bestPathData for comparison

        const isFrontWithinPlatform = (currentTrainDistance <= platformLength);
        const isRearWithinPlatform = (currentTrainDistance >= train_length);

        analysisResults.push({
            station: stationName,
            platformLength: platformLength,
            currentTrainStopDistance: currentTrainDistance,
            suitablePastTrainStopDistance: pastTrainDistance, // Now from bestPathData
            isFrontWithinPlatform: isFrontWithinPlatform,
            isRearWithinPlatform: isRearWithinPlatform,
            platformIssue: !isFrontWithinPlatform || !isRearWithinPlatform,
            overshotWarning: currentTrainDistance > (pastTrainDistance * 1.10) && pastTrainDistance !== null
        });
    }

    return {
        bestPastTrainIndicesPerSegment: bestPastTrainIndicesPerSegment, // Return segment-wise best train indices
        bestPathData: bestPathData, // Return the composite best path data
        analysis: analysisResults
    };
}
function testOfNewPath(){
const platform_lengths = [ 0,276,274, 276, 270, 306, 272,270,267,264,267,272,264,270,280,263,262,262,281,267,264,265,263,269, 265]
  const data = getCompleteStationData()

  

  const result = analyzeTrainMovements(data,platform_lengths)
  Logger.log(result)
}

function testOfNewPathSegmented(){
const platform_lengths = [ 0,276,274, 276, 270, 306, 272,270,267,264,267,272,264,270,280,263,262,262,281,267,264,265,263,269, 265]
  const data = getCompleteStationData()

  

  const result = analyzeTrainMovementsSegmented(data,platform_lengths,260,3)
  Logger.log(result)
}







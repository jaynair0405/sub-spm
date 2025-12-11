/**
 * Comprehensive Brake Feel Test Detection Function for Google Apps Script
 * Analyzes speed data to detect brake feel tests conducted by train drivers
 */

/**
 * Main function to analyze brake feel test from Google Sheets
 * @param {string} sheetName - Name of the sheet containing data (default: "SPM Data")
 * @param {string} speedColumn - Column letter for speed data (default: "C")
 * @param {string} timeColumn - Column letter for time data (default: "B")
 * @param {string} distanceColumn - Column letter for distance data (default: "D")
 * @param {string} cumDistanceColumn - Column letter for cumulative distance data (default: "E")
 * @param {number} startRow - Starting row number (default: 2, assuming header in row 1)
 * @returns {Object} Analysis results
 */
function analyzeBrakeFeelTest(sheetName = "SPM Data", speedColumn = "C", timeColumn = "B", 
                            distanceColumn = "D", cumDistanceColumn = "E", startRow = 2) {
  try {
    const sheet = SpreadsheetApp.openByUrl(url).getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }
    
    // Get the data range
    const lastRow = sheet.getLastRow();
    const speedRange = sheet.getRange(`${speedColumn}${startRow}:${speedColumn}${lastRow}`);
    const timeRange = sheet.getRange(`${timeColumn}${startRow}:${timeColumn}${lastRow}`);
    const distanceRange = sheet.getRange(`${distanceColumn}${startRow}:${distanceColumn}${lastRow}`);
    const cumDistanceRange = sheet.getRange(`${cumDistanceColumn}${startRow}:${cumDistanceColumn}${lastRow}`);
    
    const speedData = speedRange.getValues().flat();
    const timeData = timeRange.getValues().flat();
    const distanceData = distanceRange.getValues().flat();
    const cumDistanceData = cumDistanceRange.getValues().flat();
    
    // Find the end index for BFT analysis (only check up to first meaningful halt)
    const endIndex = findBFTAnalysisEndIndex(speedData, distanceData, cumDistanceData);
    Logger.log(`BFT Analysis will check up to index: ${endIndex} (${endIndex + 1} rows)`);
    
    // Clean and validate data up to the end index
    const cleanedData = cleanSpeedData(speedData.slice(0, endIndex), timeData.slice(0, endIndex));
    
    // Detect brake feel tests
    const brakeFeelTests = detectBrakeFeelTests(cleanedData.speeds, cleanedData.times);
    
    // Generate report
    const report = generateBrakeFeelReport(brakeFeelTests, cleanedData);
    
    // Log results
    Logger.log("Brake Feel Test Analysis Complete");
    Logger.log(report);
    
    return report;
    
  } catch (error) {
    Logger.log("Error in analyzeBrakeFeelTest:", error);
    return { error: error.message };
  }
}

/**
 * Find the end index for BFT analysis - only check up to first meaningful halt
 * @param {Array} speedData - Raw speed data
 * @param {Array} distanceData - Raw distance data
 * @param {Array} cumDistanceData - Raw cumulative distance data
 * @returns {number} End index for analysis
 */
function findBFTAnalysisEndIndex(speedData, distanceData, cumDistanceData) {
  const minDistanceForHalt = 700; // Minimum cumulative distance to consider as meaningful halt
  let previousCumDistance = 0;
  
  for (let i = 0; i < speedData.length; i++) {
    const speed = Number(speedData[i]) || 0;
    const distance = Number(distanceData[i]) || 0;
    const cumDistance = Number(cumDistanceData[i]) || 0;
    
    // Check for halt condition (speed = 0 and distance = 0)
    if (speed === 0 && distance === 0) {
      // If cumulative distance is significant and different from previous halt
      if (cumDistance >= minDistanceForHalt && cumDistance !== previousCumDistance) {
        Logger.log(`Found meaningful halt at index ${i}, cumulative distance: ${cumDistance}`);
        return i + 1; // Return index after the halt
      }
      previousCumDistance = cumDistance;
    }
  }
  
  // If no meaningful halt found, return full length (but this shouldn't happen normally)
  Logger.log("No meaningful halt found, checking full data");
  return speedData.length;
}

/**
 * Clean and validate speed data
 * @param {Array} speedData - Raw speed data
 * @param {Array} timeData - Raw time data
 * @returns {Object} Cleaned data with speeds and times
 */
function cleanSpeedData(speedData, timeData) {
  const cleaned = {
    speeds: [],
    times: [],
    originalIndices: []
  };
  
  Logger.log(`Cleaning ${speedData.length} data points`);
  
  // Convert timestamps to relative seconds if needed
  const processedTimes = convertTimeToSeconds(timeData);
  
  for (let i = 0; i < speedData.length; i++) {
    // Handle Google Sheets cell values properly
    let speed = speedData[i];
    let time = processedTimes[i];
    
    // Convert to number if it's not already
    if (typeof speed !== 'number') {
      speed = Number(speed);
    }
    if (typeof time !== 'number') {
      time = Number(time);
    }
    
    // Check for valid numbers and non-negative speed
    if (!isNaN(speed) && !isNaN(time) && speed >= 0) {
      cleaned.speeds.push(speed);
      cleaned.times.push(time);
      cleaned.originalIndices.push(i);
    } else {
      // Only log first few invalid entries to avoid spam
      if (i < 5) {
        Logger.log(`Skipping invalid data at index ${i}: speed=${speed}, time=${time}`);
      }
    }
  }
  
  Logger.log(`Cleaned data: ${cleaned.speeds.length} valid points from ${speedData.length} total`);
  
  // Log first few cleaned values for verification
  if (cleaned.speeds.length > 0) {
    Logger.log(`First few cleaned speeds: ${cleaned.speeds.slice(0, 5)}`);
    Logger.log(`First few cleaned times: ${cleaned.times.slice(0, 5)}`);
  }
  
  return cleaned;
}

/**
 * Convert time data to seconds format
 * @param {Array} timeData - Raw time data (could be timestamps or seconds)
 * @returns {Array} Time data in seconds format
 */
function convertTimeToSeconds(timeData) {
  if (timeData.length === 0) return [];
  
  const processedTimes = [];
  let firstTime = Number(timeData[0]);
  
  // Check if times are in timestamp format (very large numbers)
  const isTimestamp = Math.abs(firstTime) > 1000000; // If time is > 1 million, likely timestamp
  
  if (isTimestamp) {
    // Convert timestamps to relative seconds
    Logger.log(`Converting timestamps to relative seconds. First timestamp: ${firstTime}`);
    
    for (let i = 0; i < timeData.length; i++) {
      const currentTime = Number(timeData[i]);
      if (!isNaN(currentTime)) {
        // Convert to seconds relative to first timestamp
        const relativeSeconds = Math.round((currentTime - firstTime) / 1000);
        processedTimes.push(relativeSeconds);
      } else {
        processedTimes.push(NaN);
      }
    }
    
    Logger.log(`Converted time range: ${processedTimes[0]} to ${processedTimes[processedTimes.length-1]} seconds`);
  } else {
    // Times are already in seconds format
    Logger.log(`Times appear to be in seconds format already`);
    
    for (let i = 0; i < timeData.length; i++) {
      const time = Number(timeData[i]);
      processedTimes.push(time);
    }
  }
  
  return processedTimes;
}

/**
 * Detect brake feel tests in speed data - improved algorithm
 * @param {Array} speeds - Array of speed values
 * @param {Array} times - Array of time values
 * @returns {Array} Array of detected brake feel tests
 */
function detectBrakeFeelTests(speeds, times) {
  const brakeFeelTests = [];
  const minSpeedForTest = 20; // Minimum speed to consider for brake test (reduced)
  const minSpeedDrop = 15; // Minimum speed drop to consider as braking (increased)
  const maxSpeedVariation = 3; // Maximum variation when maintaining speed (increased)
  const stabilizationPeriod = 5; // Seconds to consider for speed stabilization
  
  Logger.log(`Starting BFT detection on ${speeds.length} data points`);
  Logger.log(`Parameters: minSpeed=${minSpeedForTest}, minDrop=${minSpeedDrop}, variation=${maxSpeedVariation}`);
  
  let i = 0;
  let testCount = 0;
  
  while (i < speeds.length - 30) { // Need at least 30 data points ahead
    // Look for initial acceleration to test speed
    const accelerationPhase = findAccelerationPhase(speeds, i);
    
    if (accelerationPhase && accelerationPhase.endSpeed >= minSpeedForTest) {
      Logger.log(`\n=== Potential BFT ${++testCount} ===`);
      Logger.log(`Acceleration phase found at index ${accelerationPhase.startIndex}`);
      
      i = accelerationPhase.endIndex;
      
      // Look for braking phase starting from max speed
      const brakingPhase = findBrakingPhase(speeds, i, minSpeedDrop);
      
      if (brakingPhase) {
        Logger.log(`Braking phase found at index ${brakingPhase.startIndex}`);
        
        // Look for stabilization or recovery phase
        const recoveryPhase = findRecoveryPhase(speeds, brakingPhase.endIndex, 
                                              brakingPhase.endSpeed, stabilizationPeriod, maxSpeedVariation);
        
        if (recoveryPhase) {
          Logger.log(`Recovery phase found: ${recoveryPhase.type}`);
          
          // Valid brake feel test detected
          const brakeTest = {
            testNumber: brakeFeelTests.length + 1,
            startIndex: accelerationPhase.startIndex,
            startTime: times[accelerationPhase.startIndex],
            startSpeed: accelerationPhase.startSpeed,
            maxSpeed: accelerationPhase.endSpeed,
            maxSpeedTime: times[accelerationPhase.endIndex],
            brakingStartSpeed: brakingPhase.startSpeed,
            brakingStartTime: times[brakingPhase.startIndex],
            lowestSpeed: brakingPhase.endSpeed,
            lowestSpeedTime: times[brakingPhase.endIndex],
            recoveryType: recoveryPhase.type,
            recoverySpeed: recoveryPhase.endSpeed,
            recoveryTime: times[recoveryPhase.endIndex],
            endIndex: recoveryPhase.endIndex,
            endTime: times[recoveryPhase.endIndex],
            totalDuration: times[recoveryPhase.endIndex] - times[accelerationPhase.startIndex],
            speedDrop: brakingPhase.startSpeed - brakingPhase.endSpeed,
            accelerationPhase: accelerationPhase,
            brakingPhase: brakingPhase,
            recoveryPhase: recoveryPhase,
            testValid: true
          };
          
          Logger.log(`✓ Valid BFT detected: ${brakeTest.startSpeed}→${brakeTest.maxSpeed}→${brakeTest.lowestSpeed}→${brakeTest.recoverySpeed} km/h`);
          brakeFeelTests.push(brakeTest);
          i = recoveryPhase.endIndex;
        } else {
          Logger.log(`✗ No valid recovery phase found`);
          i = brakingPhase.endIndex;
        }
      } else {
        Logger.log(`✗ No valid braking phase found`);
        i = accelerationPhase.endIndex + 10; // Skip ahead a bit
      }
    } else {
      i++;
    }
    
    // Prevent infinite loops
    if (i >= speeds.length - 30) break;
  }
  
  Logger.log(`\nBFT Detection Complete: Found ${brakeFeelTests.length} brake feel tests`);
  return brakeFeelTests;
}

/**
 * Find acceleration phase - improved to handle plateaus and trends
 * @param {Array} speeds - Speed data
 * @param {number} startIndex - Starting index
 * @returns {Object|null} Acceleration phase details
 */
function findAccelerationPhase(speeds, startIndex) {
  const minAcceleration = 15; // Minimum total speed increase for BFT
  const maxAccelerationTime = 120; // Maximum time for acceleration phase (2 minutes)
  const plateauTolerance = 2; // Allow ±2 km/h variation during plateaus
  
  let currentIndex = startIndex;
  let startSpeed = speeds[startIndex];
  let maxSpeed = startSpeed;
  let maxSpeedIndex = startIndex;
  let lastSignificantSpeed = startSpeed;
  let plateauCount = 0;
  let totalIncrease = 0;
  
  while (currentIndex < speeds.length - 1 && 
         currentIndex - startIndex < maxAccelerationTime) {
    
    const currentSpeed = speeds[currentIndex];
    const nextSpeed = speeds[currentIndex + 1];
    
    // Check if we're in a plateau (speed variation within tolerance)
    if (Math.abs(nextSpeed - currentSpeed) <= plateauTolerance) {
      plateauCount++;
      // Allow plateaus, but don't count them as progress
    } else if (nextSpeed > currentSpeed) {
      // Clear acceleration
      plateauCount = 0;
      totalIncrease += (nextSpeed - lastSignificantSpeed);
      lastSignificantSpeed = nextSpeed;
      
      if (nextSpeed > maxSpeed) {
        maxSpeed = nextSpeed;
        maxSpeedIndex = currentIndex + 1;
      }
    } else if (nextSpeed < currentSpeed - plateauTolerance) {
      // Significant drop - check if we have enough acceleration to qualify
      if (maxSpeed - startSpeed >= minAcceleration) {
        break; // End of acceleration phase
      } else {
        // Not enough acceleration, continue looking
        plateauCount = 0;
      }
    }
    
    // If plateau is too long, consider it end of acceleration
    if (plateauCount > 10) {
      break;
    }
    
    currentIndex++;
  }
  
  // Check if we found a valid acceleration phase
  if (maxSpeed - startSpeed >= minAcceleration) {
    Logger.log(`Found acceleration: ${startSpeed} → ${maxSpeed} km/h (${maxSpeed - startSpeed} km/h increase)`);
    return {
      startIndex: startIndex,
      startSpeed: startSpeed,
      endIndex: maxSpeedIndex,
      endSpeed: maxSpeed,
      duration: maxSpeedIndex - startIndex,
      totalIncrease: maxSpeed - startSpeed
    };
  }
  
  return null;
}

/**
 * Find braking phase - improved to handle plateaus and trends
 * @param {Array} speeds - Speed data
 * @param {number} startIndex - Starting index
 * @param {number} minSpeedDrop - Minimum speed drop required
 * @returns {Object|null} Braking phase details
 */
function findBrakingPhase(speeds, startIndex, minSpeedDrop) {
  const maxBrakingTime = 60; // Maximum time for braking phase
  const plateauTolerance = 2; // Allow ±2 km/h variation during plateaus
  const minSustainedDrop = 10; // Minimum total drop to consider as braking
  
  let currentIndex = startIndex;
  let startSpeed = speeds[startIndex];
  let lowestSpeed = startSpeed;
  let lowestSpeedIndex = startIndex;
  let plateauCount = 0;
  let totalDrop = 0;
  let lastSignificantSpeed = startSpeed;
  let brakingDetected = false;
  
  while (currentIndex < speeds.length - 1 && 
         currentIndex - startIndex < maxBrakingTime) {
    
    const currentSpeed = speeds[currentIndex];
    const nextSpeed = speeds[currentIndex + 1];
    
    // Check if we're in a plateau (speed variation within tolerance)
    if (Math.abs(nextSpeed - currentSpeed) <= plateauTolerance) {
      plateauCount++;
      // Allow plateaus during braking
    } else if (nextSpeed < currentSpeed) {
      // Clear speed drop
      plateauCount = 0;
      totalDrop = lastSignificantSpeed - nextSpeed;
      lastSignificantSpeed = nextSpeed;
      
      if (nextSpeed < lowestSpeed) {
        lowestSpeed = nextSpeed;
        lowestSpeedIndex = currentIndex + 1;
      }
      
      // Check if we have significant braking
      if (startSpeed - nextSpeed >= minSustainedDrop) {
        brakingDetected = true;
      }
    } else if (nextSpeed > currentSpeed + plateauTolerance) {
      // Significant speed increase - end of braking if we detected braking
      if (brakingDetected && startSpeed - lowestSpeed >= minSpeedDrop) {
        break;
      }
      plateauCount = 0;
    }
    
    // If plateau is too long and we have detected braking, consider it end
    if (plateauCount > 15 && brakingDetected) {
      break;
    }
    
    currentIndex++;
  }
  
  // Check if we found a valid braking phase
  const totalSpeedDrop = startSpeed - lowestSpeed;
  if (brakingDetected && totalSpeedDrop >= minSpeedDrop) {
    Logger.log(`Found braking: ${startSpeed} → ${lowestSpeed} km/h (${totalSpeedDrop} km/h drop)`);
    return {
      startIndex: startIndex,
      startSpeed: startSpeed,
      endIndex: lowestSpeedIndex,
      endSpeed: lowestSpeed,
      duration: lowestSpeedIndex - startIndex,
      speedDrop: totalSpeedDrop
    };
  }
  
  return null;
}

/**
 * Find recovery phase (maintain speed or accelerate) - improved
 * @param {Array} speeds - Speed data
 * @param {number} startIndex - Starting index
 * @param {number} baseSpeed - Base speed to maintain
 * @param {number} stabilizationPeriod - Period to check for stabilization
 * @param {number} maxVariation - Maximum speed variation
 * @returns {Object|null} Recovery phase details
 */
function findRecoveryPhase(speeds, startIndex, baseSpeed, stabilizationPeriod, maxVariation) {
  const maxRecoveryTime = 40; // Maximum time for recovery phase
  const accelerationThreshold = 5; // Minimum speed increase to consider as acceleration
  
  let currentIndex = startIndex;
  let maintainCount = 0;
  let maxSpeedInRecovery = baseSpeed;
  let recoveryType = 'maintain';
  
  while (currentIndex < speeds.length - 1 && 
         currentIndex - startIndex < maxRecoveryTime) {
    
    const currentSpeed = speeds[currentIndex];
    
    // Update max speed seen in recovery
    if (currentSpeed > maxSpeedInRecovery) {
      maxSpeedInRecovery = currentSpeed;
    }
    
    // Check if speed is being maintained (within tolerance of base speed)
    if (Math.abs(currentSpeed - baseSpeed) <= maxVariation) {
      maintainCount++;
      
      // If maintained for required period, it's a valid recovery
      if (maintainCount >= stabilizationPeriod) {
        Logger.log(`Found speed maintenance: ${baseSpeed} km/h maintained for ${maintainCount} seconds`);
        return {
          startIndex: startIndex,
          endIndex: currentIndex,
          endSpeed: currentSpeed,
          type: 'maintain',
          duration: currentIndex - startIndex,
          maintainedSpeed: baseSpeed
        };
      }
    } 
    // Check for clear acceleration above base speed
    else if (currentSpeed > baseSpeed + accelerationThreshold) {
      recoveryType = 'accelerate';
      Logger.log(`Found acceleration recovery: ${baseSpeed} → ${currentSpeed} km/h`);
      return {
        startIndex: startIndex,
        endIndex: currentIndex,
        endSpeed: currentSpeed,
        type: 'accelerate',
        duration: currentIndex - startIndex,
        accelerationFrom: baseSpeed,
        accelerationTo: currentSpeed
      };
    }
    // Check if speed stays close to base (within wider tolerance for gradual changes)
    else if (Math.abs(currentSpeed - baseSpeed) <= maxVariation * 2) {
      // Don't reset maintain count for minor variations
      if (maintainCount > 0) maintainCount--;
    }
    else {
      // Significant deviation, reset
      maintainCount = 0;
    }
    
    currentIndex++;
  }
  
  // If we found some acceleration during the period, even without full maintenance
  if (maxSpeedInRecovery > baseSpeed + accelerationThreshold) {
    Logger.log(`Found partial acceleration recovery: ${baseSpeed} → ${maxSpeedInRecovery} km/h`);
    return {
      startIndex: startIndex,
      endIndex: currentIndex - 1,
      endSpeed: maxSpeedInRecovery,
      type: 'accelerate',
      duration: currentIndex - 1 - startIndex,
      accelerationFrom: baseSpeed,
      accelerationTo: maxSpeedInRecovery
    };
  }
  
  return null;
}

/**
 * Generate comprehensive brake feel test report
 * @param {Array} brakeFeelTests - Detected brake feel tests
 * @param {Object} cleanedData - Cleaned speed and time data
 * @returns {Object} Comprehensive report
 */
function generateBrakeFeelReport(brakeFeelTests, cleanedData) {
  const report = {
    summary: {
      totalTests: brakeFeelTests.length,
      dataPoints: cleanedData.speeds.length,
      averageSpeedDrop: 0,
      averageMaxSpeed: 0,
      averageTestDuration: 0
    },
    tests: brakeFeelTests,
    recommendations: []
  };
  
  if (brakeFeelTests.length > 0) {
    // Calculate averages
    const totalSpeedDrop = brakeFeelTests.reduce((sum, test) => sum + test.speedDrop, 0);
    const totalMaxSpeed = brakeFeelTests.reduce((sum, test) => sum + test.maxSpeed, 0);
    const totalDuration = brakeFeelTests.reduce((sum, test) => sum + test.totalDuration, 0);
    
    report.summary.averageSpeedDrop = Math.round(totalSpeedDrop / brakeFeelTests.length * 100) / 100;
    report.summary.averageMaxSpeed = Math.round(totalMaxSpeed / brakeFeelTests.length * 100) / 100;
    report.summary.averageTestDuration = Math.round(totalDuration / brakeFeelTests.length * 100) / 100;
    
    // Generate recommendations
    if (report.summary.averageSpeedDrop < 10) {
      report.recommendations.push("Consider increasing speed drop for more effective brake feel testing");
    }
    
    if (report.summary.averageMaxSpeed < 30) {
      report.recommendations.push("Consider conducting brake feel tests at higher speeds for better assessment");
    }
    
    if (brakeFeelTests.length === 1) {
      report.recommendations.push("Single brake feel test detected. Consider multiple tests for comprehensive assessment");
    }
  } else {
    report.recommendations.push("No brake feel tests detected in the provided data");
  }
  
  return report;
}

/**
 * Helper function to write results to a new sheet
 * @param {Object} report - Analysis report
 * @param {string} outputSheetName - Name for output sheet
 */
function writeBrakeFeelResultsToSheet(report, outputSheetName = "Brake Feel Analysis") {
  const spreadsheet = SpreadsheetApp.openByUrl(url);
  
  // Create or clear the output sheet
  let outputSheet = spreadsheet.getSheetByName(outputSheetName);
  if (outputSheet) {
    outputSheet.clear();
  } else {
    outputSheet = spreadsheet.insertSheet(outputSheetName);
  }
  
  // Write summary
  outputSheet.getRange("A1").setValue("Brake Feel Test Analysis Summary");
  outputSheet.getRange("A2").setValue("Total Tests Detected:");
  outputSheet.getRange("B2").setValue(report.summary.totalTests);
  outputSheet.getRange("A3").setValue("Average Speed Drop:");
  outputSheet.getRange("B3").setValue(report.summary.averageSpeedDrop);
  outputSheet.getRange("A4").setValue("Average Max Speed:");
  outputSheet.getRange("B4").setValue(report.summary.averageMaxSpeed);
  outputSheet.getRange("A5").setValue("Average Test Duration:");
  outputSheet.getRange("B5").setValue(report.summary.averageTestDuration);
  
  // Write test details headers
  const headers = ["Test #", "Start Time", "Max Speed", "Braking Start Speed", 
                  "Lowest Speed", "Speed Drop", "Recovery Type", "Total Duration"];
  outputSheet.getRange(7, 1, 1, headers.length).setValues([headers]);
  
  // Write test details
  if (report.tests.length > 0) {
    const testData = report.tests.map((test, index) => [
      index + 1,
      test.startTime,
      test.maxSpeed,
      test.brakingStartSpeed,
      test.lowestSpeed,
      test.speedDrop,
      test.recoveryType,
      test.totalDuration
    ]);
    
    outputSheet.getRange(8, 1, testData.length, headers.length).setValues(testData);
  }
  
  // Write recommendations
  if (report.recommendations.length > 0) {
    outputSheet.getRange(8 + report.tests.length + 2, 1).setValue("Recommendations:");
    report.recommendations.forEach((rec, index) => {
      outputSheet.getRange(8 + report.tests.length + 3 + index, 1).setValue(`${index + 1}. ${rec}`);
    });
  }
  
  // Format the sheet
  outputSheet.getRange("A1").setFontWeight("bold").setFontSize(14);
  outputSheet.getRange(7, 1, 1, headers.length).setFontWeight("bold").setBackground("#E8F0FE");
  outputSheet.autoResizeColumns(1, headers.length);
}

/**
 * Example usage function
 */
function runBrakeFeelAnalysis() {
  const report = analyzeBrakeFeelTest("SPM Data", "C", "B", "D", "E", 2);
  writeBrakeFeelResultsToSheet(report);
  
  Logger.log("Analysis complete. Check the 'Brake Feel Analysis' sheet for results.");
  return report;
}


function testEmergencyBraking() {
  const testHalt = {distance: 36473.0, station: "Unknown", isd: 0};
  
  const sheet = SpreadsheetApp.openByUrl(url).getSheetByName('SPM Data');
  const data = sheet.getDataRange().getValues();
  
  const spmData = data.slice(1).map((row, index) => ({
    date: row[0],
    time: row[1],
    speed: row[2],
    distance: row[3],
    cumDist: row[4],
    rowNumber: index + 2
  }));
  
  const result = findEmergencyBrakingStart(spmData, testHalt);
  
  if (result) {
    Logger.log(`\nEmergency Braking Analysis for halt at ${testHalt.distance}:`);
    Logger.log(`Braking started at: ${result.retardationStart.time}`);
    Logger.log(`Starting speed: ${result.initialSpeed} km/h`);
    Logger.log(`Starting distance: ${result.retardationStart.cumDist} m`);
    Logger.log(`Total deceleration distance: ${result.decelerationDistance} m`);
    Logger.log(`Total deceleration time: ${result.decelerationDuration} seconds`);
    
    const retardationCalc = calculateRetardation(result);
    Logger.log(`\nRetardation Calculations:`);
    Logger.log(`Average retardation: ${retardationCalc.avgRetardationMS2} m/s²`);
    Logger.log(`Kinematic retardation: ${retardationCalc.kinematicRetardationMS2} m/s²`);
  }
}



function findEmergencyBrakingStart(spmData, halt, threshold = 700, maintainThreshold = 2) {
  // Find the index where the halt occurs
  const haltIndex = spmData.findIndex(row => 
    row.cumDist === halt.distance && row.speed === 0
  );
  
  if (haltIndex === -1) {
    Logger.log(`Halt at distance ${halt.distance} not found in SPM data`);
    return null;
  }
  
  let retardationStartIndex = -1;
  let maxSpeedBeforeDecel = 0;
  
  // Analyze speed pattern backwards from halt
  let i = haltIndex - 1;
  while (i >= 0 && halt.distance - spmData[i].cumDist <= threshold) {
    const currentSpeed = spmData[i].speed;
    
    // Track maximum speed
    if (currentSpeed > maxSpeedBeforeDecel) {
      maxSpeedBeforeDecel = currentSpeed;
    }
    
    // Count how many consecutive seconds this speed is maintained going forward
    let maintainCount = 0;
    let j = i;
    while (j < haltIndex && spmData[j].speed === currentSpeed) {
      maintainCount++;
      j++;
    }
    
    // If speed was maintained for more than threshold, deceleration starts after maintenance
    if (maintainCount > maintainThreshold && j < haltIndex && spmData[j].speed < currentSpeed) {
      retardationStartIndex = j - 1; // Last point of maintained speed
      break;
    }
    
    i--;
  }
  
  if (retardationStartIndex === -1) {
    Logger.log(`Could not find clear emergency braking start for halt at ${halt.distance}`);
    return null;
  }
  
  // Return the retardation start data
  const startData = spmData[retardationStartIndex];
  return {
    haltDistance: halt.distance,
    retardationStart: {
      time: startData.time,
      speed: startData.speed,
      distance: startData.distance,
      cumDist: startData.cumDist,
      rowIndex: retardationStartIndex
    },
    haltData: {
      time: spmData[haltIndex].time,
      speed: spmData[haltIndex].speed,
      distance: spmData[haltIndex].distance,
      cumDist: spmData[haltIndex].cumDist,
      rowIndex: haltIndex
    },
    decelerationDistance: halt.distance - startData.cumDist,
    decelerationDuration: haltIndex - retardationStartIndex,
    initialSpeed: startData.speed,
    maxSpeedBeforeDecel: maxSpeedBeforeDecel,
    brakingType: 'emergency'
  };
}

/**
 * Main function to find retardation points for all non-scheduled halts
 * @returns {Array} Array of retardation analysis results
 */
function analyzeRetardationForNonScheduledHalts() {
  try {
    // Get SPM data
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SPM Data');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Convert to array of objects
    const spmData = data.slice(1).map((row, index) => ({
      date: row[0],
      time: row[1],
      speed: row[2],
      distance: row[3],
      cumDist: row[4],
      rowNumber: index + 2 // Actual row number in sheet
    }));
    
    // Get non-scheduled halts from processHalts
    const haltsData = processHalts();
    if (!haltsData || !haltsData.nonScheduled) {
      Logger.log("No non-scheduled halts found");
      return [];
    }
    
    const results = [];
    
    // Analyze each non-scheduled halt
    haltsData.nonScheduled.forEach(halt => {
      Logger.log(`Analyzing halt at distance: ${halt.distance}`);
      const retardationInfo = findRetardationStartForHalt(spmData, halt);
      if (retardationInfo) {
        results.push({
          station: halt.station || 'Unknown',
          haltDistance: halt.distance,
          isd: halt.isd,
          ...retardationInfo
        });
      }
    });
    
    Logger.log(`Found retardation data for ${results.length} non-scheduled halts`);
    return results;
    
  } catch (error) {
    Logger.log(`Error in analyzeRetardationForNonScheduledHalts: ${error.message}`);
    return [];
  }
}

/**
 * Helper function to calculate retardation rate
 * @param {Object} retardationInfo - Output from findRetardationStartForHalt
 * @returns {Object} Retardation calculations
 */
function calculateRetardation(retardationInfo) {
  const {
    initialSpeed,
    decelerationDistance,
    decelerationDuration
  } = retardationInfo;
  
  // Convert speed from km/h to m/s
  const initialSpeedMS = initialSpeed * (1000 / 3600);
  
  // Calculate average retardation (m/s²)
  const avgRetardation = initialSpeedMS / decelerationDuration;
  
  // Using kinematic equation: v² = u² + 2as
  // 0 = u² + 2as, so a = -u²/(2s)
  const kinematicRetardation = Math.pow(initialSpeedMS, 2) / (2 * decelerationDistance);
  
  return {
    avgRetardationMS2: avgRetardation.toFixed(3),
    kinematicRetardationMS2: kinematicRetardation.toFixed(3),
    decelerationTimeSeconds: decelerationDuration,
    decelerationDistanceMeters: decelerationDistance.toFixed(1),
    initialSpeedKMH: initialSpeed,
    initialSpeedMS: initialSpeedMS.toFixed(2)
  };
}









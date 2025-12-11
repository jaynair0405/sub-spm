function generateOverspeedReport() {
  const overspeedEvents = detectOverspeedingEvents();
  const driverInfo = getDriverInfoFromDatabase();
  
  // Generate detailed report
  outputDetailedReport(overspeedEvents, driverInfo);
  
  // Update permanent history
  updateOverspeedHistory(driverInfo, overspeedEvents.length);
}

function outputDetailedReport(overspeedEvents, driverInfo) {
  const ss = SpreadsheetApp.openByUrl(url);
  var destSheet = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=0#gid=0")
  var destReportSheet = destSheet.getSheetByName("Reports")
  const lastRow = destReportSheet.getLastRow()
  Logger.log(lastRow)
   if(lastRow>299){
  //destReportSheet.getRange(300,1,350,12).clear() //destReportSheet.getRange(300,1,(lastRow+1)-300,12).clear()
}
  

  let reportSheet = ss.getSheetByName("Overspeed Report") || ss.insertSheet("Overspeed Report");
  reportSheet.clear();
  
  // Set headers with event sequence column
  // "Date of Work", "Driver ID", "Driver Name", "Train Number",
  const headers = [
    "Event #", 
    "Start Time", "End Time", "Start KM", "End KM",
    "Duration (sec)", "Max Speed", "Max Excess",
    "PSR Value", "Threshold Value"
  ];

  destReportSheet.getRange(301, 1, 1, headers.length)
    .setValues([headers])
    .setBackground("#e3ca4b")
    .setFontColor("#ffffff")
    .setFontWeight("bold");
  
  reportSheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setBackground("#333333")
    .setFontColor("#ffffff")
    .setFontWeight("bold");

  // Add data rows with sequence numbers
  if (overspeedEvents.length > 0) {
    const outputData = overspeedEvents.map((event, index) => [
      index + 1, // Event sequence number
      event.startTime,
      event.endTime,
      event.startKm,
      event.endKm,
      event.duration,
      event.maxSpeed,
      event.maxExcess,
      event.psrValue,
      event.thresholdValue
    ]);
    
    reportSheet.getRange(2, 1, outputData.length, headers.length)
      .setValues(outputData);

      destReportSheet.getRange(302, 1, outputData.length, headers.length)
      .setValues(outputData);
  }else{
    destReportSheet.getRange(301, 1, 1, headers.length).setValues([headers]);
  destReportSheet.getRange(302, 4).setValue("No Speed Violations Found");
  }

}

function updateOverspeedHistory(driverInfo, eventCount) {
  const ss = SpreadsheetApp.openByUrl(url);
  let historySheet = ss.getSheetByName("Overspeed History");
  
  // Create history sheet if it doesn't exist
  if (!historySheet) {
    historySheet = ss.insertSheet("Overspeed History");
    historySheet.getRange(1, 1, 1, 5).setValues([
      ["Date", "Driver ID", "Driver Name", "Train Number", "Overspeed Events"]
    ]).setFontWeight("bold");
  }
  
  const uniqueKey = `${driverInfo.dateOfWork}_${driverInfo.driverId}_${driverInfo.trainNumber}`;
  const existingData = historySheet.getDataRange().getValues();
  const existingRow = existingData.find(row => {
    return `${row[0]}_${row[1]}_${row[3]}` === uniqueKey;
  });
  
  if (!existingRow && eventCount > 0) {
  // Append new record
  historySheet.appendRow([
    driverInfo.dateOfWork,
    driverInfo.driverId,
    driverInfo.driverName,
    driverInfo.trainNumber,
    eventCount
  ]);
} else if (existingRow && eventCount > 0) {
  // Update existing record
  const rowIndex = existingData.indexOf(existingRow) + 1;
  historySheet.getRange(rowIndex, 5).setValue(eventCount);
} else if (existingRow && eventCount === 0) {
  // Optionally, you can delete the existing row if eventCount is 0
  const rowIndex = existingData.indexOf(existingRow) + 1;
  historySheet.deleteRow(rowIndex);
}
  
  // Auto-resize columns
  for (let i = 1; i <= 5; i++) {
    historySheet.autoResizeColumn(i);
  }
}

function detectOverspeedingEvents() {
  const sheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  const data = sheet.getRange("A2:L" + sheet.getLastRow()).getValues();
  let overspeedEvents = [];
  let currentEvent = null;
  const thresholdOffset = 2;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const speed = row[9];
    const psr = row[10];
    const threshold = psr + thresholdOffset;

    if (speed > threshold) {
      if (!currentEvent) {
        currentEvent = createNewEvent(row, threshold);
      } else {
        extendCurrentEvent(currentEvent, row);
      }
    } else {
      if (currentEvent) {
        if (currentEvent.overspeedValues.length > 7) {
          if (!checkForMomentaryDrop(data, i, thresholdOffset)) {
            overspeedEvents.push(finalizeEvent(currentEvent, row));
          } else {
            extendEventThroughMomentaryDrop(data, i, currentEvent, thresholdOffset);
            i += 2; // Skip checked rows
          }
        }
        currentEvent = null;
      }
    }
  }
  return overspeedEvents;
}

// Helper functions for event detection
function createNewEvent(row, threshold) {
  return {
    startTime: row[1],
    startKm: row[4],
    overspeedValues: [row[9]],
    psrValue: row[10],
    thresholdValue: threshold,
    times: [row[1]],
    kms: [row[4]]
  };
}

function extendCurrentEvent(event, row) {
  event.overspeedValues.push(row[9]);
  event.times.push(row[1]);
  event.kms.push(row[4]);
}

function checkForMomentaryDrop(data, currentIndex, thresholdOffset) {
  const checkRows = Math.min(3, data.length - currentIndex - 1);
  for (let j = 1; j <= checkRows; j++) {
    if (data[currentIndex + j][9] > (data[currentIndex + j][10] + thresholdOffset)) {
      return true;
    }
  }
  return false;
}

function extendEventThroughMomentaryDrop(data, currentIndex, event, thresholdOffset) {
  const checkRows = Math.min(3, data.length - currentIndex - 1);
  for (let j = 0; j < checkRows; j++) {
    if (data[currentIndex + j][9] > (data[currentIndex + j][10] + thresholdOffset)) {
      event.overspeedValues.push(data[currentIndex + j][9]);
      event.times.push(data[currentIndex + j][1]);
      event.kms.push(data[currentIndex + j][4]);
    }
  }
}

function finalizeEvent(event, row) {
  const excessSpeeds = event.overspeedValues.map(speed => speed - event.psrValue);
  return {
    startTime: event.startTime,
    endTime: row[1],
    startKm: event.startKm,
    endKm: row[4],
    duration: event.overspeedValues.length,
    maxSpeed: Math.max(...event.overspeedValues),
    maxExcess: Math.max(...excessSpeeds),
    psrValue: event.psrValue,
    thresholdValue: event.thresholdValue
  };
}

// Function to get driver info from Database sheet
function getDriverInfoFromDatabase() {
  const dbSheet = SpreadsheetApp.openByUrl(url).getSheetByName("Database");
  const lastRow = dbSheet.getLastRow();
  const [dateOfWork, driverId, driverName, trainNumber] = dbSheet.getRange(lastRow, 1, 1, 4).getValues()[0];
  return { dateOfWork, driverId, driverName, trainNumber };
}

// Function to combine overspeed events with driver info
function combineWithDriverInfo(overspeedEvents, driverInfo) {
  return overspeedEvents.map(event => ({
    dateOfWork: driverInfo.dateOfWork,
    driverId: driverInfo.driverId,
    driverName: driverInfo.driverName,
    trainNumber: driverInfo.trainNumber,
    ...event
  }));
}

function getDriverHistoryByUniqueRuns(currentDriverId) {
  currentDriverId =getDriverInfoFromDatabase().driverId
  const historySheet = SpreadsheetApp.openByUrl(url).getSheetByName("Overspeed History");
  if (!historySheet) return [];
  
  const lastRow = historySheet.getLastRow();
  if (lastRow < 2) return [];
  
  const historyData = historySheet.getRange(2, 1, lastRow - 1, 5).getValues();
  const uniqueRunsMap = new Map();
  
  historyData.forEach(row => {
    const [date, driverId, driverName, trainNumber, events] = row;
    
    if (driverId === currentDriverId && Number(events) > 0) {
      // Create consistent date string for comparison
      const dateStr = new Date(date).toISOString().split('T')[0];
      const uniqueKey = `${dateStr}_${driverId}_${trainNumber}`;
      // Logger.log(uniqueKey)
      
      if (!uniqueRunsMap.has(uniqueKey)) {
        uniqueRunsMap.set(uniqueKey, {
          date: dateStr,
          driverId,
          driverName,
          trainNumber,
          events: Number(events),
        });
      } else {
        const existingEvents = uniqueRunsMap.get(uniqueKey).events;
        uniqueRunsMap.get(uniqueKey).events = Math.max(existingEvents, Number(events));
      }
    }
  });
  Logger.log(Array.from(uniqueRunsMap.values()).sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  }))
  const driverHistory = Array.from(uniqueRunsMap.values()).sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
  setDriverHistoryInReportsSheet(driverHistory);
  // Convert to array and sort by date (newest first)
  return Array.from(uniqueRunsMap.values()).sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
  
}

function setDriverHistoryInReportsSheet(driverHistory) {
  var destSheet = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=0#gid=0")
  
  const reportsSheet = destSheet.getSheetByName("Reports");
  if (!reportsSheet) return;
  
  // Set report header
  reportsSheet.getRange(307, 1).setValue("Speed Violation History");
  reportsSheet.getRange(308, 1, 1, 5).setValues([["Date", "Driver ID", "Driver Name", "Train Number", "Events"]]);
  
  // Set driver history data
  const data = driverHistory.map((history) => {
    return [history.date, history.driverId, history.driverName, history.trainNumber, history.events];
  });
  Logger.log(data.length)
  if(data.length>0){
    reportsSheet.getRange(309, 1, data.length, 5).setValues(data);
  }
  
}


function detectBrakeFeelTest_UptoFirstHalt() {
  const sheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  const fullData = sheet.getRange("C1:D").getValues();

  const minPhaseDuration = 5;
  const tolerance = 0.5;

  // Identify the end of the first trip (first halt)
  let validData = [];
  for (let i = 0; i < fullData.length; i++) {
    let speed = parseFloat(fullData[i][0]) || 0;
    let distance = parseFloat(fullData[i][1]) || 0;
    validData.push(speed);

    if (speed === 0 && distance === 0 && i > 0) {
      break;
    }
  }

  let speeds = validData;
  const numRows = speeds.length;
  let result = {
    detected: false,
    startIndex: null,
    startSpeed: null,
    decelStartIndex: null,
    decelEndIndex: null,
    lowestSpeed: null,
    postBrakeIndex: null
  };

  for (let i = 0; i < numRows - 3 * minPhaseDuration; i++) {
    // Step 1: Acceleration phase
    let accelValid = true;
    for (let j = i; j < i + minPhaseDuration - 1; j++) {
      if (speeds[j] > speeds[j + 1] + 0.3) {
        accelValid = false;
        break;
      }
    }
    if (!accelValid) continue;

    // Step 2: Deceleration phase
    let j = i + minPhaseDuration;
    let decelStart = j;
    while (j + 1 < numRows && speeds[j] >= speeds[j + 1]) {
      j++;
    }
    let decelEnd = j;
    if (decelEnd - decelStart < minPhaseDuration) continue;

    // Step 3: Stability or re-acceleration
    let k = decelEnd + 1;
    if (k + minPhaseDuration >= numRows) continue;

    let stable = true;
    let base = speeds[k];
    for (let m = k; m < k + minPhaseDuration; m++) {
      if (Math.abs(speeds[m] - base) > tolerance) {
        stable = false;
        break;
      }
    }

    let rising = true;
    for (let m = k; m < k + minPhaseDuration - 1; m++) {
      if (speeds[m] > speeds[m + 1]) {
        rising = false;
        break;
      }
    }

    if (stable || rising) {
      result.detected = true;
      result.startIndex = i + 1;
      result.startSpeed = speeds[i];
      result.decelStartIndex = decelStart + 1;
      result.decelEndIndex = decelEnd + 1;
      result.lowestSpeed = speeds[decelEnd];
      result.postBrakeIndex = k + 1;
      break;
    }
  }

  // Log and write result
  if (result.detected) {
    Logger.log(`✅ Brake Feel Test Detected`);
    Logger.log(`Start Index: Row ${result.startIndex}, Speed: ${result.startSpeed}`);
    Logger.log(`Deceleration: Row ${result.decelStartIndex} to ${result.decelEndIndex}`);
    Logger.log(`Lowest Speed: ${result.lowestSpeed}`);
    Logger.log(`Post-Brake Index: Row ${result.postBrakeIndex}`);

    sheet.getRange("E1").setValue("BFT Detected");
    sheet.getRange("E2").setValue(`Start at row ${result.startIndex}, speed ${result.startSpeed}`);
    sheet.getRange("E3").setValue(`Dropped to ${result.lowestSpeed} at row ${result.decelEndIndex}`);
    sheet.getRange("E4").setValue(`Resumed at row ${result.postBrakeIndex}`);
  } else {
    Logger.log("❌ No Brake Feel Test Detected");
    sheet.getRange("E1").setValue("No BFT Detected");
  }
}












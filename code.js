function doGet(e) {

  if (e.parameters.v == "report") {
    return loadReport()
  } else if (e.parameters.v == "home") {
    return loadHome()

  } else if (e.parameters.v == "analysis") {
    return loadAnalysis()
  } else if (e.parameters.v == "settings") {
    return loadSettings()
  }
  else {
    return loadView()
  }

}

function loadView() {
  const html = HtmlService.createTemplateFromFile("index");
  return html.evaluate()
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function loadReport() {
  const html = HtmlService.createTemplateFromFile("report");
  return html.evaluate()
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function loadAnalysis() {
  const html = HtmlService.createTemplateFromFile("analysis");
  return html.evaluate()
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


function loadSettings() {
  const html = HtmlService.createTemplateFromFile("settings");
  return html.evaluate()
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {

  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

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

function testDataforChartInPage() {
  var dataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  var lr = dataSheet.getLastRow()
  Logger.log(lr)
  var kmData = dataSheet.getRange("G2:K" + lr).getValues();
  Logger.log(kmData)

}


function adjustTSRDataForTrip(startStation, tsrData) {
  const tripSections = getSectionsForTheTrip(); // Get PSR data

  // Find the section that starts with the given station
  const firstSection = tripSections.find(section => {
    const sectionStart = section[0].split("-")[0]; // Extract first station
    return sectionStart === startStation;
  });

  if (!firstSection) {
    Logger.log(`Start station ${startStation} not found in PSR data!`);
    return [];
  }

  const referenceKM = firstSection[1]; // Starting station’s kilometer  
  Logger.log(`Reference KM for ${startStation}: ${referenceKM}`);

  // Adjust TSR start and end kilometers
  const adjustedTSRData = tsrData.map(tsr => {
    const adjustedStartKm = Math.abs(referenceKM - tsr[0]);
    const adjustedEndKm = Math.abs((referenceKM - tsr[1]));

    // Ensure span is always positive
    const adjustedSpan = Math.abs(adjustedEndKm - adjustedStartKm);

    return [adjustedStartKm, adjustedEndKm, adjustedSpan, tsr[3]];
  });

  Logger.log("Adjusted TSR Data: " + JSON.stringify(adjustedTSRData));
  return adjustedTSRData;
}



function modifyTSRArray() {
  const fromStn = tripStationInfo().fromStation;
  const tsrData = getTSRData();

  const tsrResult = adjustTSRDataForTrip(fromStn, tsrData)
  Logger.log(tsrResult)
  return tsrResult
}


function convertData(url) {
  var sheet = SpreadsheetApp.openByUrl().getSheetByName("UPHB");
  var data = sheet.getDataRange().getValues();
  var stationNames = [];
  var convertedData = [];

  // Extract station names from the first column
  for (var i = 1; i < data.length; i++) {
    stationNames.push(data[i][0]);
  }

  // Transpose the data and add station names as headers
  for (var j = 1; j < data[0].length; j++) {
    var rowData = [data[0][j]]; // Initialize row with the station name
    for (var i = 1; i < data.length; i++) {
      rowData.push(data[i][j]);
    }
    convertedData.push(rowData);
  }

  // Add station names as headers
  convertedData.unshift(stationNames);

  // Write the converted data to a new sheet
  var newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet();
  newSheet.getRange(1, 1, convertedData.length, convertedData[0].length).setValues(convertedData);
}






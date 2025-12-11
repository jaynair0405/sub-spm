 
/**
 * Analyzes the output of previousStationAndDistanceWithSpeed function and creates a chart in Google Sheets.
 */
function analysePreviousStationOutputAndCreateChart() {
  // Get the data from the function
  var chartData = previousStationAndDistanceWithSpeed();

  if (!chartData || chartData.length === 0) {
    Logger.log("No data returned from previousStationAndDistanceWithSpeed function.");
    return; // Exit if no data
  }

  // Get the Spreadsheet and ensure 'Reports' sheet exists
  var spreadsheet = SpreadsheetApp.openByUrl(url);
  Logger.log("Spreadsheet object obtained:", spreadsheet); // Debug: Log spreadsheet object

  var reportsSheetName = "Sheet15";
  Logger.log("Attempting to get sheet:", reportsSheetName); // Debug: Log sheet name

  var reportsSheet = spreadsheet.getSheetByName(reportsSheetName);
  Logger.log("Sheet obtained by name:", reportsSheet); // Debug: Log sheet after getName

  if (!reportsSheet) {
    Logger.log("Sheet not found, attempting to insert:", reportsSheetName); // Debug: Log insert attempt
    reportsSheet = spreadsheet.insertSheet(reportsSheetName);
    Logger.log("Sheet inserted:", reportsSheet); // Debug: Log sheet after insert
  }


  if (!reportsSheet) {
    Logger.log("Error: Could not get or create 'Reports' sheet. Exiting."); // Critical error log
    return; // Exit if still no sheet
  }

  // Clear existing content in Reports sheet (optional, but good practice)
  reportsSheet.clearContents();
  Logger.log("Sheet contents cleared."); // Debug: Log clear contents

  // Prepare data for sheet and chart (rest of data prep is likely fine)
  var headers = ["Station", "Distance", "Speed", "Marker Color"];
  var dataForSheet = [headers];

  chartData.forEach(item => {
    var markerColor = item.speed < 40 ? "green" : "red";
    dataForSheet.push([item.station, item.distance, item.speed, markerColor]);
  });

  // Write data to the Reports sheet
  var dataRange = reportsSheet.getRange(1, 1, dataForSheet.length, dataForSheet[0].length);
  dataRange.setValues(dataForSheet);
  Logger.log("Data written to sheet."); // Debug: Log data write

  // Create the chart
  createStationSpeedChart(reportsSheet);
}

/**
 * Creates a scatter chart in the given sheet based on station speed data.
 *
 * @param {Sheet} sheet The Google Sheet to create the chart in.
 */
function createStationSpeedChart(sheet) {
  Logger.log("Entering createStationSpeedChart function.");
  Logger.log("Sheet object received (inside createStationSpeedChart):", sheet);

  if (!sheet) {
    Logger.log("Error: Sheet object is null or undefined in createStationSpeedChart. Exiting.");
    return;
  }

  Logger.log("Sheet object seems valid (not null).");

  Logger.log("Before sheet.newChart() call."); // Log BEFORE newChart
sheet.getRange("A1").setValue("JAYAKUMAR")
  var chartBuilder = null; // Initialize to null for error checking

  try {
    chartBuilder = sheet.newChart(); // **TRY to create chart builder**
    Logger.log("sheet.newChart() call successful. chartBuilder object:", chartBuilder); // Log AFTER successful newChart
  } catch (e) {
    Logger.log("Error during sheet.newChart() call:", e); // Log ERROR if newChart fails
    return; // Exit if chartBuilder creation fails
  }

  if (!chartBuilder) {
    Logger.log("Error: chartBuilder is null AFTER sheet.newChart() call (even without exception?). This is unexpected.");
    return; // Double check if chartBuilder is null even if no exception
  }


  chartBuilder.setChartType(Charts.ChartType.SCATTER)
      // .setTitle('Test Chart')
      .setPosition(5, 5, 0, 0);

  Logger.log("Chart builder configured. Now building chart."); // Log before build

  var chart = null; // Initialize chart to null
  try {
    chart = chartBuilder.build();
    Logger.log("chartBuilder.build() successful. Chart object:", chart); // Log after successful build
  } catch (e) {
    Logger.log("Error during chartBuilder.build() call:", e); // Log ERROR if build fails
    return; // Exit if build fails
  }


  if (!chart) {
    Logger.log("Error: chart is null AFTER chartBuilder.build() call (even without exception?). Unexpected.");
    return; // Double check if chart is null
  }


  Logger.log("Chart object built successfully. Now inserting chart."); // Log before insert

  try {
    Utilities.sleep(2000); 
    sheet.insertChart(chart);
    Logger.log("sheet.insertChart(chart) successful."); // Log after successful insert
  } catch (e) {
    Logger.log("Error during sheet.insertChart(chart) call:", e); // Log ERROR if insert fails
    return; // Exit if insert fails
  }


  Logger.log("Exiting createStationSpeedChart function AFTER attempting chart creation.");
}
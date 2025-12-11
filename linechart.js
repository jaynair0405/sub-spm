function createBrakingLineChartsInDestinationSheet() {
  try {
    // Configuration constants
    const CONFIG = {
      SPREADSHEET_URL: "https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=0#gid=0",
      SHEET_NAME: "Reports",
      DATA_START_ROW: 13,
      DATA_START_COLUMN: 3, // Column C
      DATA_END_COLUMN: 14,   // Column N
      CHART_WIDTH: 550,      // Reduced width to fit 2 per row
      CHART_HEIGHT: 300,
      CHART_VERTICAL_SPACING: 20,   // Space between rows
      CHART_HORIZONTAL_SPACING: 30, // Space between columns
      CHART_START_ROW: 60,
      CHART_START_COLUMN_LEFT: 2,   // First column position
      CHART_START_COLUMN_RIGHT: 10, // Second column position (adjust based on your sheet)
      CHARTS_PER_ROW: 2,
      MAX_SPEED: 50,
      DISTANCE_MARKERS: ['300m', '130m', '100m', '75m', '50m', '25m', '20m', '15m', '10m', '5m', 'Halt'],
      COLORS: ['#4285f4', '#ea4335', '#fbbc05', '#34a853', '#9c27b0', '#ff9800', '#795548', '#607d8b']
    };

    // Open spreadsheet and get sheet
    const ss = SpreadsheetApp.openByUrl(CONFIG.SPREADSHEET_URL);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet "${CONFIG.SHEET_NAME}" not found`);
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < CONFIG.DATA_START_ROW) {
      Logger.log("No data found in the expected range");
      return;
    }

    // Get data range
    const dataRange = sheet.getRange(CONFIG.DATA_START_ROW, CONFIG.DATA_START_COLUMN, 
                                   lastRow - CONFIG.DATA_START_ROW + 1, 
                                   CONFIG.DATA_END_COLUMN - CONFIG.DATA_START_COLUMN + 1);
    const rawData = dataRange.getValues();

    // Remove existing charts
    removeAllCharts(sheet);

    // Process data sections and create charts
    const chartSections = identifyDataSections(rawData, CONFIG.DATA_START_ROW);
    
    if (chartSections.length === 0) {
      Logger.log("No valid data sections found");
      return;
    }

    Logger.log(`Found ${chartSections.length} data sections`);
    
    chartSections.forEach((section, index) => {
      createChartForSection(sheet, section, index, CONFIG);
    });

    Logger.log(`Successfully created ${chartSections.length} charts`);

  } catch (error) {
    Logger.log(`Error in createBrakingLineChartsInDestinationSheet: ${error.message}`);
    throw error;
  }
}

/**
 * Remove all existing charts from the sheet
 */
function removeAllCharts(sheet) {
  const charts = sheet.getCharts();
  charts.forEach(chart => sheet.removeChart(chart));
  Logger.log(`Removed ${charts.length} existing charts`);
}

/**
 * Identify separate data sections in the raw data
 */
function identifyDataSections(rawData, startRow) {
  const sections = [];
  let currentStart = 0;
  
  for (let i = 0; i < rawData.length; i++) {
    const isEmptyRow = rawData[i][0] === "" || rawData[i][0] == null;
    
    if (isEmptyRow) {
      // End of current section
      if (currentStart < i) {
        sections.push({
          startRow: startRow + currentStart,
          endRow: startRow + i - 1,
          dataRows: i - currentStart
        });
      }
      
      // Find next non-empty row
      while (i < rawData.length && (rawData[i][0] === "" || rawData[i][0] == null)) {
        i++;
      }
      currentStart = i;
      i--; // Adjust for loop increment
    }
  }
  
  // Handle last section if it doesn't end with empty row
  if (currentStart < rawData.length) {
    sections.push({
      startRow: startRow + currentStart,
      endRow: startRow + rawData.length - 1,
      dataRows: rawData.length - currentStart
    });
  }
  
  // Filter out sections with insufficient data
  return sections.filter(section => section.dataRows >= 2);
}

/**
 * Create a chart for a specific data section with 2-column grid layout
 */
function createChartForSection(sheet, section, chartIndex, config) {
  try {
    // Calculate chart range (include one extra column for headers)
    const chartRange = sheet.getRange(
      section.startRow, 
      config.DATA_START_COLUMN, 
      section.dataRows, 
      config.DATA_END_COLUMN - config.DATA_START_COLUMN + 1
    );
    
    // Get section title from first cell
    const sectionTitle = sheet.getRange(section.startRow, config.DATA_START_COLUMN).getValue() || `Section ${chartIndex + 1}`;
    
    // Calculate 2-column grid position
    const rowIndex = Math.floor(chartIndex / config.CHARTS_PER_ROW);
    const colIndex = chartIndex % config.CHARTS_PER_ROW;
    
    // Calculate chart position
    const chartRow = config.CHART_START_ROW + (rowIndex * (config.CHART_HEIGHT + config.CHART_VERTICAL_SPACING));
    const chartColumn = colIndex === 0 ? 
      config.CHART_START_COLUMN_LEFT : 
      config.CHART_START_COLUMN_RIGHT;
    
    Logger.log(`Chart ${chartIndex + 1}: Row ${rowIndex + 1}, Column ${colIndex + 1} at position (${chartRow}, ${chartColumn})`);
    
    // Create and configure the chart
    const chart = sheet.newChart()
      .asLineChart()
      .addRange(chartRange)
      .setPosition(chartRow, chartColumn, 0, 0)
      .setOption('title', `Speed vs Distance - ${sectionTitle}`)
      .setOption('width', config.CHART_WIDTH)
      .setOption('height', config.CHART_HEIGHT)
      .setOption('curveType', 'function')
      .setTransposeRowsAndColumns(true)
      .setOption('useFirstColumnAsHeaders', true)
      .setOption('legend', { 
        position: 'right',
        textStyle: { fontSize: 9 } // Slightly smaller for compact layout
      })
      .setOption('hAxis', {
        title: 'Distance to Stop',
        titleTextStyle: { bold: true, fontSize: 11 },
        textStyle: { fontSize: 9 },
        ticks: config.DISTANCE_MARKERS
      })
      .setOption('vAxis', {
        title: 'Speed (km/h)',
        titleTextStyle: { bold: true, fontSize: 11 },
        textStyle: { fontSize: 9 },
        viewWindow: { min: 0, max: config.MAX_SPEED },
        gridlines: { count: 6 }
      })
      .setOption('lineWidth', 2)
      .setOption('pointSize', 4)
      .setOption('colors', config.COLORS.slice(0, section.dataRows))
      .setOption('backgroundColor', '#ffffff')
      .setOption('chartArea', {
        left: 70,     // Reduced for compact layout
        top: 40,      // Reduced for compact layout
        width: '65%', // Adjusted for smaller chart
        height: '70%'
      })
      .setOption('titleTextStyle', { fontSize: 12 }) // Compact title
      .setNumHeaders(1);

    // Insert the chart
    sheet.insertChart(chart.build());
    Logger.log(`Created chart ${chartIndex + 1} for section starting at row ${section.startRow}`);

  } catch (error) {
    Logger.log(`Error creating chart ${chartIndex + 1}: ${error.message}`);
    throw error;
  }
}

/**
 * Alternative function with additional customization options
 */
function createBrakingLineChartsWithCustomOptions(options = {}) {
  const defaultOptions = {
    spreadsheetUrl: "https://docs.google.com/spreadsheets/d/1NniWYZ3oXRhCYmdKR_8T8PBEFDYDHMaB97aePvRLSSQ/edit",
    sheetName: "Reports",
    chartTitle: "Speed vs Distance",
    maxSpeed: 50,
    showGridlines: true,
    chartSpacing: 15
  };
  
  const config = { ...defaultOptions, ...options };
  
  // Implementation would use the config object
  // This allows for more flexible usage
}


function debugBrakingLineCharts() {
  try {
    const ss = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=0#gid=0");
    const sheet = ss.getSheetByName("Reports");
    
    if (!sheet) {
      Logger.log("ERROR: Sheet 'Reports' not found");
      return;
    }
    
    const lastRow = sheet.getLastRow();
    Logger.log(`Last row with data: ${lastRow}`);
    
    // Debug: Check data range
    const dataRange = sheet.getRange("C13:N" + lastRow);
    const rawData = dataRange.getValues();
    
    Logger.log(`Data range: C13:N${lastRow}`);
    Logger.log(`Raw data rows: ${rawData.length}`);
    
    // Log first few rows to see data structure
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      Logger.log(`Row ${13 + i}: [${rawData[i].join(', ')}]`);
    }
    
    // Check for sections
    let sections = [];
    let currentStart = 0;
    
    for (let i = 0; i < rawData.length; i++) {
      const firstCell = rawData[i][0];
      const isEmpty = firstCell === "" || firstCell == null || firstCell === undefined;
      
      Logger.log(`Row ${13 + i}: First cell = "${firstCell}", isEmpty = ${isEmpty}`);
      
      if (!isEmpty && currentStart === -1) {
        // Start of new section
        currentStart = i;
        Logger.log(`Section starts at row ${13 + i}`);
      } else if (isEmpty && currentStart !== -1) {
        // End of section
        sections.push({
          startRow: 13 + currentStart,
          endRow: 13 + i - 1,
          dataRows: i - currentStart
        });
        Logger.log(`Section ends: rows ${13 + currentStart} to ${13 + i - 1} (${i - currentStart} rows)`);
        currentStart = -1;
      }
    }
    
    // Handle last section if it doesn't end with empty row
    if (currentStart !== -1) {
      sections.push({
        startRow: 13 + currentStart,
        endRow: 13 + rawData.length - 1,
        dataRows: rawData.length - currentStart
      });
      Logger.log(`Final section: rows ${13 + currentStart} to ${13 + rawData.length - 1}`);
    }
    
    Logger.log(`Total sections found: ${sections.length}`);
    
    // Test creating one chart with the first section
    if (sections.length > 0) {
      const testSection = sections[0];
      Logger.log(`Testing chart creation with section: ${JSON.stringify(testSection)}`);
      
      const chartRange = sheet.getRange(testSection.startRow, 3, testSection.dataRows, 12);
      Logger.log(`Chart range: ${chartRange.getA1Notation()}`);
      
      // Log the actual data in this range
      const chartData = chartRange.getValues();
      Logger.log("Chart data:");
      chartData.forEach((row, index) => {
        Logger.log(`  Row ${index}: [${row.join(', ')}]`);
      });
    }
    
  } catch (error) {
    Logger.log(`Debug error: ${error.message}`);
    Logger.log(`Stack trace: ${error.stack}`);
  }
}

// Simplified version that mimics your original working function
function createBrakingLineChartsSimple() {
  const ss = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=0#gid=0");
  const sheet = ss.getSheetByName("Reports");
  
  const dataRange = sheet.getRange("C13:N" + sheet.getLastRow());
  const rawData = dataRange.getValues();

  // Remove existing charts
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
    const chartRange = sheet.getRange(startRow, 3, endRow - startRow + 1, 12);
    
    // Calculate 2-column grid position (NEW PART)
    const rowIndex = Math.floor(chartIndex / 2);
    const colIndex = chartIndex % 2;
    
    const chartRow = 60 + (rowIndex * 20); // 20 pixels between rows
    const chartColumn = colIndex === 0 ? 2 : 10; // Left column = 2, Right column = 10
    
    // Create the chart with 2-column layout
    const chart = sheet.newChart()
      .asLineChart()
      .addRange(chartRange)
      .setPosition(chartRow, chartColumn, 0, 0) // Updated position
      .setOption('title', `Speed vs Distance`)
      .setOption('width', 550) // Reduced width for 2-column layout
      .setOption('height', 300)
      .setOption('curveType', 'function')
      .setTransposeRowsAndColumns(true)
      .setOption('useFirstColumnAsHeaders', true)
      .setOption('legend', { position: 'right' })
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
      .setOption('colors', colors) // Use the colors array
      .setNumHeaders(1);
      
    // Insert the chart
    sheet.insertChart(chart.build());
    
    // Move to the next section
    startRow = endRow + 1;
    chartIndex++;
  }
}


function createBrakingLineChartsFixed() {
  const ss = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=0#gid=0");
  const sheet = ss.getSheetByName("Reports");
  
  // Define the specific data range - only C13 to C52
  const DATA_START_ROW = 13;
  const DATA_END_ROW = 52;
  const DATA_START_COLUMN = 3; // Column C
  const DATA_END_COLUMN = 14;  // Column N
  
  const dataRange = sheet.getRange(DATA_START_ROW, DATA_START_COLUMN, DATA_END_ROW - DATA_START_ROW + 1, DATA_END_COLUMN - DATA_START_COLUMN + 1);
  const rawData = dataRange.getValues();

  // Remove existing charts
  var charts = sheet.getCharts();
  for (var i = 0; i < charts.length; i++) {
    sheet.removeChart(charts[i]);
  }
  
  // Colors for stations
  const colors = ['#4285f4', '#ea4335', '#fbbc05', '#34a853'];
  
  let chartIndex = 0;
  let startRow = DATA_START_ROW;
  
  while (startRow <= DATA_END_ROW) {
    // Find the start of the data section (skip empty rows)
    while (startRow <= DATA_END_ROW && (rawData[startRow - DATA_START_ROW][0] === "" || rawData[startRow - DATA_START_ROW][0] == null)) {
      startRow++;
    }
    
    // If we've reached the end, break
    if (startRow > DATA_END_ROW) {
      break;
    }
    
    // Find the end of the current data section
    let endRow = startRow;
    while (endRow <= DATA_END_ROW && rawData[endRow - DATA_START_ROW][0] !== "" && rawData[endRow - DATA_START_ROW][0] != null) {
      endRow++;
    }
    endRow--; // Step back to last row with data
    
    // Validate we have enough data for a meaningful chart (at least 2 rows)
    const sectionRows = endRow - startRow + 1;
    if (sectionRows < 2) {
      startRow = endRow + 1;
      continue; // Skip sections with insufficient data
    }
    
    // Check if section has actual speed data (not all zeros/empty)
    let hasValidData = false;
    for (let row = startRow; row <= endRow; row++) {
      for (let col = 1; col < rawData[row - DATA_START_ROW].length; col++) { // Skip first column (station names)
        const cellValue = rawData[row - DATA_START_ROW][col];
        if (cellValue !== "" && cellValue != null && cellValue !== 0) {
          hasValidData = true;
          break;
        }
      }
      if (hasValidData) break;
    }
    
    // Only create chart if section has valid data
    if (hasValidData) {
      // Define the range for this chart section
      const chartRange = sheet.getRange(startRow, DATA_START_COLUMN, sectionRows, DATA_END_COLUMN - DATA_START_COLUMN + 1);
      
      // Calculate 2-column grid position with reduced spacing
      const rowIndex = Math.floor(chartIndex / 2);
      const colIndex = chartIndex % 2;
      
      const chartRow = 60 + (rowIndex * 15); // Reduced vertical spacing from 20 to 15
      const chartColumn = colIndex === 0 ? 2 : 9; // Reduced horizontal spacing (2 and 9 instead of 2 and 10)
      
      // Get section title from first cell for better chart naming
      const sectionTitle = rawData[startRow - DATA_START_ROW][0] || `Section ${chartIndex + 1}`;
      
      // Create the chart
      const chart = sheet.newChart()
        .asLineChart()
        .addRange(chartRange)
        .setPosition(chartRow, chartColumn, 0, 0)
        .setOption('title', `Speed vs Distance - ${sectionTitle}`)
        .setOption('width', 520) // Slightly reduced width for better fit
        .setOption('height', 280) // Slightly reduced height
        .setOption('curveType', 'function')
        .setTransposeRowsAndColumns(true)
        .setOption('useFirstColumnAsHeaders', true)
        .setOption('legend', { 
          position: 'right',
          textStyle: { fontSize: 9 }
        })
        .setOption('hAxis', {
          title: 'Distance',
          titleTextStyle: { bold: true, fontSize: 10 },
          textStyle: { fontSize: 9 },
          ticks: ['300m', '130m', '100m', '75m', '50m', '25m', '20m', '15m', '10m', '5m', 'Halt']
        })
        .setOption('vAxis', {
          title: 'Speed',
          titleTextStyle: { bold: true, fontSize: 10 },
          textStyle: { fontSize: 9 },
          viewWindow: {
            min: 0,
            max: 50
          }
        })
        .setOption('lineWidth', 2)
        .setOption('pointSize', 4)
        .setOption('colors', colors)
        .setOption('titleTextStyle', { fontSize: 11 })
        .setNumHeaders(1);
        
      // Insert the chart
      sheet.insertChart(chart.build());
      
      Logger.log(`Created chart ${chartIndex + 1}: "${sectionTitle}" (rows ${startRow}-${endRow})`);
      chartIndex++;
    } else {
      Logger.log(`Skipped section at rows ${startRow}-${endRow}: No valid data`);
    }
    
    // Move to the next section
    startRow = endRow + 1;
  }
  
  Logger.log(`Total charts created: ${chartIndex}`);
}

// Alternative version with even more customization
function createBrakingLineChartsCustomRange(startRow = 13, endRow = 52) {
  const ss = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=0#gid=0");
  const sheet = ss.getSheetByName("Reports");
  
  // Use custom range parameters
  const DATA_START_ROW = startRow;
  const DATA_END_ROW = endRow;
  const DATA_START_COLUMN = 3; // Column C
  const DATA_END_COLUMN = 14;  // Column N
  
  const dataRange = sheet.getRange(DATA_START_ROW, DATA_START_COLUMN, DATA_END_ROW - DATA_START_ROW + 1, DATA_END_COLUMN - DATA_START_COLUMN + 1);
  const rawData = dataRange.getValues();

  // Remove existing charts
  var charts = sheet.getCharts();
  for (var i = 0; i < charts.length; i++) {
    sheet.removeChart(charts[i]);
  }
  
  const colors = ['#4285f4', '#ea4335', '#fbbc05', '#34a853'];
  let chartIndex = 0;
  let currentRow = DATA_START_ROW;
  
  while (currentRow <= DATA_END_ROW) {
    // Find start of data section
    while (currentRow <= DATA_END_ROW && (rawData[currentRow - DATA_START_ROW][0] === "" || rawData[currentRow - DATA_START_ROW][0] == null)) {
      currentRow++;
    }
    
    if (currentRow > DATA_END_ROW) break;
    
    // Find end of data section
    let sectionEnd = currentRow;
    while (sectionEnd <= DATA_END_ROW && rawData[sectionEnd - DATA_START_ROW][0] !== "" && rawData[sectionEnd - DATA_START_ROW][0] != null) {
      sectionEnd++;
    }
    sectionEnd--;
    
    // Validate section
    const sectionRows = sectionEnd - currentRow + 1;
    if (sectionRows >= 2) {
      // Check for valid data
      let hasData = false;
      for (let r = currentRow; r <= sectionEnd && !hasData; r++) {
        for (let c = 1; c < rawData[r - DATA_START_ROW].length; c++) {
          if (rawData[r - DATA_START_ROW][c] !== "" && rawData[r - DATA_START_ROW][c] != null && rawData[r - DATA_START_ROW][c] !== 0) {
            hasData = true;
            break;
          }
        }
      }
      
      if (hasData) {
        const chartRange = sheet.getRange(currentRow, DATA_START_COLUMN, sectionRows, DATA_END_COLUMN - DATA_START_COLUMN + 1);
        
        const rowIndex = Math.floor(chartIndex / 2);
        const colIndex = chartIndex % 2;
        const chartRow = 60 + (rowIndex * 15);
        const chartColumn = colIndex === 0 ? 2 : 9;
        
        const sectionTitle = rawData[currentRow - DATA_START_ROW][0] || `Section ${chartIndex + 1}`;
        
        const chart = sheet.newChart()
          .asLineChart()
          .addRange(chartRange)
          .setPosition(chartRow, chartColumn, 0, 0)
          .setOption('title', `Speed vs Distance - ${sectionTitle}`)
          .setOption('width', 520)
          .setOption('height', 280)
          .setOption('curveType', 'function')
          .setTransposeRowsAndColumns(true)
          .setOption('useFirstColumnAsHeaders', true)
          .setOption('legend', { position: 'right', textStyle: { fontSize: 9 } })
          .setOption('hAxis', {
            title: 'Distance',
            titleTextStyle: { bold: true, fontSize: 10 },
            textStyle: { fontSize: 9 },
            ticks: ['300m', '130m', '100m', '75m', '50m', '25m', '20m', '15m', '10m', '5m', 'Halt']
          })
          .setOption('vAxis', {
            title: 'Speed',
            titleTextStyle: { bold: true, fontSize: 10 },
            textStyle: { fontSize: 9 },
            viewWindow: { min: 0, max: 50 }
          })
          .setOption('lineWidth', 2)
          .setOption('pointSize', 4)
          .setOption('colors', colors)
          .setOption('titleTextStyle', { fontSize: 11 })
          .setNumHeaders(1);
          
        sheet.insertChart(chart.build());
        chartIndex++;
      }
    }
    
    currentRow = sectionEnd + 1;
  }
}
//*********************************************** //

// Updated function to find only the FIRST significant speed drop
function analyzeSpeedDrops(chartData) {
  Logger.log("analyzeSpeedDrops: START - Looking for FIRST significant speed drop only");

  const significantPoints = {
    highPoints: [],
    lowPoints: []
  };

  let foundFirstDrop = false;
  let testLimitIndex = -1;
  let testLimitSpeed = -1;

  for (let i = 1; i < chartData.length - 1 && !foundFirstDrop; i++) {
    const currentSpeed = chartData[i].speed;
    const prevSpeed = chartData[i - 1].speed;
    const nextSpeed = chartData[i + 1].speed;

    // 🚫 Stop checking once speed crosses 40 kmph
    if (currentSpeed > 40) {
      Logger.log(`Speed crossed 40 kmph at index ${i}, time=${chartData[i].time}, speed=${currentSpeed}`);
      testLimitIndex = i;
      testLimitSpeed = currentSpeed;
      break;
    }

    // ✅ Look for peak (within 15–40 range)
    if (currentSpeed >= prevSpeed && currentSpeed > nextSpeed && currentSpeed > 15 && currentSpeed <= 40) {
      let minSpeed = currentSpeed;
      let minIndex = i;

      for (let j = i + 1; j < Math.min(i + 50, chartData.length); j++) {
        if (chartData[j].speed < minSpeed) {
          minSpeed = chartData[j].speed;
          minIndex = j;
        }

        if (j > minIndex + 5 && chartData[j].speed > minSpeed + 3) break;
      }

      const speedDrop = currentSpeed - minSpeed;
      if (speedDrop > 5) {
        significantPoints.highPoints.push({
          index: i,
          time: chartData[i].time,
          speed: currentSpeed
        });

        significantPoints.lowPoints.push({
          index: minIndex,
          time: chartData[minIndex].time,
          speed: minSpeed,
          drop: speedDrop.toFixed(1)
        });

        Logger.log(`Found FIRST significant drop: Peak ${currentSpeed} km/h at ${chartData[i].time}, Low ${minSpeed} km/h at ${chartData[minIndex].time}, Drop: ${speedDrop.toFixed(1)} km/h`);
        Logger.log("Criteria: Peak speed between 15-40 km/h with drop >5 km/h");
        foundFirstDrop = true;
      }
    }
  }

  if (!foundFirstDrop && testLimitIndex !== -1) {
    // ❌ Speed exceeded 40 and no BFT was found
    significantPoints.noTestFound = true;
    significantPoints.testLimitIndex = testLimitIndex;
    significantPoints.testLimitSpeed = testLimitSpeed;
    Logger.log("analyzeSpeedDrops: NO Brake Feel Test found before speed exceeded 40 kmph");
  }

  Logger.log("analyzeSpeedDrops: END");
  return significantPoints;
}







function createStartToFirstHaltChartOnSheet() {

  const bftReportsheetUrl = "https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=1526749896#gid=1526749896"
  Logger.log("createStartToFirstHaltChartOnSheet: START");

  try {
    // 1. Get data
    const chartData = getStartToFirstHaltData();
    if (!chartData || chartData.length === 0) {
      Logger.log("createStartToFirstHaltChartOnSheet: No data available");
      return "No data available for chart";
    }
    Logger.log("Chart Data Sample: " + JSON.stringify(chartData.slice(0, 5)));
    Logger.log("Data Length: " + chartData.length);

    // 2. Analyze drop
    const significantPoints = analyzeSpeedDrops(chartData);
    Logger.log("Significant Points: " + JSON.stringify(significantPoints));

    // 3. Get sheet
    const ss = SpreadsheetApp.openByUrl(bftReportsheetUrl);
    const reportsSheet = ss.getSheetByName("BFT");
    if (!reportsSheet) {
      Logger.log("Reports sheet not found");
      return "Reports sheet not found";
    }

    // 4. Clear old data
    const startRow = 2;
    const startCol = 2;
    reportsSheet.getRange(startRow, startCol, 500, 5).clear();

    // 5. Prepare header
    const includeNoTestColumn = significantPoints.noTestFound === true;
    const sheetData = [["Time", "Speed (km/h)", "High Points", "Low Points"]];
    if (includeNoTestColumn) sheetData[0].push("No Test Found");

    // 6. Mark points
    const highPointIndices = new Set(significantPoints.highPoints.map(p => p.index));
    const lowPointIndices = new Set(significantPoints.lowPoints.map(p => p.index));

    chartData.forEach((point, index) => {
      const row = [
        point.time,
        point.speed,
        highPointIndices.has(index) ? point.speed : null,
        lowPointIndices.has(index) ? point.speed : null
      ];

      if (includeNoTestColumn) {
        const noTestPoint = index <= significantPoints.testLimitIndex ? point.speed : null;
        row.push(noTestPoint);
      }

      sheetData.push(row);
    });

    // 7. Write data (correct column count!)
    const dataWriteRange = reportsSheet.getRange(startRow, startCol, sheetData.length, sheetData[0].length);
    dataWriteRange.setValues(sheetData);
    Logger.log("Data written to: " + dataWriteRange.getA1Notation());

    // 8. Remove old charts
    reportsSheet.getCharts().forEach(chart => {
      const position = chart.getContainerInfo();
      if (position.getAnchorRow() >= startRow && position.getAnchorRow() <= startRow + 30) {
        reportsSheet.removeChart(chart);
        Logger.log("Removed existing chart");
      }
    });

    // 9. Build chart
    const chartRange = reportsSheet.getRange(startRow, startCol, sheetData.length, 5); // fixed to 5 columns
    const chartBuilder = reportsSheet.newChart()
      .setChartType(Charts.ChartType.LINE)
      .addRange(chartRange)
      .setPosition(startRow, startCol + 7, 0, 0)
      .setOption('title', significantPoints.noTestFound ?
        'Speed Profile - NO Brake Feel Test Found Till 40 Kmph' :
        'Speed Profile - First Significant Speed Drop Highlighted for Brake Feel Test analysis')
      .setOption('width', 800)
      .setOption('height', 500)
      .setOption('curveType', 'function')
      .setOption('legend', {
        position: 'bottom',
        textStyle: { fontSize: 10 }
      })
      .setOption('hAxis', {
        title: 'Time',
        gridlines: {
          count: Math.min(15, Math.ceil(chartData.length / 10)),
          color: '#e0e0e0'
        },
        slantedText: true,
        slantedTextAngle: 45,
        textStyle: { fontSize: 9 }
      })
      .setOption('vAxis', {
        ticks: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
        gridlines: { count: 11, color: 'lightgray' }
      })
      .setOption('series', {
        0: {
          color: '#4285f4',
          lineWidth: 2,
          pointSize: 0,
          visibleInLegend: !significantPoints.noTestFound,
          labelInLegend: 'Speed Profile'
        },
        1: {
          color: '#ea4335',
          lineWidth: 0,
          pointSize: 10,
          pointShape: 'circle',
          visibleInLegend: !significantPoints.noTestFound && significantPoints.highPoints.length > 0,
          labelInLegend: 'First Speed Peak (15-40 km/h)'
        },
        2: {
          color: '#ff9800',
          lineWidth: 0,
          pointSize: 10,
          pointShape: 'triangle',
          visibleInLegend: !significantPoints.noTestFound && significantPoints.lowPoints.length > 0,
          labelInLegend: 'Corresponding Speed Drop (>5 km/h)'
        },
        3: {
          color: '#ff0000',
          lineWidth: 3,
          pointSize: 0,
          visibleInLegend: significantPoints.noTestFound,
          labelInLegend: 'No Brake Test Found (Up to 40-42 km/h)'
        }
      });

    // 10. Insert chart
    // 10. Insert chart
// const chart = chartBuilder.build(); // ✅ Add this
// reportsSheet.insertChart(chart);    // ✅ Now this will work
// Logger.log("Chart inserted");
const reportsTab = ss.getSheetByName("Reports");
    if (!reportsTab) {
      Logger.log("Reports sheet not found");
      return "Reports sheet not found";
    }

    const chart = chartBuilder.build();
    reportsTab.insertChart(chart);

    // Move the chart to (row 315, column 2)
    const charts = reportsTab.getCharts();
    const insertedChart = charts[charts.length - 1]; // Most recently inserted
    const repositionedChart = insertedChart.modify().setPosition(315, 2, 0, 0).build();
    reportsTab.updateChart(repositionedChart);
    Logger.log("Chart inserted in 'Reports' sheet at row 315, column 2");

    // 11. Return summary
    let summary;
    if (significantPoints.noTestFound) {
      summary = `NO Brake Feel Test Found Till 40 Kmph.\n`;
      summary += `Speed exceeded tolerance at ${chartData[significantPoints.testLimitIndex].time} (${significantPoints.testLimitSpeed} km/h)\n`;
      summary += `Chart shows speed profile up to 40-42 km/h range in red.`;
    } else if (significantPoints.highPoints.length > 0) {
      const high = significantPoints.highPoints[0];
      const low = significantPoints.lowPoints[0];
      summary = `Chart created with FIRST significant speed drop highlighted:\n`;
      summary += `• Peak: ${high.speed} km/h at ${high.time} → Low: ${low.speed} km/h at ${low.time} (Drop: ${low.drop} km/h)`;
    } else {
      summary = `Chart created - No significant speed drops found meeting criteria (15-40 km/h peak with >5 km/h drop)`;
    }

    Logger.log("Summary: " + summary);
    Logger.log("createStartToFirstHaltChartOnSheet: END");

    return summary;

  } catch (error) {
    Logger.log("createStartToFirstHaltChartOnSheet: Error - " + error.toString());
    return "Error creating chart: " + error.toString();
  }
}






// Helper function to get data from start to first halt (same as before)
function getStartToFirstHaltData() {
  Logger.log("getStartToFirstHaltData: START");
  
  // Get SPM data
  const spmDataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  const spmData = spmDataSheet.getRange("A2:F" + spmDataSheet.getLastRow()).getValues();
  
  if (!spmData || spmData.length === 0) {
    Logger.log("getStartToFirstHaltData: No SPM data found");
    return [];
  }
  
  // Find the first actual halt (not the starting point)
  let firstHaltIndex = -1;
  let hasStartedMoving = false;
  
  for (let i = 0; i < spmData.length; i++) {
    const speed = spmData[i][2]; // Column C (Speed)
    const distance = spmData[i][3]; // Column D (Distance)
    
    // Check if train has started moving (speed > 0 or distance > 0)
    if (speed > 0 || distance > 0) {
      hasStartedMoving = true;
    }
    
    // If train has started moving and now we find speed = 0 and distance = 0, this is the first halt
    if (hasStartedMoving && speed == 0 && distance == 0) {
      firstHaltIndex = i;
      break;
    }
  }
  
  if (firstHaltIndex === -1) {
    Logger.log("getStartToFirstHaltData: No halt found in data after movement started");
    return [];
  }
  
  Logger.log("getStartToFirstHaltData: First halt found at index " + firstHaltIndex);
  Logger.log("getStartToFirstHaltData: Train started moving and halted at row " + (firstHaltIndex + 2)); // +2 because we start from A2
  
  // Extract data from start (index 0) to first halt
  const chartData = [];
  for (let i = 0; i <= firstHaltIndex; i++) {
    const row = spmData[i];
    const time = row[1]; // Column B (Time)
    const speed = row[2]; // Column C (Speed)
    
    // Convert time to a readable format if needed
    let timeLabel = time;
    if (time instanceof Date) {
      timeLabel = Utilities.formatDate(time, Session.getScriptTimeZone(), "HH:mm:ss");
    } else if (typeof time === 'string') {
      timeLabel = time;
    } else {
      timeLabel = time.toString();
    }
    
    chartData.push({
      time: timeLabel,
      speed: speed
    });
  }
  
  Logger.log("getStartToFirstHaltData: Collected " + chartData.length + " data points");
  Logger.log("getStartToFirstHaltData: First few points:");
  for (let i = 0; i < Math.min(5, chartData.length); i++) {
    Logger.log("  Point " + i + ": Time=" + chartData[i].time + ", Speed=" + chartData[i].speed);
  }
  Logger.log("getStartToFirstHaltData: Last few points:");
  for (let i = Math.max(0, chartData.length - 3); i < chartData.length; i++) {
    Logger.log("  Point " + i + ": Time=" + chartData[i].time + ", Speed=" + chartData[i].speed);
  }
  Logger.log("getStartToFirstHaltData: END");
  
  return chartData;
}

// Function to call from your web app to create the chart
function generateStartToFirstHaltChart() {
  // You'll need to provide the sheet URL here
  const sheetUrl = "https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=1526749896#gid=1526749896"; // Replace with your actual sheet URL
  return createStartToFirstHaltChartOnSheet(sheetUrl);
}










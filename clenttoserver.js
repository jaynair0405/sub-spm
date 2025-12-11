function saveFormData(formData) {
  const spreadsheet = SpreadsheetApp.openByUrl(url);
  const sheet = spreadsheet.getSheetByName('Database');
  
  // Prepare Data Array to Append
  const data = [
    formData.workingDate,
    formData.mmanId,
    formData.mmanName,  
    formData.trainNumber,
    formData.fromStation,
    formData.toStation,
    formData.unitNumber,
    formData.rakeType,  
    getShed(formData.shed),
    formData.ncli,  
    formData.analysingCli,  
    new Date(),  
    getTrainType(formData.trainType),
    formData.wheelDia
  ];

  // Append to the Next Available Row
  sheet.appendRow(data);
  
  const tsrSheet = spreadsheet.getSheetByName('TSR Data');
  const lastRow = tsrSheet.getLastRow();
  
  if (lastRow > 1) {
    tsrSheet.getRange("A2:D" + lastRow).clearContent();
  }
  
  return "Success";
}

// Server-side Apps Script code
function getTrainData() {
  // Open the spreadsheet using the URL (replace with your URL)
  const ss = SpreadsheetApp.openByUrl(url);
  const sheet = ss.getSheetByName('Fast Locals');
  
  // Get all data from columns A to C (excluding header)
  const data = sheet.getRange('A2:C' + sheet.getLastRow()).getValues();
  Logger.log( data.filter(row => row[0] !== ''))
  // Filter out empty rows
  return data.filter(row => row[0] !== '');
}

function getAllLocalData() {
  // Open the spreadsheet using the URL (replace with your URL)
  const ss = SpreadsheetApp.openByUrl(url);
  const sheet = ss.getSheetByName('All Locals');
  
  // Get all data from columns A to C (excluding header)
  const data = sheet.getRange('A2:B' + sheet.getLastRow()).getValues();
  Logger.log( data.filter(row => row[0] !== ''))
  // Filter out empty rows
  return data.filter(row => row[0] !== '');
}

// Convert Train Type to Text
function getTrainType(value) {
  const types = { "1": "Slow", "2": "Fast", "3": "Semifast" };
  return types[value] || "Unknown";
}

// Convert Shed to Text
function getShed(value) {
  const sheds = { "1": "KCS", "2": "NCS", "3": "SNPD" };
  return sheds[value] || "Unknown";
}

function getStaffName(crewCMSId){

   var ss = SpreadsheetApp.openByUrl(url)
   var ws =ss.getSheetByName("StaffData")

   var staffData =ws.getRange(2,1,ws.getLastRow(),4).getValues()
   var crewIdList =staffData.map(function(r){return r[0]})
   var crewNameList =staffData.map(function(r){return r[1]}) 
   var position = crewIdList.indexOf(crewCMSId)
   Logger.log(crewNameList[position])
    if(position>-1){
        return crewNameList[position]
    }else{
      return "Crew Not Found"
    }   

}
 
function getStaffLI(crewCMSId){

   var ss = SpreadsheetApp.openByUrl(url)
   var ws =ss.getSheetByName("StaffData")

   var staffData =ws.getRange(2,1,ws.getLastRow(),4).getValues()
   var crewIdList =staffData.map(function(r){return r[0]})
   var crewCLIList =staffData.map(function(r){return r[3]}) 
   var position = crewIdList.indexOf(crewCMSId)
   Logger.log(crewCLIList[position])
    if(position>-1){
        return crewCLIList[position]
    }else{
      return "CLI Not Found"
    }  
  
}
function getAllStaffData() {
  const sheet = SpreadsheetApp.openByUrl(url).getSheetByName("StaffData");
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();  // Get columns A to D
  return data.map(row => row.map(value => value || "-"));  // Replace empty cells with '-'
}


function getAllCLIData() {
  const sheet = SpreadsheetApp.openByUrl(url).getSheetByName("CLI Data");
  const data = sheet.getRange(2, 2, sheet.getLastRow() - 1, 2).getValues();  // Get columns B and C
  return data.map(row => row.map(value => value || "-"));  // Replace empty cells with '-'
}

function getAndPopulateCLIData() {
  const sheet = SpreadsheetApp.openByUrl(url).getSheetByName("CLI Data");
  const data = sheet.getRange(2, 2, sheet.getLastRow() - 1, 2).getValues(); // Get columns A and B (CLI ID and CLI Name)
  return data.map(row => ({ id: row[0], name: row[1] })); // Map to an array of objects
}


function getCurrentMManDetails() {
  const ss = SpreadsheetApp.openByUrl(url);
  const sheet = ss.getSheetByName("Database");
  const lastRow = sheet.getLastRow();
  
  // Get the last row data
  const lastRowData = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  return {
    mmanId: lastRowData[1],  // Column B - MMan ID
    mmanName: lastRowData[2]  // Column C - MMan Name
  };
}

// Function to get previous analysis data for a specific MMan
function getPreviousAnalysis() {
  const ss = SpreadsheetApp.openByUrl(url);
  const sheet = ss.getSheetByName("Database");
  
  // Get current MMan details
  const currentMMan = getCurrentMManDetails();
  const mmanId = currentMMan.mmanId;
  
  const data = sheet.getDataRange().getValues();
  const records = data.slice(1);  // Remove header row
  
  // Filter records for the specific MMan
  const mmanRecords = records.filter(row => row[1] === mmanId);
  
  // Sort by date in descending order (most recent first)
  mmanRecords.sort((a, b) => new Date(b[0]) - new Date(a[0]));
  
  const totalRecords = mmanRecords.length;
  const recentRecords = mmanRecords.slice(0, 10);
  
  const displayRecords = recentRecords.map(row => ({
     dateOfWorking: row[0],
    trainNo: row[3],
    fromStation: row[4],
    toStation: row[5],
    futureUse1: "",
    futureUse2: ""
  }));
  Logger.log(currentMMan)
  Logger.log(displayRecords)
  return {
     records: JSON.stringify(displayRecords),
    totalCount: totalRecords,
    displayCount: displayRecords.length,
    mmanName: currentMMan.mmanName
  };
}

function saveTsrData(tsrData) {
  const ss = SpreadsheetApp.openByUrl(url);
  const sheet = ss.getSheetByName('TSR Data');
  sheet.getRange(2, 1, sheet.getLastRow(), 4).clearContent()
  // Append the data to the sheet
  if (tsrData.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, tsrData.length, tsrData[0].length)
         .setValues(tsrData);
  }
  
  return true;
}


function checkMManId(crewCMSId) {
  var ss = SpreadsheetApp.openByUrl(url); // Make sure 'url' is defined correctly
  var ws = ss.getSheetByName("StaffData"); // Replace "StaffData" with your actual sheet name

  // Get only the MMan IDs from the sheet (more efficient)
  var crewIdList = ws.getRange(2, 1, ws.getLastRow() - 1, 1).getValues().flat(); // Column A (index 1)

  // Check if the MMan ID exists in the list
  if (crewIdList.includes(crewCMSId)) {
    return { success: false, message: "Error: MMan ID already exists. Please confirm the MMan CMS ID and retry." };
  } else {
    return { success: true, message: "MMan ID is available. Please enter the MMan's details." };
  }
}

function addMManToSheet(mmanData) {
  var ss = SpreadsheetApp.openByUrl(url); 
  var ws = ss.getSheetByName("StaffData"); 

  try {
    ws.appendRow([
      mmanData.newmmanId,
      mmanData.name,
      mmanData.mobile,
      mmanData.cli
    ]);

    return { success: true, message: "New MMan added successfully!" };
  } catch (e) {
    return { success: false, message: "Error adding MMan: " + e.toString() };
  }
}

function updateStaffDetails(mmanId, newMobile, newCliName) {
  var ss = SpreadsheetApp.openByUrl(url); 
  var ws = ss.getSheetByName("StaffData"); 

  try {
    // Get all the data from the sheet
    var data = ws.getDataRange().getValues();

    // Find the row with the matching MMan ID
    for (var i = 1; i < data.length; i++) { // Start from 1 to skip the header row
      if (data[i][0] === mmanId) { // Assuming MMan ID is in the first column (index 0)
        // Update the mobile number and CLI
        data[i][2] = newMobile; // Assuming Mobile Number is in the third column (index 2)
        // Get the CLI name from the "CLI Data" sheet
        var cliName = newCliName;
        if (cliName) {
          data[i][3] = cliName; // Assuming CLI is in the fourth column (index 3)
        } else {
          return { success: false, message: "Error: CLI ID not found in 'CLI Data' sheet." };
        }

        // Write the updated data back to the sheet
        ws.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]); // i + 1 to account for the header row

        return { success: true, message: "MMan details updated successfully!" };
      }
    }

    return { success: false, message: "Error: MMan ID not found in 'StaffData' sheet." };
  } catch (e) {
    return { success: false, message: "Error updating MMan details: " + e.toString() };
  }
}

function addCliToSheet(cliData) {
  var ss = SpreadsheetApp.openByUrl(url); // Make sure 'url' is defined correctly
  var ws = ss.getSheetByName("CLI Data"); // Replace "CLI Data" with your actual sheet name

  try {
    // Get the last row number
    var lastRow = ws.getLastRow();

    // Calculate the new S.No.
    var newSrNo = lastRow;

    ws.appendRow([
      newSrNo,
      cliData.cliId,
      cliData.cliName
    ]);

    return { success: true, message: "New CLI added successfully!" };
  } catch (e) {
    return { success: false, message: "Error adding CLI: " + e.toString() };
  }
}


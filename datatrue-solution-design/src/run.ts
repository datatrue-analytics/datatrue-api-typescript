function run() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getActiveSheet();

  const lookups = {};

  ss.getSheetByName("Lookups").getRange("A1:B").getValues().some(row => {
    if (row[0] === "") {
      return;
    }
    lookups[row[0]] = row[1];
  });

  DataTrue.managementToken = lookups["management_token"];
  DataTrue.ciToken = lookups["ci_token"];
  DataTrue.apiEndpoint = lookups["api_endpoint"] || DataTrue.apiEndpoint;

  const testID: number = parseInt(sheet.getRange("B7").getValue());

  const test = DataTrue.Test.fromID(testID);

  test.run();
  let progress = test.progress();

  while (progress.status !== "completed" && progress.status !== "aborted") {
    if (Object.prototype.hasOwnProperty.call(progress, "progress") && Object.prototype.hasOwnProperty.call(progress.progress, "tests")) {
      sheet.getRange("B9").setValue(progress.progress.tests[0].state);
      SpreadsheetApp.flush();
    }
    progress = test.progress();
    Utilities.sleep(1000);
  }

  sheet.getRange("B9").setValue(progress.progress.tests[0].state);
}

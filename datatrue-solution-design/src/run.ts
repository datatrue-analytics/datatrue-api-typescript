function run(): void {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getActiveSheet();

  const userProperties = PropertiesService.getUserProperties();

  const lookups = {};

  ss.getSheetByName("Instructions").getRange("A9:B").getValues().some(row => {
    if (row[0] === "") {
      return;
    }
    lookups[row[0]] = row[1];
  });

  let managementToken = userProperties.getProperty("DATATRUE_MANAGEMENT_TOKEN");
  let ciToken = userProperties.getProperty("DATATRUE_CI_TOKEN");

  if (managementToken === null || ciToken === null) {
    setTokens();

    managementToken = userProperties.getProperty("DATATRUE_MANAGEMENT_TOKEN");
    ciToken = userProperties.getProperty("DATATRUE_CI_TOKEN");
  }

  DataTrue.managementToken = managementToken;
  DataTrue.ciToken = ciToken;
  DataTrue.apiEndpoint = lookups["DataTrue Endpoint"] || DataTrue.apiEndpoint;

  const testID: number = parseInt(sheet.getRange("B7").getValue());

  const test = DataTrue.Test.fromID(testID);

  test.run();
  sheet.getRange("B9").setValue("queued");
  SpreadsheetApp.flush();
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

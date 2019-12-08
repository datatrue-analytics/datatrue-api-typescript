function run(): void {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getActiveSheet();

  const runStatus = sheet.getRange("B8");

  const userProperties = PropertiesService.getUserProperties();

  const lookups = {};

  ss.getSheetByName("Instructions").getRange("A9:B").getDisplayValues().some(row => {
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

  const testID: number = parseInt(sheet.getRange("B7").getDisplayValue());
  const test = DataTrue.Test.fromID(testID);

  test.run();
  runStatus.setValue("queued");
  SpreadsheetApp.flush();
  let progress = test.progress();

  while (progress.status !== "completed" && progress.status !== "aborted") {
    if (Object.prototype.hasOwnProperty.call(progress, "progress") && Object.prototype.hasOwnProperty.call(progress.progress, "tests")) {
      runStatus.setValue(progress.progress.tests[0].state);
      SpreadsheetApp.flush();
    }
    progress = test.progress();
    Utilities.sleep(1000);
  }

  runStatus.setValue(progress.progress.tests[0].state);
}

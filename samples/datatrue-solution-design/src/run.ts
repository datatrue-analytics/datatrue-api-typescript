function run(): void {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getActiveSheet();

  getTokens();
  
  const runStatus = sheet.getRange("B8");
  const testID: number = parseInt(sheet.getRange("B7").getDisplayValue());
  const test = DataTrue.Test.fromID(testID);

  test.run();
  runStatus.setValue("queued");
  SpreadsheetApp.flush();
  let progress = test.progress();

  while (progress.status !== "completed" && progress.status !== "aborted") {
    if (progress.progress?.tests !== undefined) {
      runStatus.setValue(progress.progress.tests[0].state);
      SpreadsheetApp.flush();
    }
    progress = test.progress();
    Utilities.sleep(1000);
  }

  runStatus.setValue(progress.progress.tests[0].state);
}

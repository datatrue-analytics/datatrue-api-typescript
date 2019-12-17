function run(): void {
  checkTokens();

  const userProperties = PropertiesService.getUserProperties();
  DataTrue.config.managementToken = userProperties.getProperty("DATATRUE_USER_TOKEN");
  DataTrue.config.ciToken = userProperties.getProperty("DATATRUE_ACCOUNT_TOKEN");

  var base = SpreadsheetApp.getActive().getActiveRange().getRow();
  var row = SpreadsheetApp.getActive().getActiveRange().getRow();

  // Get table dimensions
  for (var width = 0; SpreadsheetApp.getActive().getRange("R" + base + "C" + (width + 1)).getBackground() !== "#ffffff" && width < 20; width++);

  var testIds: string[] = SpreadsheetApp.getActive().getRange("R" + (base + 2) + "C3:R" + (base + 2) + "C" + width).getValues().pop();
  var runStatus = SpreadsheetApp.getActive().getRange("R" + (base + 4) + "C3:R" + (base + 4) + "C" + width);

  const suites: DataTrue.Suite[] = [];

  testIds.forEach(testId => {
    const suite = DataTrue.Suite.fromID(parseInt(testId));
    suite.run();
    suites.push(suite);
  });

  const status = [];

  suites.forEach(() => {
    status.push({
      state: "Starting",
      background: "#c9daf8",
    });
  });

  while (!suites.every(suite => {
    const progress = suite.progress();
    return progress.status === "completed" || progress.status === "aborted";
  })) {
    suites.forEach((suite, index) => {
      const response = suite.progress();
      if (response.status !== "completed") {
        status[index].state = response.progress ? (response.progress.percentage + "%") : response.status;
      } else {
        if (response.progress.tests.every(t => {
          return (t.state === "validated" || t.state === "success");
        })) {
          status[index].state = "Validated";
          status[index].background = "#b6d7a8";
        } else {
          status[index].state = "Failed";
          status[index].background = "#ea9999";
        }
      }
    });
    // Update status in sheet
    runStatus.setValues([status.map(s => {
      return (s.state);
    })]);
    runStatus.setBackgrounds([status.map(s => {
      return (s.background);
    })]);
    SpreadsheetApp.flush();

    Utilities.sleep(500);
  }
}

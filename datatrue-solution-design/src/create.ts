function create(): void {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getActiveSheet();

  const lookups = {};

  ss.getSheetByName("Instructions").getRange("A9:B").getValues().some(row => {
    if (row[0] === "") {
      return;
    }
    lookups[row[0]] = row[1];
  });

  DataTrue.managementToken = lookups["User - Management API KEY"];
  DataTrue.ciToken = lookups["Account - API Key"];
  DataTrue.apiEndpoint = lookups["DataTrue Endpoint"] || DataTrue.apiEndpoint;

  const testName: string = sheet.getRange("A4").getValue();
  const testDescription: string = sheet.getRange("B18").getValue();
  const accountID: string = sheet.getRange("B5").getValue();
  let suiteID: string = sheet.getRange("B6").getValue();
  const testID: string = sheet.getRange("B7").getValue();
  const tagType: string = sheet.getRange("B11").getValue();
  const url: string = sheet.getRange("B10").getValue();

  if (!suiteID) {
    const sheetFile = DriveApp.getFileById(ss.getId());
    const fileName = sheetFile.getName();

    const suite = new DataTrue.Suite(fileName, parseInt(accountID));
    suite.save();
    suiteID = suite.resourceID.toString();

    sheet.getRange("B6").setValue(suiteID);
    SpreadsheetApp.flush();
  }

  const test: DataTrue.Test = new DataTrue.Test(testName, parseInt(suiteID), { description: testDescription });
  const steps: DataTrue.Step[] = [];

  steps.push(new DataTrue.Step(`Go To ${url}`, DataTrue.StepActions.GOTO_URL, undefined, { target: url }));

  const queryParams: string[] = sheet.getRange("D21:Z21").getValues()[0];
  queryParams.filter(param => param !== "");
  const stepRows: string[][] = sheet.getRange("A22:Z").getValues();

  stepRows.some(row => {
    if (row[0] === "") {
      return;
    }
    steps.push(new DataTrue.Step(row[0], DataTrue.StepActions.RUN_SCRIPT, undefined, { description: row[1], js_code: row[2] }));
    const tagValidation = new DataTrue.TagValidation(row[0], tagType);
    queryParams.forEach((param, i) => {
      if (row[i + 3] !== "") {
        tagValidation.addQueryValidation({
          key: param,
          regex: false,
          value: row[i + 3],
          use_json_path: false
        });
      }
    });
    steps[steps.length - 1].addTagValidation(tagValidation);
  });

  steps.forEach(step => test.addStep(step));

  test.save();

  sheet.getRange("B7").setValue(test.resourceID);
  sheet.getRange("B8").setValue("y");
}

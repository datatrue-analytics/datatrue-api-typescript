function create() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getActiveSheet();

  const lookups = {};

  ss.getSheetByName("Lookups").getRange("A1:B").getValues().some(row => {
    if (row[0] === "") {
      return;
    }
    lookups[row[0]] = row[1];
  });

  DataTrue.management_token = lookups["management_token"];
  DataTrue.ci_token = lookups["ci_token"];
  DataTrue.api_endpoint = lookups["api_endpoint"] || DataTrue.api_endpoint;

  const testName: string = sheet.getRange("A4").getValue();
  const testDescription: string = sheet.getRange("B18").getValue();
  const suiteID: string = sheet.getRange("B6").getValue();
  const tagType: string = sheet.getRange("B11").getValue();
  const url: string = sheet.getRange("B10").getValue();

  const test = new DataTrue.Test(testName, parseInt(suiteID), testDescription);
  const steps: DataTrue.Step[] = [];

  steps.push(new DataTrue.Step(`Go To ${url}`, DataTrue.StepActions.GOTO_URL, undefined, {target: url}));

  const queryParams = sheet.getRange("D21:Z21").getValues();
  const stepRows = sheet.getRange("A22:Z").getValues();

  stepRows.some(row => {
    if (row[0] === "") {
      return;
    }
    steps.push(new DataTrue.Step(row[0], DataTrue.StepActions.RUN_SCRIPT, undefined, {description: row[1], js_code: row[2]}));
    let tagValidation = new DataTrue.TagValidation(row[0], tagType);
    row.slice(3).some((param, i) => {
      if (param === "") {
        return;
      }
      tagValidation.addQueryValidation({
        key: queryParams[0][i],
        regex: false,
        value: param,
        use_json_path: false
      });
    });
    steps[steps.length - 1].addTagValidation(tagValidation);
  });

  steps.forEach(step => test.addStep(step));

  test.create();
}

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
  const useMockPage: boolean = sheet.getRange("B13").getValue();
  const tagManagerUrl: string = sheet.getRange("B14").getValue();

  const hostname = url.match(/^(?:https?:\/\/)?(?:[-a-zA-Z0-9]+:[-a-zA-Z0-9]+@)?((?:[-a-zA-Z0-9]{1,63}\.)+(?:[a-z]{1,63}))(?::\d{1,5})?((?:(?:\/|#)+[-a-zA-Z0-9:@%\-._~!$&'()*+,;=]*)*)(?:\?[-a-zA-Z0-9@:%_+.,~#?&/=]*)?$/)[1];
  let path = url.match(/^(?:https?:\/\/)?(?:[-a-zA-Z0-9]+:[-a-zA-Z0-9]+@)?((?:[-a-zA-Z0-9]{1,63}\.)+(?:[a-z]{1,63}))(?::\d{1,5})?((?:(?:\/|#)+[-a-zA-Z0-9:@%\-._~!$&'()*+,;=]*)*)(?:\?[-a-zA-Z0-9@:%_+.,~#?&/=]*)?$/)[2];
  path = (path === "") ? ".*" : path;

  if (!suiteID) {
    const sheetFile = DriveApp.getFileById(ss.getId());
    const fileName = sheetFile.getName();

    const suite = new DataTrue.Suite(fileName, parseInt(accountID));
    suite.save();
    suiteID = suite.getResourceID().toString();

    sheet.getRange("B6").setValue(suiteID);
    SpreadsheetApp.flush();
  }

  const test: DataTrue.Test = new DataTrue.Test(testName, parseInt(suiteID), { description: testDescription });
  const steps: DataTrue.Step[] = [];

  const initialStep = new DataTrue.Step(`Go To ${url}`, DataTrue.StepActions.GOTO_URL, undefined, { target: url });

  if (useMockPage) {
    const intercept = new DataTrue.TagValidation("Mock Page", "Custom Tag", undefined, {
      hostname_validation: hostname,
      pathname_validation: path,
      hostname_detection: hostname,
      pathname_detection: path,
      interception: {
        do_validation: true,
        intercept: true,
        intercept_status: "200",
        intercept_body: `<html>
                           <head>
                             <script src=${tagManagerUrl} async></script>
                           </head>
                           <body>
                             <h1>
                               ${testName}
                             </h1>
                             <h2>
                               DataLayer test for ${url}<br />
                               Using Tag Manager from ${tagManagerUrl}
                             </h2>
                           </body>
                         </html>`,
      },
    });
    initialStep.addTagValidation(intercept);
  }

  steps.push(initialStep);

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
        const queryValidation: DataTrue.QueryValidation = {
          key: param,
          regex: false,
          value: row[i + 3],
          use_json_path: false,
        };
        if (queryValidation.value.indexOf("regex://") === 0) {
          queryValidation.value = queryValidation.value.replace("regex://", "");
          queryValidation.regex = true;
        }
        tagValidation.addQueryValidation(queryValidation);
      }
    });
    steps[steps.length - 1].addTagValidation(tagValidation);
  });

  steps.forEach(step => test.addStep(step));

  test.save();

  sheet.getRange("B7").setValue(test.getResourceID());
  sheet.getRange("B8").setValue("y");
}

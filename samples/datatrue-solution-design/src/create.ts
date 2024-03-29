import * as DataTrue from "@datatrue/api";
import { getTokens } from "./getTokens";

export async function create(): Promise<void> {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getActiveSheet();
  const ui = SpreadsheetApp.getUi();

  getTokens();

  const testName: string = sheet.getRange("B16").getDisplayValue();
  const testDescription: string = sheet.getRange("B17").getDisplayValue();
  let accountID: string = sheet.getRange("B5").getDisplayValue();
  let suiteID: string = sheet.getRange("B6").getDisplayValue();
  const testID: string = sheet.getRange("B7").getDisplayValue();
  const url: string = sheet.getRange("B9").getDisplayValue();
  const tagType: string = sheet.getRange("B10").getDisplayValue();
  const useMockPage: boolean = sheet.getRange("B11").getValue();
  const tagManagerUrl: string = sheet.getRange("B12").getDisplayValue();

  const urlRegex = /^(?:https?:\/\/)?(?:[-a-zA-Z0-9]+:[-a-zA-Z0-9]+@)?((?:[-a-zA-Z0-9]{1,63}\.)+(?:[a-z]{1,63}))(?::\d{1,5})?((?:(?:\/|#)+[-a-zA-Z0-9:@%\-._~!$&'()*+,;=]*)*)(?:\?[-a-zA-Z0-9@:%_+.,~#?&/=]*)?$/;

  const hostname = urlRegex.exec(url)[1];
  let path = urlRegex.exec(url)[2];
  path = path === "" ? ".*" : path;

  if (accountID === "") {
    accountID = ui.prompt(
      "Please enter your DataTrue Account ID",
      "",
      ui.ButtonSet.OK
    ).getResponseText();
    if (accountID === "") {
      throw new Error("Account ID must be provided");
    }
  }

  sheet
    .getRange("B5")
    .setValue(
      `=HYPERLINK("${DataTrue.config.apiEndpoint}/accounts/${accountID}/suites", "${accountID}")`
    );
  SpreadsheetApp.flush();

  if (suiteID === "") {
    suiteID = ui.prompt(
      "Please enter your Suite ID",
      "Leave empty to create a new suite",
      ui.ButtonSet.OK
    ).getResponseText();

    if (suiteID === "") {
      const suiteName = ui.prompt(
        "Please enter a name for your Suite",
        "",
        ui.ButtonSet.OK
      ).getResponseText();

      if (suiteName === "") {
        throw new Error("Suite name must be provided");
      }

      const suite = new DataTrue.Suite(suiteName, parseInt(accountID));
      await suite.save();
      suiteID = suite.getResourceID().toString();
    }
  }

  sheet
    .getRange("B6")
    .setValue(
      `=HYPERLINK("${DataTrue.config.apiEndpoint}/accounts/${accountID}/suites/${suiteID}", "${suiteID}")`
    );
  SpreadsheetApp.flush();

  let test: DataTrue.Test;

  if (testID) {
    // test = DataTrue.Test.fromID(parseInt(testID));
    test = new DataTrue.Test(
      testName,
      DataTrue.TestTypes.SIMULATION,
      parseInt(suiteID),
      { description: testDescription }
    );
  } else {
    test = new DataTrue.Test(
      testName,
      DataTrue.TestTypes.SIMULATION,
      parseInt(suiteID),
      { description: testDescription }
    );
  }

  const currentSteps = test.getSteps();
  const steps: DataTrue.Step[] = [];

  if (currentSteps.length === 0) {
    const initialStep = new DataTrue.Step(
      `Go To ${url}`,
      DataTrue.StepActions.GOTO_URL,
      undefined,
      { target: url }
    );

    if (useMockPage) {
      const intercept = new DataTrue.TagValidation(
        "Mock Page",
        "Custom Tag",
        DataTrue.TagValidationContexts.STEP,
        undefined,
        {
          hostname_validation: hostname,
          pathname_validation: path,
          hostname_detection: hostname,
          pathname_detection: path,
          do_validation: true,
          interception: {
            intercept: true,
            intercept_status: 200,
            intercept_body: `
            <html>
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
        }
      );
      initialStep.insertTagValidation(intercept);
    }

    steps.push(initialStep);
  }

  let queryParams: string[] = sheet.getRange("D20:Z20").getDisplayValues()[0];
  queryParams = queryParams.filter(param => param !== "");
  const stepRows = sheet.getRange("A21:Z");
  const stepRowValues: string[][] = stepRows.getDisplayValues();

  stepRowValues.some((row, index) => {
    if (row[0] === "") {
      return;
    }

    let step: DataTrue.Step;
    if (
      stepRows
        .getCell(index + 1, 1)
        .getNote() !== "" &&
      test
        .getSteps()
        .filter(
          step => {
            return step.getResourceID() === parseInt(
              stepRows.getCell(index + 1, 1).getNote()
            )
          }
        ).length
    ) {
      step = currentSteps.filter(
        step => step.getResourceID() === parseInt(row[0])
      )[0];
    } else {
      step = new DataTrue.Step(
        row[0],
        DataTrue.StepActions.RUN_SCRIPT,
        undefined,
        { description: row[1], js_code: row[2] }
      );
    }

    let tagValidation: DataTrue.TagValidation;
    if (step.getTagValidations().length) {
      tagValidation = step.getTagValidations()[0];
      tagValidation.name = row[0];
      tagValidation.tagDefinition = {
        key: tagType,
      };

      for (let i = tagValidation.getQueryValidations().length - 1; i >= 0; i--) {
        tagValidation.deleteQueryValidation(i);
      }

      for (let i = step.getTagValidations().length - 1; i >= 0; i--) {
        step.deleteTagValidation(i);
      }
    } else {
      tagValidation = new DataTrue.TagValidation(row[0], tagType);
    }

    queryParams.forEach((param, i) => {
      if (row[i + 3] !== "") {
        const queryValidation: DataTrue.QueryValidation = {
          key: param,
          operator: DataTrue.Operator.CONTAINS,
          value: row[i + 3],
          use_json_path: false,
        };
        if (queryValidation.value.startsWith("regex://")) {
          queryValidation.value = queryValidation.value.replace("regex://", "");
          queryValidation.operator = DataTrue.Operator.REGEXP_MATCH;
        }
        tagValidation.insertQueryValidation(queryValidation);
      }
    });

    if (!step.getTagValidations().length) {
      step.insertTagValidation(tagValidation);
    }

    steps.push(step);
  });

  steps.forEach(step => {
    if (step.getResourceID() === undefined) {
      test.insertStep(step);
    }
  });

  await test.save();

  for (let i = 1; i < stepRows.getNumRows(); i++) {
    if (stepRows.getCell(i, 1).getDisplayValue() === "") {
      break;
    }

    if (currentSteps.length === 0) {
      // stepRows.getCell(i, 1).setNote(steps[i].getResourceID().toString());
    } else {
      // stepRows.getCell(i, 1).setNote(steps[i - 1].getResourceID().toString());
    }
  }

  sheet
    .getRange("B7")
    .setValue(
      `=HYPERLINK("${DataTrue.config.apiEndpoint}/tests/${test.getResourceID()}", "${test.getResourceID()}")`
    );
}

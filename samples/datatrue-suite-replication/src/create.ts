import * as DataTrue from "datatrue-api";
import fm from "front-matter";
import { getTokens } from "./getTokens";

export async function create(): Promise<void> {
  getTokens();

  const userProperties = PropertiesService.getUserProperties();
  DataTrue.config.userToken = userProperties.getProperty("DATATRUE_USER_TOKEN");

  const base = SpreadsheetApp.getActive().getActiveRange().getRow();
  const column = SpreadsheetApp.getActive().getActiveRange().getColumn();
  const suite = SpreadsheetApp.getActive().getRange(`A${base + 2}`).getDisplayValue();

  if (suite === "Suite ID" && column === 1) {
    // Get table dimensions
    for (var height = 0; SpreadsheetApp.getActive().getRange(`A${base + height + 1}`).getBackground() !== "#ffffff" && height < 20; height++) {
      // do nothing
    }
    for (var width = 0; SpreadsheetApp.getActive().getRange(`R${base}C${width + 1}`).getBackground() !== "#ffffff" && width < 20; width++) {
      // do nothing
    }

    // Get replication details
    const accountId = SpreadsheetApp.getActive().getRange(`B${base + 1}`).getDisplayValue();
    const suiteId = SpreadsheetApp.getActive().getRange(`B${base + 2}`).getDisplayValue();
    const names = SpreadsheetApp.getActive().getRange(`R${base}C3:R${base}C${width}`).getDisplayValues()[0];
    const excludeLabels = SpreadsheetApp.getActive().getRange(`R${base + 5}C3:R${base + 5}C${width}`).getDisplayValues()[0];
    const rawVariables = SpreadsheetApp.getActive().getRange(`R${base + 6}C1:R${base + height}C${width}`).getDisplayValues();

    // Get cell ranges to update results of replication in sheet
    const results = names.map(function (_name, index) {
      return SpreadsheetApp
        .getActive()
        .getRange(`R${base + 1}C${index + 3}:R${base + 3}C${index + 3}`);
    });

    const variables = rawVariables.map(function (variable) {
      return ({
        "name": variable.shift(),
        "default": variable.shift(),
        "values": variable,
      });
    });

    const originalSuite = await DataTrue.Suite.fromID(parseInt(suiteId));

    for (const [i, name] of names.entries()) {
      if (results[i].getDisplayValues()[2][0] === "y") {
        continue;
      }

      const exclude = excludeLabels[i].split(",").filter(label => label !== "");

      const id = results[i].getValues()[1][0];
      let newSuite: DataTrue.Suite;

      if (id === "") {
        newSuite = DataTrue.Suite.fromJSON(await originalSuite.toJSON(), true);
      } else {
        newSuite = await DataTrue.Suite.fromID(id);
      }

      const tests = await newSuite.getTests();

      for (var t = tests.length - 1; t >= 0; t--) {
        const description = tests[t].options.description ?? "";
        const content = fm(description);
        // @ts-ignore
        const labels: string[] = content.attributes.labels ?? [];

        if (exclude.some(label => labels.includes(label))) {
          await newSuite.deleteTest(t);
          continue;
        }

        const steps = tests[t].getSteps();

        for (var s = steps.length - 1; s >= 0; s--) {
          const description = steps[s].options.description ?? "";
          const content = fm(description);
          // @ts-ignore
          const labels: string[] = content.attributes.labels ?? [];

          if (exclude.some(label => labels.includes(label))) {
            tests[t].deleteStep(s);
            continue;
          }

          const tagValidations = steps[s].getTagValidations();

          for (var tv = tagValidations.length - 1; tv >= 0; tv--) {
            const description = tagValidations[tv].options.description ?? "";
            const content = fm(description);
            // @ts-ignore
            const labels: string[] = content.attributes.labels ?? [];

            if (exclude.some(label => labels.includes(label))) {
              steps[s].deleteTagValidation(tv);
            }
          }

          const dataLayerValidations = steps[s].getDataLayerValidations();

          for (var dlv = dataLayerValidations.length - 1; dlv >= 0; dlv--) {
            const description = dataLayerValidations[dlv].options.description ?? "";
            const content = fm(description);
            // @ts-ignore
            const labels: string[] = content.attributes.labels ?? [];

            if (exclude.some(label => labels.includes(label))) {
              steps[s].deleteDataLayerValidation(dlv);
            }
          }
        }

        const tagValidations = tests[t].getTagValidations();

        for (var tv = tagValidations.length - 1; tv >= 0; tv--) {
          const description = tagValidations[tv].options.description ?? "";
          const content = fm(description);
          // @ts-ignore
          const labels: string[] = content.attributes.labels ?? [];

          if (exclude.some(label => labels.includes(label))) {
            tests[t].deleteTagValidation(tv);
          }
        }
      }

      newSuite.name = name;
      newSuite.setContextID(parseInt(accountId));

      variables.forEach(variable => {
        newSuite.setVariable(
          variable.name,
          DataTrue.VariableTypes.PRESET,
          variable.values[i]
        );
      });

      await newSuite.save();

      results[i].setValues(
        [
          [accountId],
          [`=HYPERLINK("${DataTrue.config.apiEndpoint}/accounts/${accountId}/suites/${newSuite.getResourceID()}", "${newSuite.getResourceID()}")`],
          ["y"],
        ]
      );
    }
  } else {
    SpreadsheetApp
      .getUi()
      .alert(
        "Test suite configuration table was not found. Please select the cell" +
        "containing the name of the test you wish to replicate."
      );
  }
}

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
    const includeTags = SpreadsheetApp.getActive().getRange(`R${base + 5}C3:R${base + 5}C${width}`).getDisplayValues()[0];
    const excludeTags = SpreadsheetApp.getActive().getRange(`R${base + 6}C3:R${base + 6}C${width}`).getDisplayValues()[0];
    const rawVariables = SpreadsheetApp.getActive().getRange(`R${base + 7}C3:R${base + height}C${width}`).getDisplayValues();

    // Get cell ranges to update results of replication in sheet
    const results = names.map(function (_name, index) {
      return (SpreadsheetApp.getActive().getRange(`R${base + 1}C${index + 3}:R${base + 3}C${index + 3}`));
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

      const include = includeTags[i].split(",").filter(tag => tag !== "");
      const exclude = excludeTags[i].split(",").filter(tag => tag !== "");

      const id = results[i].getValues()[1][0];
      let newSuite: DataTrue.Suite;

      if (id === "") {
        newSuite = DataTrue.Suite.fromJSON(await originalSuite.toJSON(), true);
      } else {
        newSuite = await DataTrue.Suite.fromID(id);
      }

      const tests = await newSuite.getTests();

      for (var t = 0; t < tests.length; t++) {
        const description = tests[t].options.description ?? "";
        const content = fm(description);
        // @ts-ignore
        const tags: string[] = content.attributes.tags ?? [];

        if (!include.every(tag => tags.includes(tag)) || exclude.some(tag => tags.includes(tag))) {
          await newSuite.deleteTest(t);
          continue;
        }

        const steps = tests[t].getSteps();

        for (var s = 0; s < steps.length; s++) {
          const description = steps[s].options.description ?? "";
          const content = fm(description);
          // @ts-ignore
          const tags: string[] = content.attributes.tags ?? [];

          if (!include.every(tag => tags.includes(tag)) || exclude.some(tag => tags.includes(tag))) {
            tests[t].deleteStep(s);
            continue;
          }

          const tagValidations = steps[s].getTagValidations();

          for (var tv = 0; tv < tagValidations.length; tv++) {
            const description = tagValidations[tv].options.description ?? "";
            const content = fm(description);
            // @ts-ignore
            const tags: string[] = content.attributes.tags ?? [];

            if (!include.every(tag => tags.includes(tag)) || exclude.some(tag => tags.includes(tag))) {
              steps[s].deleteTagValidation(tv);
            }
          }

          const dataLayerValidations = steps[s].getDataLayerValidations();

          for (var dlv = 0; dlv < dataLayerValidations.length; dlv++) {
            const description = dataLayerValidations[dlv].options.description ?? "";
            const content = fm(description);
            // @ts-ignore
            const tags: string[] = content.attributes.tags ?? [];

            if (!include.every(tag => tags.includes(tag)) || exclude.some(tag => tags.includes(tag))) {
              steps[s].deleteDataLayerValidation(dlv);
            }
          }
        }

        const tagValidations = tests[t].getTagValidations();

        for (var tv = 0; tv < tagValidations.length; tv++) {
          const description = tagValidations[tv].options.description ?? "";
          const content = fm(description);
          // @ts-ignore
          const tags: string[] = content.attributes.tags ?? [];

          if (!include.every(tag => tags.includes(tag)) || exclude.some(tag => tags.includes(tag))) {
            tests[t].deleteTagValidation(tv);
          }
        }
      }

      newSuite.name = name;
      newSuite.setContextID(parseInt(accountId));

      variables.forEach(variable => {
        newSuite.setVariable(variable.name, DataTrue.VariableTypes.PRESET, variable.values[i]);
      });

      await newSuite.save();

      results[i].setValues([[accountId], [newSuite.getResourceID()], ["y"]]);
    }
  } else {
    SpreadsheetApp.getUi().alert("Test suite configuration table was not found. Please select the cell containing the name of the test you wish to replicate.");
  }
}

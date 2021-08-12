import * as DataTrue from "@datatrue/api";
import fm from "front-matter";
import yaml from "js-yaml";
import { getTokens } from "./getTokens";

interface MetaData {
  labels?: string[],
  copiedFrom?: number,
}

function getDescription(description: string, id: number): string {
  const content = fm<MetaData>(description ?? "");
  const attributes = content.attributes ?? {};
  attributes.copiedFrom = id;
  return `---
${yaml.dump(attributes)}---
${content.body ?? ""}`;
}

export async function create(): Promise<void> {
  getTokens();

  const userProperties = PropertiesService.getUserProperties();
  DataTrue.config.userToken = userProperties.getProperty("DATATRUE_USER_TOKEN");

  const base = SpreadsheetApp.getActive().getActiveRange().getRow();
  const column = SpreadsheetApp.getActive().getActiveRange().getColumn();
  const suite = SpreadsheetApp.getActive().getRange(`A${base + 2}`).getDisplayValue();

  if (suite === "Suite ID" && column === 1) {
    // Get table dimensions
    for (
      var height = 0;
      SpreadsheetApp.getActive().getRange(`A${base + height + 1}`).getBackground() !== "#ffffff" && height < 1000;
      height++
    ) {
      // do nothing
    }
    for (
      var width = 0;
      SpreadsheetApp.getActive().getRange(`R${base}C${width + 1}`).getBackground() !== "#ffffff" && width < 1000;
      width++
    ) {
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
    const originalTests: Record<number, any> = {};
    const originalSteps: Record<number, any> = {};
    const originalTagValidations: Record<number, any> = {};
    const originalDataLayerValidations: Record<number, any> = {};
    const json = await originalSuite.toJSON();

    json.tests?.forEach(test => {
      originalTests[test.id] = test;
      test.description = getDescription(test.description, test.id);
      test.steps?.forEach(step => {
        originalSteps[step.id] = step;
        step.description = getDescription(step.description, step.id);
        step.tag_validations?.forEach(tagValidation => {
          originalTagValidations[tagValidation.id] = tagValidation;
          tagValidation.description = getDescription(
            tagValidation.description,
            tagValidation.id
          );
        });
        step.data_layer_validations?.forEach(dataLayerValidation => {
          originalDataLayerValidations[dataLayerValidation.id] = dataLayerValidation;
          dataLayerValidation.description = getDescription(
            dataLayerValidation.description,
            dataLayerValidation.id
          );
        });
      });
      test.tag_validations?.forEach(tagValidation => {
        originalTagValidations[tagValidation.id] = tagValidation;
        tagValidation.description = getDescription(
          tagValidation.description,
          tagValidation.id
        );
      });
    });

    for (const [i, name] of names.entries()) {
      if (results[i].getDisplayValues()[2][0] === "y") {
        continue;
      }

      const exclude = excludeLabels[i]
        .split(",")
        .filter(label => label !== "")
        .map(label => label.trim());

      const id = results[i].getValues()[1][0];
      let newSuite: DataTrue.Suite;

      if (id === "") {
        newSuite = DataTrue.Suite.fromJSON(json, true);
      } else {
        newSuite = await DataTrue.Suite.fromID(id);
      }

      const tests = await newSuite.getTests();

      for (var t = tests.length - 1; t >= 0; t--) {
        const description = tests[t].options.description ?? "";
        const content = fm<MetaData>(description);
        const labels = content.attributes.labels ?? [];
        const copiedFrom = content.attributes.copiedFrom;

        if (
          exclude.some(label => labels.includes(label)) ||
          (
            copiedFrom !== undefined &&
            originalTests[copiedFrom] === undefined
          )
        ) {
          await newSuite.deleteTest(t);
          continue;
        }

        const steps = tests[t].getSteps();

        for (var s = steps.length - 1; s >= 0; s--) {
          const description = steps[s].options.description ?? "";
          const content = fm<MetaData>(description);
          const labels = content.attributes.labels ?? [];
          const copiedFrom = content.attributes.copiedFrom;

          if (
            exclude.some(label => labels.includes(label)) ||
            (
              copiedFrom !== undefined &&
              originalSteps[copiedFrom] === undefined
            )
          ) {
            tests[t].deleteStep(s);
            continue;
          }

          const tagValidations = steps[s].getTagValidations();

          for (var tv = tagValidations.length - 1; tv >= 0; tv--) {
            const description = tagValidations[tv].options.description ?? "";
            const content = fm<MetaData>(description);
            const labels = content.attributes.labels ?? [];
            const copiedFrom = content.attributes.copiedFrom;

            if (
              exclude.some(label => labels.includes(label)) ||
              (
                copiedFrom !== undefined &&
                originalTagValidations[copiedFrom] === undefined
              )
            ) {
              steps[s].deleteTagValidation(tv);
            }
          }

          const dataLayerValidations = steps[s].getDataLayerValidations();

          for (var dlv = dataLayerValidations.length - 1; dlv >= 0; dlv--) {
            const description = dataLayerValidations[dlv].options.description ?? "";
            const content = fm<MetaData>(description);
            const labels = content.attributes.labels ?? [];
            const copiedFrom = content.attributes.copiedFrom;

            if (
              exclude.some(label => labels.includes(label)) ||
              (
                copiedFrom !== undefined &&
                originalDataLayerValidations[copiedFrom] === undefined
              )
            ) {
              steps[s].deleteDataLayerValidation(dlv);
            }
          }
        }

        const tagValidations = tests[t].getTagValidations();

        for (var tv = tagValidations.length - 1; tv >= 0; tv--) {
          const description = tagValidations[tv].options.description ?? "";
          const content = fm<MetaData>(description);
          const labels = content.attributes.labels ?? [];
          const copiedFrom = content.attributes.copiedFrom;

          if (
            exclude.some(label => labels.includes(label)) ||
            (
              copiedFrom !== undefined &&
              originalTagValidations[copiedFrom] === undefined
            )
          ) {
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

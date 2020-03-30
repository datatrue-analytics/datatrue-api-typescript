import * as DataTrue from "../../../dist";
import { getTokens } from "./getTokens";

export async function create(): Promise<void> {
  getTokens();

  const userProperties = PropertiesService.getUserProperties();
  DataTrue.config.userToken = userProperties.getProperty("DATATRUE_USER_TOKEN");
  DataTrue.config.accountToken = userProperties.getProperty("DATATRUE_ACCOUNT_TOKEN");

  var base = SpreadsheetApp.getActive().getActiveRange().getRow();
  var column = SpreadsheetApp.getActive().getActiveRange().getColumn();
  var suite = SpreadsheetApp.getActive().getRange("A" + (base + 2)).getValue();

  if (suite === "Suite ID" && column === 1) {
    // Get table dimensions
    for (var height = 0; SpreadsheetApp.getActive().getRange("A" + (base + height + 1)).getBackground() !== "#ffffff" && height < 20; height++);
    for (var width = 0; SpreadsheetApp.getActive().getRange("R" + base + "C" + (width + 1)).getBackground() !== "#ffffff" && width < 20; width++);

    // Get replication details
    const accountId: string = SpreadsheetApp.getActive().getRange("B" + (base + 1)).getValue();
    const suiteId: string = SpreadsheetApp.getActive().getRange("B" + (base + 2)).getValue();
    const names: string[] = SpreadsheetApp.getActive().getRange("R" + base + "C3" + ":R" + base + "C" + width).getValues().pop();
    var rawVariables: string[][] = SpreadsheetApp.getActive().getRange("R" + (base + 5) + "C1" + ":R" + (base + height) + "C" + width).getValues();

    // Get cell ranges to update results of replication in sheet
    var results = names.map(function (_name, index) {
      return (SpreadsheetApp.getActive().getRange("R" + (base + 1) + "C" + (index + 3) + ":R" + (base + 3) + "C" + (index + 3)));
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
      if (results[i].getValues()[2][0] === "y") {
        continue;
      }

      const id = results[i].getValues()[1][0];
      let newSuite: DataTrue.Suite;

      if (id === "") {
        newSuite = DataTrue.Suite.fromJSON(originalSuite.toJSON()["suite"], true);
      } else {
        newSuite = await DataTrue.Suite.fromID(id);
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

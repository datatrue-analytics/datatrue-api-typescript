function run() {
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

  const testID: number = parseInt(sheet.getRange("B7").getValue());

  const test = DataTrue.Test.fromID(testID);

  test.run();
}

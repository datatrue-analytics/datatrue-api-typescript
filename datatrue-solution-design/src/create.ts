function create() {
  const sheet = SpreadsheetApp.getActive();
  const testName: string = sheet.getRange("A4").getValue();
  const testDescription: string = sheet.getRange("B18").getValue();
  const suiteId: string = sheet.getRange("B6").getValue();
  const tagType: string = sheet.getRange("B11").getValue();
  const url: string = sheet.getRange("B10").getValue();

  const test = new DataTrue.Test(testName, suiteId, testDescription);

  const stepRows = sheet.getRange("A22:Z").getValues();

  const steps = [];


}

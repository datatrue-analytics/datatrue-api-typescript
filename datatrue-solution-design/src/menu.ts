function onOpen() {
  let sheet = SpreadsheetApp.getActiveSpreadsheet();
  let entries = [
    {
      name: "Create Test",
      functionName: "create"
    },
    {
      name: "Run",
      functionName: "run"
    }
  ];
  sheet.addMenu("DataTrue", entries);
}

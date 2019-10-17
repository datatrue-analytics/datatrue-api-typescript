function onOpen(): void {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const entries = [
    {
      name: "Create Test",
      functionName: "create"
    },
    {
      name: "Run Test",
      functionName: "run"
    }
  ];
  sheet.addMenu("DataTrue", entries);
}

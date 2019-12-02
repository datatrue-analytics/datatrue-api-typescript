function onOpen(): void {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const entries = [
    {
      name: "Create Test",
      functionName: "create",
    },
    {
      name: "Run Test",
      functionName: "run",
    },
    {
      name: "Set Tokens",
      functionName: "setTokens",
    },
    {
      name: "Delete Tokens",
      functionName: "deleteTokens",
    },
  ];
  sheet.addMenu("DataTrue", entries);
}

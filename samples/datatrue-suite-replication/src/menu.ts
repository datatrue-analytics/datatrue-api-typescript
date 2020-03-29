export function onOpen(): void {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const entries = [
    {
      name: "Create Suites",
      functionName: "create",
    },
    {
      name: "Run Suites",
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

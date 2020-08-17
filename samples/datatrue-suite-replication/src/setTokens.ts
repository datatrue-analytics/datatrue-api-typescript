export function setTokens(): void {
  const userProperties = PropertiesService.getUserProperties();
  const ui = SpreadsheetApp.getUi();

  const userTokenPrompt = ui.prompt(
    "Please enter your API token",
    "User API Key",
    ui.ButtonSet.OK
  );

  const userToken = userTokenPrompt.getResponseText();

  userProperties.setProperties({
    "DATATRUE_USER_TOKEN": userToken,
  });
}

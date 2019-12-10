function setTokens(): void {
  const userProperties = PropertiesService.getUserProperties();
  const ui = SpreadsheetApp.getUi();

  const managementTokenPrompt = ui.prompt("Please enter your API tokens", "User API Key (for creating tests)", ui.ButtonSet.OK);
  const managementToken = managementTokenPrompt.getResponseText();

  const ciTokenPrompt = ui.prompt("Please enter your API tokens", "Account API Key (for running tests)", ui.ButtonSet.OK);
  const ciToken = ciTokenPrompt.getResponseText();

  userProperties.setProperties({
    "DATATRUE_MANAGEMENT_TOKEN": managementToken,
    "DATATRUE_CI_TOKEN": ciToken,
  });
}

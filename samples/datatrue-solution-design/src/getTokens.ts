function getTokens(): void {
  const ss = SpreadsheetApp.getActive();
  const namedRanges = ss.getNamedRanges();

  const userProperties = PropertiesService.getUserProperties();

  let managementToken = userProperties.getProperty("DATATRUE_USER_TOKEN");
  let ciToken = userProperties.getProperty("DATATRUE_ACCOUNT_TOKEN");

  if (managementToken === null || ciToken === null) {
    setTokens();

    managementToken = userProperties.getProperty("DATATRUE_USER_TOKEN");
    ciToken = userProperties.getProperty("DATATRUE_ACCOUNT_TOKEN");
  }

  DataTrue.config.managementToken = managementToken;
  DataTrue.config.ciToken = ciToken;

  namedRanges.some(namedRange => {
    if (namedRange.getName() === "api_endpoint") {
      DataTrue.config.apiEndpoint = namedRange.getRange().getDisplayValue();
      return;
    }
  });
}

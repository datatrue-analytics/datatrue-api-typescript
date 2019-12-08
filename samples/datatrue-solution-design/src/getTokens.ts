function getTokens(): void {
  const ss = SpreadsheetApp.getActive();
  const namedRanges = ss.getNamedRanges();

  const userProperties = PropertiesService.getUserProperties();

  let managementToken = userProperties.getProperty("DATATRUE_MANAGEMENT_TOKEN");
  let ciToken = userProperties.getProperty("DATATRUE_CI_TOKEN");

  if (managementToken === null || ciToken === null) {
    setTokens();

    managementToken = userProperties.getProperty("DATATRUE_MANAGEMENT_TOKEN");
    ciToken = userProperties.getProperty("DATATRUE_CI_TOKEN");
  }

  DataTrue.managementToken = managementToken;
  DataTrue.ciToken = ciToken;

  namedRanges.some(namedRange => {
    if (namedRange.getName() === "api_endpoint") {
      DataTrue.apiEndpoint = namedRange.getRange().getDisplayValue();
      return;
    }
  });
}

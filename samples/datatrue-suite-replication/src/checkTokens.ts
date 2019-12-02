function checkTokens(): void {
  const userProperties = PropertiesService.getUserProperties();
  const managementToken = userProperties.getProperty("DATATRUE_MANAGEMENT_TOKEN");
  const ciToken = userProperties.getProperty("DATATRUE_CI_TOKEN");

  if (managementToken === null || ciToken === null) {
    setTokens();
  }
}

function checkTokens(): void {
  const userProperties = PropertiesService.getUserProperties();
  const managementToken = userProperties.getProperty("DATATRUE_USER_TOKEN");
  const ciToken = userProperties.getProperty("DATATRUE_ACCOUNT_TOKEN");

  if (managementToken === null || ciToken === null) {
    setTokens();
  }
}

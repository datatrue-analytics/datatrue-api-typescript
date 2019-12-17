function checkTokens(): void {
  const userProperties = PropertiesService.getUserProperties();
  const userToken = userProperties.getProperty("DATATRUE_USER_TOKEN");
  const accountToken = userProperties.getProperty("DATATRUE_ACCOUNT_TOKEN");

  if (userToken === null || accountToken === null) {
    setTokens();
  }
}

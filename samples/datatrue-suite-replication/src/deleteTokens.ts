function deleteTokens(): void {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.deleteProperty("DATATRUE_USER_TOKEN");
  userProperties.deleteProperty("DATATRUE_ACCOUNT_TOKEN");
}

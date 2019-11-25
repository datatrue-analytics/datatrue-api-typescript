function deleteTokens(): void {
    const userProperties = PropertiesService.getUserProperties();

    userProperties.deleteProperty("DATATRUE_MANAGEMENT_TOKEN");
    userProperties.deleteProperty("DATATRUE_CI_TOKEN");
}

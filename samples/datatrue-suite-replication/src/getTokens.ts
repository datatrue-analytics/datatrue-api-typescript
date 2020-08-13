import * as DataTrue from "@datatrue/api";
import { setTokens } from "./setTokens";

export function getTokens(): void {
  const ss = SpreadsheetApp.getActive();
  const namedRanges = ss.getNamedRanges();

  const userProperties = PropertiesService.getUserProperties();

  let userToken = userProperties.getProperty("DATATRUE_USER_TOKEN");

  if (userToken === null) {
    setTokens();
    userToken = userProperties.getProperty("DATATRUE_USER_TOKEN");
  }

  DataTrue.config.userToken = userToken;

  namedRanges.some(namedRange => {
    if (namedRange.getName() === "api_endpoint") {
      DataTrue.config.apiEndpoint = namedRange.getRange().getDisplayValue();
      return;
    }
  });
}

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
    const name = namedRange.getName();
    const displayValue = namedRange.getRange().getDisplayValue();
    if (name === "api_endpoint" && displayValue !== "") {
      DataTrue.config.apiEndpoint = displayValue;
      return;
    }
  });
}

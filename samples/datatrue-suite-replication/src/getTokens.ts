import * as DataTrue from "../../../dist";
import { setTokens } from "./setTokens";

export function getTokens(): void {
  const ss = SpreadsheetApp.getActive();
  const namedRanges = ss.getNamedRanges();

  const userProperties = PropertiesService.getUserProperties();

  let userToken = userProperties.getProperty("DATATRUE_USER_TOKEN");
  let accountToken = userProperties.getProperty("DATATRUE_ACCOUNT_TOKEN");

  if (userToken === null || accountToken === null) {
    setTokens();

    userToken = userProperties.getProperty("DATATRUE_USER_TOKEN");
    accountToken = userProperties.getProperty("DATATRUE_ACCOUNT_TOKEN");
  }

  DataTrue.config.userToken = userToken;
  DataTrue.config.accountToken = accountToken;

  namedRanges.some(namedRange => {
    if (namedRange.getName() === "api_endpoint") {
      DataTrue.config.apiEndpoint = namedRange.getRange().getDisplayValue();
      return;
    }
  });
}

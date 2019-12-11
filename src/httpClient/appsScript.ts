import HTTPClient, { HTTPOptions, Response, Method } from "./httpClient";

export default class AppsScriptClient implements HTTPClient {
  public makeRequest(url: string, method: Method, options: HTTPOptions, callback?: (response?: Response) => void, thisArg?: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
    options["method"] = method;
    options["contentType"] = "application/json";

    if (Object.hasOwnProperty.call(options, "body")) {
      options["payload"] = options.body;
      delete options.body;
    }

    const response = UrlFetchApp.fetch(url, options);

    if (typeof callback === "function") {
      callback.call(thisArg, { status: response.getResponseCode, body: response.getContentText() });
    }
  }
}

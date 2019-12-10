import HTTPClient, { HTTPOptions, Response, Method } from "./httpClient";

export default class AppsScriptClient implements HTTPClient {
  public makeRequest(url: string, method: Method, options: HTTPOptions): Response {
    options["method"] = method;
    options["contentType"] = "application/json";

    if (Object.hasOwnProperty.call(options, "body")) {
      options["payload"] = options.body;
      delete options.body;
    }

    const response =  UrlFetchApp.fetch(url, options);

    return { status: response.getResponseCode(), text: response.getContentText() };
  }
}

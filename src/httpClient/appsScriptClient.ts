import HTTPClient, { HTTPOptions, Response, Method } from "./httpClient";

export default class AppsScriptClient implements HTTPClient {
  public makeRequest(url: string, method: Method, options: HTTPOptions, callback?: (response: Response) => void, thisArg?: any): void {
    const opts: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {};
    opts.contentType = "application/json";
    opts.headers = options.headers;
    opts.method = method;
    opts.payload = options.body;

    const response = UrlFetchApp.fetch(url, opts);

    if (typeof callback === "function") {
      callback.call(thisArg, { status: response.getResponseCode(), body: response.getContentText() });
    }
  }
}

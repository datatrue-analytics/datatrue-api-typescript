import HTTPClient, { HTTPOptions, Method, Response } from "./httpClient";

export default class AppsScriptClient implements HTTPClient {
  public makeRequest(
    url: string,
    method: Method,
    options: HTTPOptions
  ): Promise<Response> {
    const opts: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {};
    opts.contentType = "application/json";
    opts.headers = {
      "content-type": "application/json",
      ...options.headers,
    };
    opts.method = method;
    opts.payload = options.body;
    opts.muteHttpExceptions = true;

    try {
      const response = UrlFetchApp.fetch(url, opts);
      return Promise.resolve({
        status: response.getResponseCode(),
        body: response.getContentText(),
      });
    } catch (e: unknown) {
      if (e instanceof Error) {
        return Promise.reject(new Error(e.message));
      } else {
        return Promise.reject(e);
      }
    }
  }
}

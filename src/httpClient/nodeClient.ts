import HTTPClient, { HTTPOptions, Response, Method } from "./httpClient";
import fetch from "node-fetch";

export default class NodeClient implements HTTPClient {
  public makeRequest(url: string, method: Method, options: HTTPOptions, callback?: (response: Response) => void, thisArg?: any): void {
    const { headers, ...restOptions } = options;

    fetch(url, {
      method: method,
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      ...restOptions,
    }).then(res => {
      res.text().then((body: string) => {
        if (typeof callback === "function") {
          callback.call(thisArg, { status: res.status, body: body });
        }
      });
    });
  }
}

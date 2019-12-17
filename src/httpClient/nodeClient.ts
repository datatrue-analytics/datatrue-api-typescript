import HTTPClient, { HTTPOptions, Response, Method } from "./httpClient";
import fetch from "node-fetch";

export default class NodeClient implements HTTPClient {
  public makeRequest(url: string, method: Method, options: HTTPOptions, callback?: (response: Response) => void, thisArg?: any): void {
    fetch(url, { method: method, ...options }).then(res => {
      res.text().then((body: string) => {
        if (typeof callback === "function") {
          callback.call(thisArg, { status: res.status, body: body });
        }
      });
    });
  }
}

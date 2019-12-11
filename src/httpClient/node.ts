import HTTPClient, { HTTPOptions, Response, Method } from "./httpClient";
import request from "sync-request";

export default class NodeClient implements HTTPClient {
  public makeRequest(url: string, method: Method, options: HTTPOptions, callback?: (response?: Response) => void, thisArg?: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
    const res = request(method as any, url, options); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (typeof callback === "function") {
      callback.call(thisArg, { code: res.statusCode, body: res.body.toString() });
    }
  }
}

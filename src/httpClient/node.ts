import HTTPClient, { HTTPOptions, Response, Method } from "./httpClient";
import request from "sync-request";

export default class NodeClient implements HTTPClient {
  public makeRequest(url: string, method: Method, options: HTTPOptions): Response {
    const res = request(method as any, url, options);
    return { status: res.statusCode, text: res.body.toString() };
  }
}

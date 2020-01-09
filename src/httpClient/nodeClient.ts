import HTTPClient, { HTTPOptions, Response, Method } from "./httpClient";
import fetch from "node-fetch";

export default class NodeClient implements HTTPClient {
  public makeRequest(url: string, method: Method, options: HTTPOptions): Promise<Response> {
    const { headers, ...restOptions } = options;

    return fetch(url, {
      method: method,
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      ...restOptions,
    }).then(res => {
      return res.text().then((body: string) => {
        return {
          status: res.status,
          body: body,
        };
      });
    }).catch(e => {
      throw new Error(e.message);
    });
  }
}

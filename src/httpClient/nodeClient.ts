import fetch from "cross-fetch";
import HTTPClient, { HTTPOptions, Method, Response } from "./httpClient";

export default class NodeClient implements HTTPClient {
  public async makeRequest(
    url: string,
    method: Method,
    options: HTTPOptions
  ): Promise<Response> {
    const { headers, ...restOptions } = options;

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          "content-type": "application/json",
          ...headers,
        },
        ...restOptions,
      });
      const body = await res.text();
      return {
        status: res.status,
        body: body,
      };
    } catch (e) {
      throw new Error(e.message);
    }
  }
}

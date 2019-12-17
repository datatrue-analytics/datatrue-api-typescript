export interface HTTPOptions {
  body?: string,
  headers: {[s: string]: string},
}

export interface Response {
  status: number,
  body: string,
}

export type Method = "get" | "delete" | "patch" | "post" | "put";

export default interface HTTPClient {
  makeRequest: (url: string, method: Method, options: HTTPOptions, callback?: (response: Response) => void, thisArg?: any) => void,
}

import AppsScriptClient from "./httpClient/appsScriptClient";
import * as DataTrue from "./index";

DataTrue.config.httpClient = new AppsScriptClient();

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
Object.assign(global, DataTrue);

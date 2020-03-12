import Resource from "./resource";
import NodeClient from "./httpClient/nodeClient";

Resource["client"] = new NodeClient();

export * from "./index";

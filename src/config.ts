import NodeClient from "./httpClient/nodeClient";

const config = {
  apiEndpoint: "https://datatrue.com",
  userToken: "",
  httpClient: new NodeClient(),
};

export default config;

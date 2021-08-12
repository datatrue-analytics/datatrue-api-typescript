import NodeClient from "./httpClient/nodeClient";

const config = {
  apiEndpoint: "https://app.datatrue.com",
  userToken: "",
  httpClient: new NodeClient(),
};

export default config;

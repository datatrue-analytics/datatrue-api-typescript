// @ts-nocheck

import DataLayerValidation from "./dataLayerValidation";
import Step from "./step";
import Suite from "./suite";
import TagValidation from "./tagValidation";
import Test from "./test";
import AppsScriptClient from "./httpClient/appsScriptClient";
import Resource from "./resource";

const config = {
  apiEndpoint: "datatrue.com",
  managementToken: "",
  ciToken: "",
};

global.DataLayerValidation = DataLayerValidation;
global.Step = Step;
global.Suite = Suite;
global.TagValidation = TagValidation;
global.Test = Test;
global.config = config;

Resource["client"] = new AppsScriptClient();
Resource["config"] = config;

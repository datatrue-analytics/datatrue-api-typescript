// @ts-nocheck

import AppsScriptClient from "./httpClient/appsScriptClient";
import DataLayerValidation from "./dataLayerValidation";
import Step, { StepActions, SelectorTypes, WebSelectorTypes, MobileSelectorTypes, IframeSelectorTypes } from "./step";
import Suite, { SuiteTypes } from "./suite";
import TagValidation, { TagValidationContexts } from "./tagValidation";
import Test, { TestTypes, VariableTypes } from "./test";
import Resource from "./resource";

const config = {
  apiEndpoint: "datatrue.com",
  userToken: "",
  accountToken: "",
};

global.DataLayerValidation = DataLayerValidation;

global.Step = Step;
global.StepActions = StepActions;
global.SelectorTypes = SelectorTypes;
global.WebSelectorTypes = WebSelectorTypes;
global.MobileSelectorTypes = MobileSelectorTypes;
global.IframeSelectorTypes = IframeSelectorTypes;

global.Suite = Suite;
global.SuiteTypes = SuiteTypes;

global.TagValidation = TagValidation;
global.TagValidationContexts = TagValidationContexts;

global.Test = Test;
global.TestTypes = TestTypes;
global.VariableTypes = VariableTypes;

global.config = config;

Resource["client"] = new AppsScriptClient();
Resource["config"] = config;

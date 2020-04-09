import DataLayerValidation, { DataLayerValidationOptions, PropertyValidation } from "./dataLayerValidation";
import Resource from "./resource";
import { JobStatus } from "./runnable";
import Step, { IframeSelectorTypes, MobileSelectorTypes, SelectorTypes, StepActions, StepOptions, StepSettings, WebSelectorTypes } from "./step";
import Suite, { SuiteOptions, SuiteTypes } from "./suite";
import TagValidation, { QueryValidation, TagDefinition, TagValidationContexts, TagValidationOptions } from "./tagValidation";
import Test, { TestOptions, TestTypes, Variables, VariableTypes } from "./test";

/**
 * @hidden
 */
const config = {
  apiEndpoint: "datatrue.com",
  userToken: "",
  accountToken: "",
};

Resource["config"] = config;

export {
  Resource,

  DataLayerValidation,
  DataLayerValidationOptions,
  PropertyValidation,

  JobStatus,

  Step,
  StepOptions,
  StepActions,
  WebSelectorTypes,
  MobileSelectorTypes,
  SelectorTypes,
  IframeSelectorTypes,
  StepSettings,

  Suite,
  SuiteOptions,
  SuiteTypes,

  TagValidation,
  TagValidationOptions,
  QueryValidation,
  TagDefinition,
  TagValidationContexts,

  Test,
  TestOptions,
  TestTypes,
  VariableTypes,
  Variables,

  config,
};

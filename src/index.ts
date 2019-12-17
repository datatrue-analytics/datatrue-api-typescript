import DataLayerValidation, { DataLayerValidationOptions, PropertyValidation } from "./dataLayerValidation";
import { JobStatus } from "./runnable";
import Step, { StepOptions, StepActions, SelectorTypes, IframeSelectorTypes, StepSettings } from "./step";
import Suite, { SuiteOptions, SuiteTypes } from "./suite";
import TagValidation, { TagValidationOptions, QueryValidation, TagDefinition } from "./tagValidation";
import Test, { TestOptions, TestTypes, VariableTypes, Variables } from "./test";
import NodeClient from "./httpClient/nodeClient";
import Resource from "./resource";

const config = {
  apiEndpoint: "datatrue.com",
  managementToken: "",
  ciToken: "",
};

const client = new NodeClient();
Resource["client"] = client;
Resource["config"] = config;

export {
  DataLayerValidation,
  DataLayerValidationOptions,
  PropertyValidation,

  JobStatus,

  Step,
  StepOptions,
  StepActions,
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

  Test,
  TestOptions,
  TestTypes,
  VariableTypes,
  Variables,

  config,
};

import config from "./config";
import AppsScriptClient from "./httpClient/appsScriptClient";
import { Report } from "./reports/report";
import { TagValidationDimension, TagValidationMetric, TagValidationReport } from "./reports/tagValidationReport";
import { TestResultDimension, TestResultMetric, TestResultReport } from "./reports/testResultReport";
import Account from "./resources/account";
import DataLayerValidation, { DataLayerValidationOptions, DataLayerValidationSource, PropertyValidation } from "./resources/dataLayerValidation";
import Resource from "./resources/resource";
import Step, { IframeSelectorTypes, MobileSelectorTypes, SelectorTypes, StepActions, StepOptions, StepSettings, WebSelectorTypes } from "./resources/step";
import Suite, { SensitiveDataSettings, SuiteOptions, SuiteTypes } from "./resources/suite";
import TagValidation, { QueryValidation, TagDefinition, TagValidationContexts, TagValidationOptions } from "./resources/tagValidation";
import Test, { TestOptions, TestTypes, Variables, VariableTypes } from "./resources/test";
import Runnable, { JobStatus } from "./runnable";

if (typeof UrlFetchApp !== "undefined") {
  config.httpClient = new AppsScriptClient();
}

export {
  Resource,

  Account,

  DataLayerValidation,
  DataLayerValidationOptions,
  DataLayerValidationSource,
  PropertyValidation,

  Runnable,
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
  SensitiveDataSettings,
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

  Report,

  TestResultReport,
  TestResultDimension,
  TestResultMetric,

  TagValidationReport,
  TagValidationDimension,
  TagValidationMetric,

  config,
};

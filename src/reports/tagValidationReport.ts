import { Report } from "./report";

const dimensions = [
  "process_time",
  "process_date",
  "step_id",
  "tag_definition_id",
  "page_url",
  "step_name",
  "tag_definition_name",
  "tag_type",
  "tag_validation_status",
  "tag_vendor",
  "start_date",
  "app_name",
  "app_version",
  "draft_tag_name",
  "draft_tag_status",
  "browser",
  "browser_version",
  "device_name",
  "os",
  "os_version",
  "platform",
  "platform_version",
  "initiated_by",
  "region_id",
  "region_name",
  "status",
  "suite_name",
  "suite_type",
  "test_run_mode",
  "test_run_type",
  "test_scenario_name",
  "test_type",
] as const;
export type TagValidationDimension = typeof dimensions[number];
export const tagValidationDimensions = new Set(dimensions);

const metrics = ["count_tag_validations"] as const;
export type TagValidationMetric = typeof metrics[number];
export const tagValidationMetrics = new Set(metrics);

export class TagValidationReport extends Report<TagValidationDimension, TagValidationMetric> {
  protected static dimensions: Set<string> = tagValidationDimensions;
  protected static metrics: Set<string> = tagValidationMetrics;
  protected static endpoint: string = "tag_validations";
}

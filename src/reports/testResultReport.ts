import { Report } from "./report";

export const dimensions = [
  "test_result_id",
  "test_run_id",
  "user_id",
  "test_id",
  "suite_id",
  "start_time",
  "start_date",
  "finish_time",
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
  "test_name",
  "test_type",
] as const;
export type TestResultDimension = typeof dimensions[number];
export const testResultDimensions = new Set(dimensions);

const metrics = [
  "run_duration",
  "avg_run_duration",
  "steps_used",
  "avg_steps_used",
  "coverage_pages",
  "avg_coverage_pages",
  "coverage_pages_failed",
  "avg_coverage_pages_failed",
  "coverage_pages_passed",
  "avg_coverage_pages_passed",
  "coverage_pages_partial",
  "avg_coverage_pages_partial",
  "coverage_tags",
  "avg_coverage_tags",
  "coverage_tags_passed",
  "avg_coverage_tags_passed",
  "coverage_tags_partial",
  "avg_coverage_tags_partial",
  "coverage_tags_discovered",
  "avg_coverage_tags_discovered",
  "avg_coverage_tags_hierarchy_depth",
  "max_coverage_tags_hierarchy_depth",
  "coverage_tag_validations",
  "avg_coverage_tag_validations",
  "coverage_tag_validations_failed",
  "avg_coverage_tag_validations_failed",
  "coverage_tag_validations_passed",
  "avg_coverage_tag_validations_passed",
  "coverage_tag_validations_partial",
  "avg_coverage_tag_validations_partial",
  "coverage_pages_load_time_below_2",
  "avg_coverage_pages_load_time_below_2",
  "coverage_pages_load_time_2_to_5",
  "avg_coverage_pages_load_time_2_to_5",
  "coverage_pages_load_time_above_5",
  "avg_coverage_pages_load_time_above_5",
  "avg_coverage_load_time",
  "data_layer_validations",
  "avg_data_layer_validations",
  "data_layer_validations_failed",
  "avg_data_layer_validations_failed",
  "data_layer_validations_passed",
  "avg_data_layer_validations_passed",
  "tag_validations",
  "avg_tag_validations",
  "tag_validations_failed",
  "avg_tag_validations_failed",
  "tag_validations_passed",
  "avg_tag_validations_passed",
  "steps",
  "avg_steps",
  "avg_sensitive_data_exposure_rating",
  "avg_sensitive_data_types",
  "avg_sensitive_data_processors",
  "sensitive_data_exposures",
  "avg_sensitive_data_exposures",
  "tests_executed",
] as const;
export type TestResultMetric = typeof metrics[number];
export const testResultMetrics = new Set(metrics);

export class TestResultReport extends Report<TestResultDimension, TestResultMetric> {
  protected static dimensions: Set<string> = testResultDimensions;
  protected static metrics: Set<string> = testResultMetrics;
  protected static endpoint: string = "test_results";
}

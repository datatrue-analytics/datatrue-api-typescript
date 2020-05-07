import { Report } from "./report";

export const testResultDimensions = [
  "test_result_id",
  "test_scenario_name",
  "test_scenario_id",
  "suite_name",
  "suite_id",
  "start_date",
  "finish_date",
  "start_time",
] as const;
export type TestResultDimension = typeof testResultDimensions[number];

export const testResultMetrics = [
  "count_test_results",
] as const;
export type TestResultMetric = typeof testResultMetrics[number];

export class TestResultReport extends Report<TestResultDimension, TestResultMetric> {
  protected static dimensions: readonly string[] = testResultDimensions;
  protected static metrics: readonly string[] = testResultMetrics;
  protected static endpoint: string = "test_results";
}

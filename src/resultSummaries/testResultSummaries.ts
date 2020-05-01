import { ResultSummaries } from "./resultSummaries";

const testResultDimensions = [
  "test_result_id",
  "test_scenario_name",
  "test_scenario_id",
  "suite_name",
  "suite_id",
  "start_date",
  "finish_date",
  "start_time",
] as const;
type TestResultDimension = typeof testResultDimensions[number];

const testResultMetrics = [
  "count_test_results",
] as const;
type TestResultMetric = typeof testResultMetrics[number];

export class TestResultSummaries extends ResultSummaries<TestResultDimension, TestResultMetric> {
  protected static dimensions: readonly string[] = testResultDimensions;
  protected static metrics: readonly string[] = testResultMetrics;
}

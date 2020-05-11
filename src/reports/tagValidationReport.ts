import { ExtractSetGeneric, Report } from "./report";
import { testResultDimensions } from "./testResultReport";

export const tagValidationDimensions = new Set(
  [
    ...[
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
    ] as const,
    ...testResultDimensions,
  ]
);
export type TagValidationDimension = ExtractSetGeneric<
  typeof tagValidationDimensions
>;

export const tagValidationMetrics = new Set([
  "count_tag_validations",
] as const);
export type TagValidationMetric = ExtractSetGeneric<
  typeof tagValidationMetrics
>;

export class TagValidationReport extends Report<TagValidationDimension, TagValidationMetric> {
  protected static dimensions: Set<string> = tagValidationDimensions;
  protected static metrics: Set<string> = tagValidationMetrics;
  protected static endpoint: string = "tag_validations";
}

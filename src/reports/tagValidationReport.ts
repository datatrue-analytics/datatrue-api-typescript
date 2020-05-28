import { Report } from "./report";
import { dimensions as testResultDimensions } from "./testResultReport";

const dimensions = [
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
];
export type TagValidationDimension = typeof dimensions[number];
export const tagValidationDimensions = new Set(dimensions);

const metrics = ["tag_validations_processed"] as const;
export type TagValidationMetric = typeof metrics[number];
export const tagValidationMetrics = new Set(metrics);

export class TagValidationReport extends Report<TagValidationDimension, TagValidationMetric> {
  protected static dimensions: Set<string> = tagValidationDimensions;
  protected static metrics: Set<string> = tagValidationMetrics;
  protected static endpoint: string = "tag_validations";
}

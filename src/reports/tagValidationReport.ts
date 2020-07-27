import { Report } from "./report";
import { dimensions as testResultDimensions } from "./testResultReport";

/** @hidden */
const dimensions = [
  ...[
    "process_time",
    "process_date",
    "step_id",
    "tag_validation_id",
    "tag_definition_id",
    "page_url",
    "step_name",
    "tag_validation_name",
    "tag_definition_name",
    "tag_type",
    "tag_validation_status",
    "tag_vendor",
  ] as const,
  ...testResultDimensions,
];
export type TagValidationDimension = typeof dimensions[number];
/** @hidden */
export const tagValidationDimensions = new Set(dimensions);

/** @hidden */
const metrics = ["tag_validations_processed"] as const;
export type TagValidationMetric = typeof metrics[number];
/** @hidden */
export const tagValidationMetrics = new Set(metrics);

export class TagValidationReport extends Report<TagValidationDimension, TagValidationMetric> {
  protected static dimensions: Set<string> = tagValidationDimensions;
  protected static metrics: Set<string> = tagValidationMetrics;
  protected static endpoint: string = "tag_validations";
}

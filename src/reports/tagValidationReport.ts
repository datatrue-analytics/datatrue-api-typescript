import { Report } from "./report";

export const tagValidationDimensions = [] as const;
export type TagValidationDimension = typeof tagValidationDimensions[number];

export const tagValidationMetrics = [] as const;
export type TagValidationMetric = typeof tagValidationMetrics[number];

export class TagValidationReport extends Report<TagValidationDimension, TagValidationMetric> {
  protected static dimensions: readonly string[] = tagValidationDimensions;
  protected static metrics: readonly string[] = tagValidationMetrics;
  protected static endpoint: string = "tag_validations";
}

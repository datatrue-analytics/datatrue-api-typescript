import { ExtractSetGeneric, Report } from "./report";

export const tagValidationDimensions = new Set([] as const);
export type TagValidationDimension = ExtractSetGeneric<
  typeof tagValidationDimensions
>;

export const tagValidationMetrics = new Set([] as const);
export type TagValidationMetric = ExtractSetGeneric<
  typeof tagValidationMetrics
>;

export class TagValidationReport extends Report<TagValidationDimension, TagValidationMetric> {
  protected static dimensions: Set<string> = tagValidationDimensions;
  protected static metrics: Set<string> = tagValidationMetrics;
  protected static endpoint: string = "tag_validations";
}

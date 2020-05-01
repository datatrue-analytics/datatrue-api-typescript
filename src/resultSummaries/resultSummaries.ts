interface Filter<T> {
  field: T,
  operator: string,
  exclude: boolean,
  value: Value,
}

interface FilterClause<T> {
  operator?: "AND" | "OR",
  filters: Filter<T>[],
}

interface Order {
  field: string,
  direction: "ASC" | "DESC",
}

interface Field<T> {
  name: T,
}

export type Value = string | number | string[] | number[] | null;

interface Request<Dimension, Metric> {
  account_id: number,
  dimensions: Field<Dimension>[],
  metrics: Field<Metric>[],
  dimension_filter_clauses: FilterClause<Dimension>[],
  metric_filter_clauses: FilterClause<Metric>[],
  settings: {
    sort: Order[],
    page: number,
    page_length: number,
  },
}

export type Op = "==" | ">" | ">=" | "<" | "<=" | "=~" | "in";
export type Operator = "EQUALS" | "GREATER_THAN" | "GREATER_THAN_OR_EQUALS" | "LESS_THAN" | "LESS_THAN_OR_EQUALS" | "REGEX_MATCH" | "INCLUDES";

const OpToOperator: Record<Op, Operator> = {
  "==": "EQUALS",
  ">": "GREATER_THAN",
  ">=": "GREATER_THAN_OR_EQUALS",
  "<": "LESS_THAN",
  "<=": "LESS_THAN_OR_EQUALS",
  "=~": "REGEX_MATCH",
  "in": "INCLUDES",
};

export abstract class ResultSummaries<
  Dimension extends string,
  Metric extends string
> {
  protected static dimensions: readonly string[];
  protected static metrics: readonly string[];

  private dimensions: Field<Dimension>[] = [];
  private metrics: Field<Metric>[] = [];

  private dimensionFilters: Filter<Dimension>[] = [];
  private metricFilters: Filter<Metric>[] = [];

  private orders: Order[] = [];

  public constructor(private accountId: number) { }

  public select(
    ...fields: (Dimension | Metric)[]
  ): ResultSummaries<Dimension, Metric> {
    const dimensions = (this.constructor as typeof ResultSummaries).dimensions;
    const metrics = (this.constructor as typeof ResultSummaries).metrics;
    fields.forEach(field => {
      if (dimensions.includes(field)) {
        this.dimensions.push({
          name: field as Dimension,
        });
      } else if (metrics.includes(field)) {
        this.metrics.push({
          name: field as Metric,
        });
      }
    });

    return this;
  }

  public where(
    field: Dimension | Metric,
    operator: Op,
    value: Value,
    exclude: boolean = false
  ): ResultSummaries<Dimension, Metric> {
    const dimensions = (this.constructor as typeof ResultSummaries).dimensions;
    const metrics = (this.constructor as typeof ResultSummaries).metrics;

    if (dimensions.includes(field)) {
      this.dimensionFilters.push({
        field: field as Dimension,
        exclude: exclude,
        operator: OpToOperator[operator],
        value: value,
      });
    } else if (metrics.includes(field)) {
      this.metricFilters.push({
        field: field as Metric,
        exclude: exclude,
        operator: OpToOperator[operator],
        value: value,
      });
    }
    return this;
  }

  public order(
    field: string,
    direction: "ASC" | "DESC" = "ASC"
  ): ResultSummaries<Dimension, Metric> {
    this.orders.push({ field: field, direction: direction });
    return this;
  }

  public rows(
    page: number = 0,
    pageLength: number = 1000
  ): Record<Dimension | Metric, string | number>[] {
    const request: Request<Dimension, Metric> = {
      account_id: this.accountId,
      dimensions: this.dimensions,
      metrics: this.metrics,
      dimension_filter_clauses: [
        {
          operator: "AND",
          filters: this.dimensionFilters,
        },
      ],
      metric_filter_clauses: [
        {
          operator: "AND",
          filters: this.metricFilters,
        },
      ],
      settings: {
        sort: this.orders,
        page: page,
        page_length: pageLength,
      },
    };

    const body = JSON.stringify(request);

    return [];
  }
}

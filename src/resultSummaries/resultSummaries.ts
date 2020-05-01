interface Filter<T> {
  field: T,
  operator: string,
  exclude?: boolean,
  value: Value,
}

interface FilterClause<T> {
  operator?: "AND" | "OR",
  filters: Filter<T>[],
}

type Direction = "ASC" | "DESC";

interface Order {
  field: string,
  direction?: Direction,
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
export type Operator = (
  "EQUALS" |
  "GREATER_THAN" |
  "GREATER_THAN_OR_EQUALS" |
  "LESS_THAN" |
  "LESS_THAN_OR_EQUALS" |
  "REGEX_MATCH" |
  "INCLUDES"
);

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

  private dimensionFilterClauses: FilterClause<Dimension>[] = [];
  private metricFilterClauses: FilterClause<Metric>[] = [];

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
    exclude?: boolean
  ): ResultSummaries<Dimension, Metric>;

  public where(
    ...args: [Dimension | Metric, Op, Value, boolean?][]
  ): ResultSummaries<Dimension, Metric>;

  public where(...args: any): ResultSummaries<Dimension, Metric> {
    const dimensions = (this.constructor as typeof ResultSummaries).dimensions;
    const metrics = (this.constructor as typeof ResultSummaries).metrics;

    let filters: [Dimension | Metric, Op, Value, boolean?][];

    if (Array.isArray(args[0])) {
      filters = args;
    } else {
      filters = [args];
    }

    filters.forEach(([field, operator, value, exclude]) => {
      if (dimensions.includes(field)) {
        this.dimensionFilterClauses.push({
          filters: [
            {
              field: field as Dimension,
              exclude: exclude === undefined ? false : exclude,
              operator: OpToOperator[operator],
              value: value,
            },
          ],
        });
      } else if (metrics.includes(field)) {
        this.metricFilterClauses.push({
          filters: [
            {
              field: field as Metric,
              exclude: exclude === undefined ? false : exclude,
              operator: OpToOperator[operator],
              value: value,
            },
          ],
        });
      }
    });

    return this;
  }

  public order(
    field: string,
    direction: Direction = "ASC"
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
      dimension_filter_clauses: this.dimensionFilterClauses,
      metric_filter_clauses: this.metricFilterClauses,
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

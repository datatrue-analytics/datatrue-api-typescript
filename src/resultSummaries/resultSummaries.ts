interface Filter<T extends string> {
  field: T,
  operator: string,
  exclude?: boolean,
  value: Value,
}

interface FilterClause<T extends string> {
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

type ArrayOneOrMore<T> = {
  0: T,
} & T[];

export type Value = string | number | string[] | number[] | null;

interface Request<Dimension extends string, Metric extends string> {
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

  public where<T extends Dimension>(
    ...args: ArrayOneOrMore<[T, Op, Value, boolean?]>
  ): ResultSummaries<Dimension, Metric>;

  public where<T extends Metric>(
    ...args: ArrayOneOrMore<[T, Op, Value, boolean?]>
  ): ResultSummaries<Dimension, Metric>

  public where<T extends Dimension | Metric>(...args: any): ResultSummaries<Dimension, Metric> {
    const dimensions = (this.constructor as typeof ResultSummaries).dimensions;
    const metrics = (this.constructor as typeof ResultSummaries).metrics;

    const filterClause: FilterClause<T> = { filters: [] };

    let filters: [T, Op, Value, boolean?][];

    if (Array.isArray(args[0])) {
      filters = args;
    } else {
      filters = [args];
    }

    filters.forEach(([field, operator, value, exclude]) => {
      filterClause.filters.push({
        field: field,
        exclude: exclude === undefined ? false : exclude,
        operator: OpToOperator[operator],
        value: value,
      });
    });

    if (filterClause.filters.length) {
      if (dimensions.includes(filterClause.filters[0].field)) {
        this.dimensionFilterClauses.push(filterClause as FilterClause<Dimension>);
      } else if (metrics.includes(filterClause.filters[0].field)) {
        this.metricFilterClauses.push(filterClause as FilterClause<Metric>);
      }
    }

    return this;
  }

  public order(
    field: Dimension | Metric,
    direction?: Direction
  ): ResultSummaries<Dimension, Metric>;

  public order(
    ...args: [string, Direction?][]
  ): ResultSummaries<Dimension, Metric>;

  public order(...args: any): ResultSummaries<Dimension, Metric> {
    let orders: [Dimension | Metric, Direction?][];

    if (Array.isArray(args[0])) {
      orders = args;
    } else {
      orders = [args];
    }

    orders.forEach(([field, direction]) => {
      this.orders.push({
        field: field,
        direction: direction === undefined ? "ASC" : direction,
      });
    });

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

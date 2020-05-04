import config from "../config";

/**
 * @hidden
 */
interface Filter<T extends string> {
  field: T,
  operator: string,
  exclude?: boolean,
  value: Value,
}

/**
 * @hidden
 */
interface FilterClause<T extends string> {
  operator?: "AND" | "OR",
  filters: Filter<T>[],
}

export type Direction = "ASC" | "DESC";

/**
 * @hidden
 */
interface Order {
  field: string,
  direction?: Direction,
}

/**
 * @hidden
 */
interface Field<T> {
  name: T,
}

type ArrayOneOrMore<T> = {
  0: T,
} & T[];

export type Value = string | number | string[] | number[] | null;

/**
 * @hidden
 */
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

export type Op = "==" | ">" | ">=" | "<" | "<=" | "=~" | "*=";

/**
 * @hidden
 */
type Operator = (
  "EQUALS" |
  "GREATER_THAN" |
  "GREATER_THAN_OR_EQUALS" |
  "LESS_THAN" |
  "LESS_THAN_OR_EQUALS" |
  "REGEX_MATCH" |
  "CONTAINS" |
  "BETWEEN"
);

/**
 * @hidden
 */
const OpToOperator: Record<Op, Operator> = {
  "==": "EQUALS",
  ">": "GREATER_THAN",
  ">=": "GREATER_THAN_OR_EQUALS",
  "<": "LESS_THAN",
  "<=": "LESS_THAN_OR_EQUALS",
  "=~": "REGEX_MATCH",
  "*=": "CONTAINS",
};

export abstract class ResultSummaries<
  Dimension extends string,
  Metric extends string
> {
  protected static dimensions: readonly string[];
  protected static metrics: readonly string[];
  protected static endpoint: string;

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

  public where<T extends Dimension | Metric>(
    ...args: any
  ): ResultSummaries<Dimension, Metric> {
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
    ...args: ArrayOneOrMore<[Dimension | Metric, Direction?]>
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

  public async rows(
    page: number = 0,
    pageLength: number = 1000
  ): Promise<Record<Dimension | Metric, string | number | null>[]> {
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

    const response = await config.httpClient.makeRequest(
      `${config.apiEndpoint}/reporting_api/v1/${(this.constructor as typeof ResultSummaries).endpoint}`,
      "post",
      {
        body: body,
        headers: {
          "authorization": `Token ${config.userToken}`,
        },
      },
    );

    let responseBody: any;

    try {
      responseBody = JSON.parse(response.body);
    } catch {
      throw new Error("Unable to parse response");
    }

    if (response.status === 401) {
      throw new Error(responseBody.message);
    } else if (response.status >= 400) {
      throw new Error("Unable to fetch rows");
    }

    return responseBody.rows;
  }
}

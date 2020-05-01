const dimensions = [
  "test_result_id",
  "test_scenario_name",
  "test_scenario_id",
  "suite_name",
  "suite_id",
  "start_date",
  "finish_date",
  "start_time",
] as const;
type Dimension = typeof dimensions[number];

const metrics = [
  "count_test_results",
] as const;
type Metric = typeof metrics[number];

interface Filter<T>{
  field: T,
  operator: string,
  exclude: boolean,
  value: Value,
}

interface FilterClause<T>{
  operator?: "AND" | "OR",
  filters: Filter<T>[],
}

interface Order {
  field: string,
  direction: "ASC" | "DESC",
}

interface Field {
  name: string,
}

type Value = string | number | string[] | number[] | null;

interface Request {
  account_id: number,
  dimensions: Field[],
  metrics: Field[],
  dimension_filter_clauses: FilterClause<Dimension>[],
  metric_filter_clauses: FilterClause<Metric>[],
  settings: {
    sort: Order[],
    page: number,
    page_length: number,
  },
}

export type Op = "===" | ">" | ">=" | "<" | "<=" | "=~" | "in";
export type Operator = "EQUALS" | "GREATER_THAN" | "GREATER_THAN_OR_EQUALS" | "LESS_THAN" | "LESS_THAN_OR_EQUALS" | "REGEX_MATCH" | "INCLUDES";

const OpToOperator: Record<Op, Operator> = {
  "===": "EQUALS",
  ">": "GREATER_THAN",
  ">=": "GREATER_THAN_OR_EQUALS",
  "<": "LESS_THAN",
  "<=": "LESS_THAN_OR_EQUALS",
  "=~": "REGEX_MATCH",
  "in": "INCLUDES",
};

export class TestResultSummaries {
  private dimensions: Field[] = [];
  private metrics: Field[] = [];

  private dimensionFilters: Filter<Dimension>[] = [];
  private metricFilters: Filter<Metric>[] = [];

  private orders: Order[] = [];

  public constructor(private accountId: number) { }

  public select(...fields: string[]): TestResultSummaries {
    fields.forEach(field => {
      this.dimensions.push({
        name: field,
      });
    });

    return this;
  }

  public where(
    field: Dimension | Metric,
    operator: Op,
    value: Value,
    exclude: boolean = false
  ): TestResultSummaries {
    if (dimensions.includes(field as Dimension)) {
      this.dimensionFilters.push({
        field: field as Dimension,
        exclude: exclude,
        operator: OpToOperator[operator],
        value: value,
      });
    } else if (metrics.includes(field as Metric)) {
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
  ): TestResultSummaries {
    this.orders.push({ field: field, direction: direction });
    return this;
  }

  public rows(
    page: number = 0,
    pageLength: number = 1000
  ): Record<string, any>[] {
    const request: Request = {
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

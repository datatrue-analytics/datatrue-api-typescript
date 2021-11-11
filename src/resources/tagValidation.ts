import { Suite } from "..";
import { TagValidationReport } from "../reports/tagValidationReport";
import Resource, { ResourceOptions } from "./resource";
import Step from "./step";
import Test from "./test";

export enum Operator {
  EQUALS = "equals",
  IS_ONE_OF = "is_one_of",
  STARTS_WITH = "starts_with",
  ENDS_WITH = "ends_with",
  CONTAINS = "contains",
  REGEXP_MATCH = "regexp_match",
}

export interface QueryValidation {
  key: string,
  value: string,
  operator: Operator,
  json_path?: string,
  use_json_path: boolean,
  decode_result_as?: string,
}

export interface TagValidationOptions extends ResourceOptions {
  enabled?: boolean,
  detect_duplicates?: boolean,
  validate_absence?: boolean,
  hostname_validation?: string,
  pathname_validation?: string,
  hostname_detection?: string,
  pathname_detection?: string,
  query_detection?: string,
  account_id?: string,
  do_validation?: boolean,
  interception?: {
    intercept?: boolean,
    intercept_status?: number,
    intercept_headers?: string,
    intercept_body?: string,
  },
}

export interface TagDefinition {
  key: string,
}

export enum TagValidationContexts {
  TEST = "test",
  STEP = "step",
}

export default class TagValidation extends Resource {
  public static readonly resourceType: string = "tag_validation";
  public static readonly childTypes: readonly string[] = [];

  private queryValidations: QueryValidation[] = [];

  public tagDefinition: TagDefinition;
  public options: TagValidationOptions = {};

  public constructor(
    name: string,
    key: string,
    protected contextType: TagValidationContexts = TagValidationContexts.STEP,
    protected contextID?: number,
    options: TagValidationOptions = {}
  ) {
    super(name);
    this.tagDefinition = {
      key: key,
    };
    this.setOptions(options);
  }

  public static async fromID(id: number): Promise<TagValidation> {
    const resource = await super.getResource(id, TagValidation.resourceType);
    return TagValidation.fromJSON(JSON.parse(resource) as Record<string, any>);
  }

  public static fromJSON(
    obj: Record<string, any>,
    copy: boolean = false
  ): TagValidation {
    const {
      name,
      id,
      test_id: testId,
      step_id: stepId,
      tag_definition: tagDefinition,
      query_validation: queryValidation,
      ...options
    } = obj;

    let contextID: number | undefined = undefined;
    let contextType: TagValidationContexts | undefined = undefined;

    if (testId !== undefined) {
      contextID = testId;
      contextType = TagValidationContexts.TEST;
    } else if (stepId !== undefined) {
      contextID = stepId;
      contextType = TagValidationContexts.STEP;
    }

    const tagValidation = new TagValidation(
      name,
      tagDefinition.key,
      contextType,
      contextID
    );

    if (!copy) {
      tagValidation.setResourceID(id);
    }
    tagValidation.setOptions(options, true);

    if (queryValidation !== undefined) {
      queryValidation.forEach((queryValidationObj: QueryValidation) => {
        tagValidation.insertQueryValidation(queryValidationObj);
      });
    }

    return tagValidation;
  }

  public insertQueryValidation(
    queryValidation: QueryValidation,
    index: number = this.queryValidations.length
  ): void {
    super.insertChild(queryValidation, index, "queryValidations");
  }

  public deleteQueryValidation(index: number): void {
    this.queryValidations.splice(index, 1);
  }

  public getQueryValidations(): readonly QueryValidation[] {
    return this.queryValidations.slice();
  }

  public setOptions(
    options: TagValidationOptions,
    override: boolean = false
  ): void {
    if (override) {
      this.options = options;
    } else {
      this.options = {
        ...this.options,
        ...options,
        interception: {
          ...this.options.interception,
          ...options.interception,
        },
      };
    }
    super.setOptions(options, override);
  }

  public setContextType(contextType: TagValidationContexts): void {
    this.contextType = contextType;
  }

  public toJSON(): Promise<Record<string, any>> {
    const obj: Record<string, any> = {
      id: this.resourceID,
      name: this.name,
      tag_definition: this.tagDefinition,
      query_validation: this.queryValidations,
      ...this.options,
      interception: {
        ...this.options.interception,
      },
    };

    return Promise.resolve(obj);
  }

  public async report(): Promise<TagValidationReport> {
    const id = this.getResourceID();
    const contextID = this.getContextID();

    if (id === undefined) {
      throw new Error("Resource ID must be set");
    }

    if (contextID === undefined) {
      throw new Error("Context ID must be set");
    }

    let accountID: number;

    try {
      let test: Test;

      if (this.getContextType() === TagValidationContexts.STEP) {
        const step = await Step.fromID(contextID);
        test = await Test.fromID(step.getContextID()!);
      } else {
        test = await Test.fromID(contextID);
      }

      accountID = (await Suite.fromID(test.getContextID()!)).getContextID()!;
    } catch (e) {
      throw new Error("Failed to determine account ID");
    }

    return new TagValidationReport(accountID)
      .where("tag_validation_id", "==", id);
  }
}

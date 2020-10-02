import { Suite } from "..";
import { TagValidationReport } from "../reports/tagValidationReport";
import Resource, { ResourceOptions } from "./resource";
import Step from "./step";
import Test from "./test";

export interface QueryValidation {
  key: string,
  value: string,
  regex: boolean,
  json_path?: string,
  use_json_path: boolean,
  decode_result_as?: string,
}

export interface TagValidationOptions extends ResourceOptions {
  enabled?: boolean,
  do_validation?: boolean,
  detect_duplicates?: boolean,
  validate_absence?: boolean,
  hostname_validation?: string,
  pathname_validation?: string,
  hostname_detection?: string,
  pathname_detection?: string,
  query_detection?: string,
  account_id?: string,
  interception?: {
    intercept?: boolean,
    intercept_status?: string,
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
  public options: TagValidationOptions = {
    do_validation: true,
  };

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
    return TagValidation.fromJSON(JSON.parse(resource));
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

    if (options.do_validation !== undefined) {
      options.do_validation = options.do_validation === "1" ? true : false;
    }

    if (options.interception?.intercept !== undefined) {
      options.interception.intercept = options.interception.intercept === "1" ? true : false;
    }

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

    if (obj.do_validation !== undefined) {
      obj.do_validation = obj.do_validation ? "1" : "0";
    }

    if (obj.interception?.intercept !== undefined) {
      obj.interception.intercept = obj.interception.intercept ? "1" : "0";
    }

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

import Resource, { ResourceOptions } from "./resource";

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
    public readonly contextType: TagValidationContexts = TagValidationContexts.STEP,
    public contextID?: number,
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
    copy: boolean = false,
    contextType: TagValidationContexts = TagValidationContexts.STEP
  ): TagValidation {
    const { name, id, tag_definition, query_validation, ...options } = obj;

    if (options.do_validation !== undefined) {
      options.do_validation = options.do_validation === "1" ? true : false;
    }

    if (options.interception?.intercept !== undefined) {
      options.interception.intercept = options.interception.intercept === "1" ? true : false;
    }

    const tagValidation = new TagValidation(name, tag_definition.key, contextType);
    if (!copy) {
      tagValidation.setResourceID(id);
    }
    tagValidation.setOptions(options, true);

    if (query_validation !== undefined) {
      query_validation.forEach((queryValidationObj: QueryValidation) => {
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

  public toJSON(): Promise<Record<string, any>> {
    const obj: Record<string, any> = {
      name: this.name,
      tag_definition: this.tagDefinition,
      query_validation: this.queryValidations,
      ...this.options,
    };

    if (obj.do_validation !== undefined) {
      obj.do_validation = obj.do_validation ? "1" : "0";
    }

    if (obj.interception?.intercept !== undefined) {
      obj.interception.intercept = obj.interception.intercept ? "1" : "0";
    }

    return Promise.resolve(obj);
  }
}

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
  validate_absence?: boolean,
  hostname_validation?: string,
  pathname_validation?: string,
  hostname_detection?: string,
  pathname_detection?: string,
  query_detection?: string,
  account_id?: string,
  interception?: {
    do_validation?: boolean,
    intercept?: boolean,
    intercept_status?: string,
    intercept_headers?: string,
    intercept_body?: string,
  },
}

export interface TagDefinition {
  key: string,
}

export default class TagValidation extends Resource {
  public static readonly contextType: string = "step";
  public static readonly resourceType: string = "tag_validation";
  public static readonly childTypes: string[] = [];

  private queryValidations: QueryValidation[] = [];

  public tagDefinition: TagDefinition;
  public options: TagValidationOptions = {
    interception: {
      do_validation: true,
    },
  };

  public constructor(name: string, key: string, public contextID?: number, options: TagValidationOptions = {}) {
    super(name);
    this.tagDefinition = {
      key: key,
    };
    this.setOptions(options);
  }

  public static fromID(id: number, callback?: (tagValidation: TagValidation) => void, thisArg?: any): void {
    super.getResource(id, TagValidation.resourceType, (resource: string) => {
      if (typeof callback === "function") {
        callback.call(thisArg, TagValidation.fromJSON(JSON.parse(resource)));
      }
    });
  }

  public static fromJSON(obj: Record<string, any>, copy: boolean = false): TagValidation {
    const { name, id, tag_definition, query_validation, ...options } = obj;

    if (Object.prototype.hasOwnProperty.call(options, "interception")) {
      if (Object.prototype.hasOwnProperty.call(options["interception"], "do_validation")) {
        options["interception"]["do_validation"] = options["interception"]["do_validation"] === "1" ? true : false;
      }
      if (Object.prototype.hasOwnProperty.call(options["interception"], "intercept")) {
        options["interception"]["intercept"] = options["interception"]["intercept"] === "1" ? true : false;
      }
    }

    const tagValidation = new TagValidation(name, tag_definition.key);
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

  public insertQueryValidation(queryValidation: QueryValidation, index: number = this.queryValidations.length): void {
    super.insertChild(queryValidation, index, "queryValidations");
  }

  public deleteQueryValidation(index: number): void {
    this.queryValidations.splice(index, 1);
  }

  public getQueryValidations(): readonly QueryValidation[] {
    return this.queryValidations.slice();
  }

  public setOptions(options: TagValidationOptions, override: boolean = false): void {
    super.setOptions(options, override);
  }

  public toJSON(): Record<string, any> {
    const obj: Record<string, any> = {
      name: this.name,
      tag_definition: this.tagDefinition,
      query_validation: this.queryValidations,
    };

    for (const option in this.options) {
      obj[option] = (this.options as Record<string, any>)[option];
    }

    if (Object.prototype.hasOwnProperty.call(obj, "interception")) {
      if (Object.prototype.hasOwnProperty.call(obj["interception"], "do_validation")) {
        obj["interception"]["do_validation"] = obj["interception"]["do_validation"] ? "1" : "0";
      }
      if (Object.prototype.hasOwnProperty.call(obj["interception"], "intercept")) {
        obj["interception"]["intercept"] = obj["interception"]["intercept"] ? "1" : "0";
      }
    }

    return obj;
  }
}

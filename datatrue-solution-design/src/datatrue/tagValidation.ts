namespace DataTrue {
  export interface QueryValidation {
    key: string,
    value: string,
    regex: boolean,
    json_path?: string,
    use_json_path: boolean,
    decode_result_as?: string,
  }

  export interface TagValidationOptions {
    description?: string,
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

  export class TagValidation extends DataTrue.Resource {
    public static readonly contextType: string = "step";
    public static readonly resourceType: string = "tag_validations";
    public static readonly children: string[] = [];

    private queryValidations: readonly DataTrue.QueryValidation[] = [];
    private tagDefinition: DataTrue.TagDefinition;

    public options: DataTrue.TagValidationOptions = {
      interception: {
        do_validation: true,
      },
    };

    public constructor(name: string, key: string, public contextID?: number, options: DataTrue.TagValidationOptions = {}) {
      super(name);
      this.tagDefinition = {
        key: key,
      };
      this.setOptions(options);
    }

    public static fromID(id: number): DataTrue.TagValidation {
      const obj = super.getResource(id);
      return this.fromJSON(obj);
    }

    public static fromJSON(obj: any): DataTrue.TagValidation {
      const { name, id, tag_definition, query_validation, ...options } = obj;

      if (Object.prototype.hasOwnProperty.call(options, "interception")) {
        if (Object.prototype.hasOwnProperty.call(options["interception"], "do_validation")) {
          options["interception"]["do_validation"] = options["interception"]["do_validation"] === "1" ? true : false;
        }
        if (Object.prototype.hasOwnProperty.call(options["interception"], "intercept")) {
          options["interception"]["intercept"] = options["interception"]["intercept"] === "1" ? true : false;
        }
      }

      const tagValidation = new DataTrue.TagValidation(name, tag_definition.key);
      tagValidation.setResourceID(id);
      tagValidation.setOptions(options, true);

      query_validation.forEach(queryValidationObj => {
        tagValidation.addQueryValidation(queryValidationObj);
      });

      return tagValidation;
    }

    public addQueryValidation(queryValidation: DataTrue.QueryValidation, index: number = -1): void {
      super.addChild(queryValidation, index, "queryValidations");
    }

    public deleteQueryValidation(index: number): void {
      const queryValidations = this["queryValidations"].slice();
      queryValidations.splice(index, 1);
      this["queryValidations"] = queryValidations;
    }

    public setOptions(options: DataTrue.TagValidationOptions, override: boolean = false): void {
      super.setOptions(options, override);
    }

    public toJSON(): object {
      const obj: object = {
        name: this.name,
        tag_definition: this.tagDefinition,
        query_validation: this.queryValidations,
      };

      for (const option in this.options) {
        obj[option] = this.options[option];
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

    public run(): void {
      throw new Error("Unable to run TagValidation");
    }

    public progress(): DataTrue.JobStatus {
      throw new Error("Unable to retrieve progress for TagValidation");
    }
  }
}

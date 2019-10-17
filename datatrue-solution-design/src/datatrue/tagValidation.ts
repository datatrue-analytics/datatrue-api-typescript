namespace DataTrue {
  export interface QueryValidation {
    key: string,
    value: string,
    regex: boolean,
    json_path?: string,
    use_json_path: boolean,
    decode_result_as?: string
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
    }
  }

  export interface TagDefinition {

  }

  export class TagValidation extends DataTrue.Resource {
    static readonly contextType: string = "step";
    static readonly resourceType: string = "tag_validations";
    static readonly children: string[] = [];

    private queryValidations: QueryValidation[] = [];
    private tagDefinition: Object;

    public options: DataTrue.TagValidationOptions = {
      interception: {
        do_validation: true
      }
    };

    constructor(name: string, key: string, public contextID?: number, options: DataTrue.TagValidationOptions = {}) {
      super(name);
      this.tagDefinition = {
        key: key
      };
      this.setOptions(options);
    }

    addQueryValidation(queryValidation: QueryValidation) {
      this.queryValidations.push(queryValidation);
    }

    setOptions(options: TagValidationOptions, override: boolean = false) {
      super.setOptions(options, override);
    }

    toJSON(): Object {
      let obj: Object = {
        name: this.name,
        tag_definition: this.tagDefinition,
        query_validation: this.queryValidations
      };

      for (let option in this.options) {
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

    run(): void {
      throw new Error("Unable to run TagValidation");
    }

    progress(): DataTrue.JobStatus {
      throw new Error("Unable to retrieve progress for TagValidation");
    }
  }
}
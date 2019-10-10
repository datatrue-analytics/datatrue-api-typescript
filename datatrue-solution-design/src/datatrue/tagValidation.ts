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

    private queryValidations: QueryValidation[] = [];
    private tagDefinition: Object;

    constructor(name: string, key: string, contextId?: number, public options: DataTrue.TagValidationOptions = { interception: {do_validation: true} }) {
      super(name);
      this.contextID = contextId;
      this.tagDefinition = {
        key: key
      };
    }

    addQueryValidation(queryValidation: QueryValidation) {
      this.queryValidations.push(queryValidation);
    }

    toJSON() {
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

      Logger.log(JSON.stringify(obj));

      return JSON.stringify(obj);
    }
  }
}
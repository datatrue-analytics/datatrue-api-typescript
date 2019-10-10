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
    enable?: boolean,
    do_validation?: boolean,
    validate_absence?: boolean,
    hostname_validation?: string,
    pathname_validation?: string
  }

  export interface TagDefinition {

  }

  export class TagValidation extends DataTrue.Resource {
    readonly contextType: string = "step";
    readonly resourceType: string = "tag_validations";

    private queryValidations: QueryValidation[] = [];
    private tagDefinition: Object;

    constructor(name: string, key: string, contextId?: number, public options: DataTrue.TagValidationOptions={enable: true, validate_absence: false}) {
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
      let obj = {
        name: this.name,
        tag_definition: this.tagDefinition,
        query_validation: this.queryValidations
      };

      Object.entries(this.options).forEach(([option, value]) => {
        obj[option] = value;
      });

      return JSON.stringify(obj);
    }
  }
}
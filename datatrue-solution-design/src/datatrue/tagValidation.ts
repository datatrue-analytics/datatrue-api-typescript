namespace DataTrue {
  interface QueryValidation {
    key: string,
    regex: boolean,
    value: string,
    json_path: string,
    use_json_path: boolean
  }

  export class TagValidation extends DataTrue.Resource {
    private queryValidations: QueryValidation[] = [];

    constructor(name: string, private key: string, contextId?: string, description: string = "", private validate_absence: boolean = true, private enabled: boolean = true) {
      super(name, description);
      this.contextType = "step";
      this.contextID = contextId;
      this.resourceType = "tag_validations";
    }

    addQueryValidation(queryValidation: QueryValidation) {
      this.queryValidations.push(queryValidation);
    }

    toJSON() {
      return JSON.stringify({
        name: this.name,
        enabled: this.enabled,
        validate_absence: this.validate_absence,
        tag_definition: {
          key: this.key
        },
        query_validation: this.queryValidations
      });
    }
  }
}
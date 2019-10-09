namespace DataTrue {
  export class Step extends DataTrue.Resource {
    private tag_validations: TagValidation[] = [];

    constructor(name: string, private action: number, contextId: string, description: string="", private js_code: string="") {
      super(name, description);
      this.contextType = "test";
      this.contextID = contextId;
      this.resourceType = "step";
    }

    addTagValidation(tagValidation: TagValidation) {
      this.tag_validations.push(tagValidation);
    }

    toJSON(): string {
      return JSON.stringify({
        name: this.name,
        description: this.description,
        action: this.action,
        js_code: this.js_code,
        tag_validations: this.tag_validations
      });
    }
  }
}

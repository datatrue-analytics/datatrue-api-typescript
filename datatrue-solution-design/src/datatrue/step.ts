namespace DataTrue {
  export class Step extends DataTrue.Resource {
    private tag_validations: TagValidation[] = [];

    constructor(name: string, private action: number, public contextId?: string, description: string="", private target: string="", private js_code: string="") {
      super(name, description);
      this.contextType = "test";
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
        target: this.target,
        tag_validations: this.tag_validations.map(tag_validation => JSON.parse(tag_validation.toJSON()))
      });
    }
  }
}

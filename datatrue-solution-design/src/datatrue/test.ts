namespace DataTrue {
  export class Test extends DataTrue.Resource {
    private steps: Step[] = [];

    constructor(name: string, contextId: string, description: string="") {
      super(name, description);
      this.contextType = "suite";
      this.contextID = contextId;
      this.resourceType = "test";
    }

    addStep(step: Step) {
      this.steps.push(step);
    }

    toJSON(): string {
      let obj = {};
      obj[this.resourceType] = {
        name: this.name,
        steps: this.steps.map(step => JSON.parse(step.toJSON()))
      };

      return JSON.stringify(obj);
    }
  }
}

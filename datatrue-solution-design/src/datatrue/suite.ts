namespace DataTrue {
  export interface SuiteOptions {
    description?: string,
    variables?: DataTrue.Variables
  }

  export class Suite extends DataTrue.Resource {
    private tests: Test[] = [];

    constructor(name: string, contextId: number, description: string="") {
      super(name, description);
      this.contextType = "account";
      this.contextID = contextId;
      this.resourceType = "suite";
    }

    toJSON(): string {
      let obj = {};

      obj[this.resourceType] = {
        name: this.name,
        description: this.description
      };

      return JSON.stringify(obj);
    }
  }
}

namespace DataTrue {
  export class Suite extends DataTrue.Resource {
    private tests: Test[] = [];

    constructor(name: string, contextId: string, description: string="") {
      super(name, description);
      this.contextType = "account";
      this.contextID = contextId;
      this.resourceType = "suite";
    }

    toJSON(): string {
      return JSON.stringify({
        name: this.name,
        description: this.description
      });
    }
  }
}

namespace DataTrue {
  export interface TestOptions {
    description?: string,
    variables?: DataTrue.Variables,
    test_type?: DataTrue.TestTypes
  }

  export enum TestTypes {
    SIMULATION = 0,
    COVERAGE = 1,
    EMAIL = 2,
    MOBILE = 3
  }

  export interface Variables {
    [s: string]: {
      type: string,
      value: string
    }
  }

  export class Test extends DataTrue.Resource {
    private steps: Step[] = [];

    constructor(name: string, contextId: number, description: string = "") {
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

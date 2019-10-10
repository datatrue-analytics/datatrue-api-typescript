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
    readonly contextType: string = "suite";
    static readonly resourceType: string = "test";
    readonly resourceTypeRun: string = "TestScenario";

    private steps: Step[] = [];

    constructor(name: string, contextId?: number, public options: DataTrue.TestOptions={}) {
      super(name);
      this.contextID = contextId;
    }

    static fromID(id: number): Test {
      const obj = JSON.parse(super.getResource(id, this.resourceType));

      const test = new Test(obj["test"]["name"]);
      test.resourceID = obj.test.id;

      obj.test.steps.array.forEach(stepObj => {
        let step = new Step(stepObj.name, stepObj.action, test.resourceID);
        step.resourceID = stepObj.id;
        test.addStep(step);
      });

      return test;
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

      Object.entries(this.options).forEach(([option, value]) => {
        obj[this.resourceType][option] = value;
      });

      return JSON.stringify(obj);
    }
  }
}

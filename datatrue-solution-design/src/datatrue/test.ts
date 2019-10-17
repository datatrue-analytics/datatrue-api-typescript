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
    static readonly contextType: string = "suite";
    static readonly resourceType: string = "test";
    static readonly resourceTypeRun: string = "TestScenario";
    static readonly children: string[] = ["steps", "tagValidations"];

    private steps: DataTrue.Step[] = [];
    private tagValidations: DataTrue.TagValidation[] = [];

    public options: DataTrue.TestOptions = {};

    constructor(name: string, public contextID?: number, options: DataTrue.TestOptions = {}) {
      super(name);
      this.setOptions(options);
    }

    static fromID(id: number): Test {
      const obj = JSON.parse(super.getResource(id, DataTrue.Test.resourceType));

      const test = new DataTrue.Test(obj["name"]);
      test.resourceID = obj.id;

      obj.steps.forEach(stepObj => {
        let step = new DataTrue.Step(stepObj.name, stepObj.action, test.resourceID);
        step.resourceID = stepObj.id;
        test.addStep(step);
      });

      return test;
    }

    addStep(step: Step, index: number = -1) {
      super.addChild(step, index, "steps");
    }

    addTagValidation(tagValidation: DataTrue.TagValidation, index: number = -1) {
      super.addChild(tagValidation, index, "tagValidations");
    }

    deleteStep(index) {
      super.deleteChild(index, "steps");
    }

    deleteTagValidation(index) {
      super.deleteChild(index, "tagValidations");
    }

    setOptions(options: DataTrue.TestOptions, override: boolean = false): void {
      super.setOptions(options, override);
    }

    setResourceID(id: number) {
      super.setResourceID(id);
      this.steps.forEach(step => step.setContextID(id));
      this.tagValidations.forEach(tagValidation => tagValidation.setContextID(id));
    }

    toJSON(): Object {
      let obj = {};

      obj[Test.resourceType] = {
        name: this.name,
        steps: this.steps.map(step => JSON.parse(step.toString()))
      };

      for (let option in this.options) {
        obj[Test.resourceType][option] = this.options[option];
      }

      return obj;
    }
  }
}

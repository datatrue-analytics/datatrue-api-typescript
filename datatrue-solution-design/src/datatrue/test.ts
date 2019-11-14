namespace DataTrue {
  export interface TestOptions {
    description?: string,
    variables?: DataTrue.Variables,
    test_type?: DataTrue.TestTypes,
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
      value: string,
    },
  }

  export class Test extends DataTrue.Resource {
    public static readonly contextType: string = "suite";
    public static readonly resourceType: string = "test";
    public static readonly resourceTypeRun: string = "TestScenario";
    public static readonly children: string[] = ["steps", "tagValidations"];

    private steps: DataTrue.Step[] = [];
    private tagValidations: DataTrue.TagValidation[] = [];

    public options: DataTrue.TestOptions = {};

    public constructor(name: string, public contextID?: number, options: DataTrue.TestOptions = {}) {
      super(name);
      this.setOptions(options);
    }

    public static fromID(id: number): Test {
      const obj = JSON.parse(super.getResource(id, Test.resourceType));
      return DataTrue.Test.fromJSON(obj);
    }

    public static fromJSON(obj: Record<string, any>): Test {
      const { name, id, steps, tag_validations, ...options } = obj;

      const test = new DataTrue.Test(name);
      test.setResourceID(id);
      test.setOptions(options, true);

      if (steps !== undefined) {
        steps.forEach(stepObj => {
          const step = DataTrue.Step.fromJSON(stepObj);
          step.setContextID(id);
          test.addStep(step);
        });
      }

      if (tag_validations !== undefined) {
        tag_validations.forEach(TagValidationObj => {
          const tagValidation = DataTrue.TagValidation.fromJSON(TagValidationObj);
          tagValidation.setContextID(id);
          test.addTagValidation(tagValidation);
        });
      }

      return test;
    }

    public addStep(step: Step, index: number = this.steps.length): void {
      super.addChild(step, index, "steps");
    }

    public addTagValidation(tagValidation: DataTrue.TagValidation, index: number = this.tagValidations.length): void {
      super.addChild(tagValidation, index, "tagValidations");
    }

    public deleteStep(index): void {
      super.deleteChild(index, "steps");
    }

    public deleteTagValidation(index): void {
      super.deleteChild(index, "tagValidations");
    }

    public getSteps(): readonly DataTrue.Step[] {
      return this.steps.slice();
    }

    public getTagValidations(): readonly DataTrue.TagValidation[] {
      return this.tagValidations.slice();
    }

    public setOptions(options: DataTrue.TestOptions, override: boolean = false): void {
      super.setOptions(options, override);
    }

    public setResourceID(id: number): void {
      super.setResourceID(id);
      this.steps.forEach(step => step.setContextID(id));
      this.tagValidations.forEach(tagValidation => tagValidation.setContextID(id));
    }

    public toJSON(): object {
      const obj: object = {};

      obj[Test.resourceType] = {
        name: this.name,
        steps: this.steps.map(step => JSON.parse(step.toString())),
      };

      if (this.tagValidations.length) {
        obj["tag_validations"] = this.tagValidations.map(tagValidation => JSON.parse(tagValidation.toString()));
      }

      for (const option in this.options) {
        obj[Test.resourceType][option] = this.options[option];
      }

      return obj;
    }
  }
}

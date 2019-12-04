/// <reference path="_resource.ts" />
/// <reference path="runnable.ts" />
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
    MOBILE = 3,
  }

  export enum VariableTypes {
    PRESET = "preset",
    RUNTIME = "runtime",
    COUNTER = "counter",
  }

  export interface Variables {
    [s: string]: {
      type: VariableTypes,
      value: string,
    },
  }

  export class Test extends DataTrue.Resource implements Runnable {
    public static readonly contextType: string = "suite";
    public static readonly resourceType: string = "test";
    public static readonly resourceTypeRun: string = "TestScenario";
    public static readonly children: string[] = ["steps", "tagValidations"];

    private steps: DataTrue.Step[] = [];
    private tagValidations: DataTrue.TagValidation[] = [];

    public jobID: number;
    public options: DataTrue.TestOptions = { variables: {} };

    public constructor(name: string, public contextID?: number, options: DataTrue.TestOptions = {}) {
      super(name);
      this.setOptions(options);
    }

    public static fromID(id: number): Test {
      const obj = JSON.parse(super.getResource(id, Test.resourceType));
      return DataTrue.Test.fromJSON(obj);
    }

    public static fromJSON(obj: Record<string, any>, copy: boolean = false): Test {
      const { name, id, steps, tag_validations, ...options } = obj;

      const test = new DataTrue.Test(name);
      if (!copy) {
        test.setResourceID(id);
      }
      test.setOptions(options, true);

      if (steps !== undefined) {
        steps.forEach(stepObj => {
          const step = DataTrue.Step.fromJSON(stepObj);
          step.setContextID(id);
          if (copy) {
            step.setResourceID(undefined);
          }
          test.insertStep(step);
        });
      }

      if (tag_validations !== undefined) {
        tag_validations.forEach(TagValidationObj => {
          const tagValidation = DataTrue.TagValidation.fromJSON(TagValidationObj);
          tagValidation.setContextID(id);
          if (copy) {
            tagValidation.setResourceID(undefined);
          }
          test.insertTagValidation(tagValidation);
        });
      }

      return test;
    }

    public insertStep(step: DataTrue.Step, index: number = this.steps.length): void {
      super.insertChild(step, index, "steps");
    }

    public insertTagValidation(tagValidation: DataTrue.TagValidation, index: number = this.tagValidations.length): void {
      super.insertChild(tagValidation, index, "tagValidations");
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

    public setVariable(name: string, type: DataTrue.VariableTypes, value: string): void {
      if (!Object.prototype.hasOwnProperty.call(this.options, "variables")) {
        this.options.variables = {};
      }
      this.options.variables[name] = {
        type: type,
        value: value,
      };
    }

    public setOptions(options: DataTrue.TestOptions, override: boolean = false): void {
      super.setOptions(options, override);
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

    public run(email_users: number[] = []): void {
      this.jobID = DataTrue._run(email_users, DataTrue.Suite.resourceTypeRun, this.getResourceID());
    }

    public progress(): JobStatus {
      return DataTrue._progress(this.jobID);
    }
  }
}

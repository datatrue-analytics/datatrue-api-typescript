import Resource, { ResourceOptions } from "./_resource";
import Runnable, { _run, _progress, JobStatus } from "./runnable";
import Step from "./step";
import TagValidation from "./tagValidation";

export interface TestOptions extends ResourceOptions {
  variables?: Variables,
  test_type?: TestTypes,
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

export default class Test extends Resource implements Runnable {
  public static readonly contextType: string = "suite";
  public static readonly resourceType: string = "test";
  public static readonly resourceTypeRun: string = "TestScenario";
  public static readonly childTypes: string[] = ["steps", "tagValidations"];

  private steps: Step[] = [];
  private tagValidations: TagValidation[] = [];

  public jobID: number;
  public options: TestOptions = { variables: {} };

  public constructor(name: string, public contextID?: number, options: TestOptions = {}) {
    super(name);
    this.setOptions(options);
  }

  public static fromID(id: number): Test {
    const obj = JSON.parse(super.getResource(id, Test.resourceType));
    return Test.fromJSON(obj);
  }

  public static fromJSON(obj: Record<string, any>, copy: boolean = false): Test { // eslint-disable-line @typescript-eslint/no-explicit-any
    const { name, id, steps, tag_validations, ...options } = obj;

    const test = new Test(name);
    if (!copy) {
      test.setResourceID(id);
    }
    test.setOptions(options, true);

    if (steps !== undefined) {
      steps.forEach(stepObj => {
        const step = Step.fromJSON(stepObj);
        step.setContextID(id);
        if (copy) {
          step.setResourceID(undefined);
        }
        test.insertStep(step);
      });
    }

    if (tag_validations !== undefined) {
      tag_validations.forEach(TagValidationObj => {
        const tagValidation = TagValidation.fromJSON(TagValidationObj);
        tagValidation.setContextID(id);
        if (copy) {
          tagValidation.setResourceID(undefined);
        }
        test.insertTagValidation(tagValidation);
      });
    }

    return test;
  }

  public insertStep(step: Step, index: number = this.steps.length): void {
    super.insertChild(step, index, "steps");
  }

  public insertTagValidation(tagValidation: TagValidation, index: number = this.tagValidations.length): void {
    super.insertChild(tagValidation, index, "tagValidations");
  }

  public deleteStep(index: number): void {
    super.deleteChild(index, "steps");
  }

  public deleteTagValidation(index: number): void {
    super.deleteChild(index, "tagValidations");
  }

  public getSteps(): readonly Step[] {
    return this.steps.slice();
  }

  public getTagValidations(): readonly TagValidation[] {
    return this.tagValidations.slice();
  }

  public setVariable(name: string, type: VariableTypes, value: string): void {
    if (!Object.prototype.hasOwnProperty.call(this.options, "variables")) {
      this.options.variables = {};
    }
    this.options.variables[name] = {
      type: type,
      value: value,
    };
  }

  public setOptions(options: TestOptions, override: boolean = false): void {
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
    this.jobID = _run(email_users, Test.resourceTypeRun, this.getResourceID());
  }

  public progress(): JobStatus {
    return _progress(this.jobID);
  }
}

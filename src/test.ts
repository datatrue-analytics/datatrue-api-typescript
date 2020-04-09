import Resource, { ResourceOptions } from "./resource";
import Runnable, { JobStatus, _progress, _run } from "./runnable";
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
  public static readonly resourceType: string = "test";
  public static readonly resourceTypeRun: string = "TestScenario";
  public static readonly childTypes: string[] = ["steps", "tagValidations"];

  private steps: Step[] = [];
  private tagValidations: TagValidation[] = [];

  public readonly contextType: string = "suite";
  public jobID?: string;
  public options: TestOptions = { variables: {} };

  public constructor(name: string, public contextID?: number, options: TestOptions = {}) {
    super(name);
    this.setOptions(options);
  }

  public static fromID(id: number): Promise<Test> {
    return super.getResource(id, Test.resourceType).then(resource => {
      return Test.fromJSON(JSON.parse(resource));
    });
  }

  public static fromJSON(obj: Record<string, any>, copy: boolean = false): Test {
    const { name, id, steps, tag_validations, ...options } = obj;

    const test = new Test(name);
    if (!copy) {
      test.setResourceID(id);
    }
    test.setOptions(options, true);

    if (steps !== undefined) {
      steps.forEach((stepObj: Record<string, any>) => {
        const step = Step.fromJSON(stepObj);
        step.setContextID(id);
        if (copy) {
          step.setResourceID(undefined);
        }
        test.insertStep(step);
      });
    }

    if (tag_validations !== undefined) {
      tag_validations.forEach((tagValidationObj: Record<string, any>) => {
        const tagValidation = TagValidation.fromJSON(tagValidationObj);
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
    if (this.options.variables === undefined) {
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

  public toJSON(): Record<string, any> {
    const obj: Record<string, any> = {
      name: this.name,
      ...this.options,
    };

    if (this.steps.length) {
      obj["steps"] = this.steps.map(step => JSON.parse(step.toString()));
    }

    if (this.tagValidations.length) {
      obj["tag_validations"] = this.tagValidations.map(tagValidation => tagValidation.toJSON());
    }

    return obj;
  }

  public run(email_users: number[] = []): Promise<string> {
    const resourceID = this.getResourceID();
    if (resourceID === undefined) {
      return Promise.reject(new Error("Tests can only be run once they have been saved."));
    } else {
      try {
        return _run(email_users, Test.resourceTypeRun, resourceID, Resource.client, Resource.config).then(jobID => {
          this.jobID = jobID;
          return jobID;
        });
      } catch {
        throw new Error(`Failed to run test ${this.getResourceID()}`);
      }
    }
  }

  public progress(): Promise<JobStatus> {
    if (this.jobID === undefined) {
      return Promise.reject(new Error("You must run the test before fetching progress."));
    }
    return _progress(this.jobID, Resource.client, Resource.config);
  }
}

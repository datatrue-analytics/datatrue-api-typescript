import { TestResultSummaries } from "../resultSummaries/testResultSummaries";
import Runnable, { JobStatus, _progress, _run } from "../runnable";
import Resource, { ResourceOptions } from "./resource";
import Step from "./step";
import TagValidation from "./tagValidation";

export interface TestOptions extends ResourceOptions {
  variables?: Variables,
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

export interface TestDTO {
  id: number,
  name: string,
  description: string,
  created_at: number,
  updated_at: number,
  test_type: number,
}

export default class Test extends Resource implements Runnable {
  public static readonly resourceType: string = "test";
  public static readonly resourceTypeRun: string = "TestScenario";
  public static readonly childTypes: readonly string[] = [
    "steps",
    "tagValidations",
  ];

  private steps: Step[] = [];
  private tagValidations: TagValidation[] = [];

  public readonly contextType: string = "suite";
  public jobID?: string;
  public options: TestOptions = { variables: {} };

  public constructor(
    name: string,
    public testType: TestTypes = TestTypes.SIMULATION,
    public contextID?: number,
    options: TestOptions = {}
  ) {
    super(name);
    this.setOptions(options);
  }

  public static async fromID(id: number): Promise<Test> {
    const resource = await super.getResource(id, Test.resourceType);
    return Test.fromJSON(JSON.parse(resource));
  }

  public static fromJSON(
    obj: Record<string, any>,
    copy: boolean = false
  ): Test {
    const { name, id, test_type, steps, tag_validations, ...options } = obj;

    const test = new Test(name, test_type);
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

  public insertTagValidation(
    tagValidation: TagValidation,
    index: number = this.tagValidations.length
  ): void {
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

  public async toJSON(): Promise<Record<string, any>> {
    const obj: Record<string, any> = {
      name: this.name,
      test_type: this.testType,
      ...this.options,
    };

    if (this.steps.length) {
      obj.steps = [];

      for (const step of this.steps) {
        obj.steps.push(await step.toJSON());
      }
    }

    if (this.tagValidations.length) {
      obj.tag_validations = [];

      for (const tagValidation of this.tagValidations) {
        obj.tag_validations.push(await tagValidation.toJSON());
      }
    }

    return obj;
  }

  public async run(
    email_users: number[] = [],
    variables: Record<string, string> = {}
  ): Promise<string> {
    const resourceID = this.getResourceID();
    if (resourceID === undefined) {
      throw new Error("Tests can only be run once they have been saved.");
    } else {
      try {
        const jobID = await _run(
          email_users,
          variables,
          Test.resourceTypeRun,
          resourceID
        );

        this.jobID = jobID;
        return jobID;
      } catch (e) {
        throw new Error(`Failed to run test ${this.getResourceID()}`);
      }
    }
  }

  public async progress(): Promise<JobStatus> {
    if (this.jobID === undefined) {
      throw new Error("You must run the test before fetching progress.");
    }
    return _progress(this.jobID);
  }

  public summaries(accountId: number): TestResultSummaries {
    const id = this.getResourceID();
    if (id === undefined) {
      throw new Error("Resource ID must be set");
    }
    return new TestResultSummaries(accountId)
      .where("test_scenario_id", "==", id);
  }
}

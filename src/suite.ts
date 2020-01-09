import Resource, { ResourceOptions } from "./resource";
import Runnable, { _run, _progress, JobStatus } from "./runnable";
import Test, { Variables, VariableTypes } from "./test";

export interface SuiteOptions extends ResourceOptions {
  variables?: Variables,
  suite_type?: SuiteTypes,
}

export enum SuiteTypes {
  WEB = 0,
  MOBILE_APP = 1
}

export default class Suite extends Resource implements Runnable {
  public static readonly resourceType: string = "suite";
  public static readonly resourceTypeRun: string = "Suite";
  public static readonly childTypes: readonly string[] = ["tests"];

  private tests: Test[] = [];

  public readonly contextType: string = "account";
  public jobID?: string;
  public options: SuiteOptions = { variables: {} };

  public constructor(name: string, public contextID?: number, options: SuiteOptions = {}) {
    super(name);
    this.setOptions(options);
  }

  public static fromID(id: number): Promise<Suite> {
    return super.getResource(id, Suite.resourceType).then(resource => {
      const suiteObj = JSON.parse(resource);
      let promises: Promise<void>[] = [];
      const tests: Test[] = new Array(suiteObj.tests.length);

      if (suiteObj.tests !== undefined) {
        promises = suiteObj.tests.map((testObj: Record<string, any>, index: number) => {
          return Test.fromID(testObj["id"]).then(test => {
            test.setContextID(id);
            tests[index] = test;
          });
        });
      }

      let seq = Promise.resolve();
      for (const pr of promises) {
        seq = seq.then(() => pr);
      }

      return seq.then(() => {
        delete suiteObj.tests;
        const suite = Suite.fromJSON(suiteObj);
        tests.forEach(test => suite.insertTest(test));
        return suite;
      });
    });
  }

  public static fromJSON(obj: Record<string, any>, copy: boolean = false): Suite {
    const { name, id, tests, ...options } = obj;

    const suite = new Suite(name);
    if (!copy) {
      suite.setResourceID(id);
    }
    suite.setOptions(options, true);

    if (tests !== undefined) {
      tests.forEach((testObj: Record<string, any>) => {
        const test = Test.fromJSON(testObj);
        test.setContextID(id);
        if (copy) {
          test.setResourceID(undefined);
        }
        suite.insertTest(test);
      });
    }

    return suite;
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

  public setOptions(options: SuiteOptions, override: boolean = false): void {
    super.setOptions(options, override);
  }

  public insertTest(test: Test, index: number = this.tests.length): void {
    super.insertChild(test, index, "tests");
  }

  public deleteTest(index: number): void {
    super.deleteChild(index, "tests");
  }

  public getTests(): readonly Test[] {
    return this.tests.slice();
  }

  protected create(): Promise<void> {
    return super.create().then(() => {
      const promises: Promise<void>[] = [];

      this.tests.forEach(test => {
        promises.push(test.save());
      });

      return Promise.all(promises).then();
    });
  }

  public toJSON(): Record<string, any> {
    const obj: Record<string, any> = {};

    obj[Suite.resourceType] = {
      name: this.name,
      ...this.options,
    };

    if (this.tests.length) {
      obj[Suite.resourceType]["tests"] = this.tests.map(test => test.toJSON()[Test.resourceType]);
    }

    return obj;
  }

  public run(email_users: number[] = []): Promise<string> {
    const resourceID = this.getResourceID();
    if (resourceID === undefined) {
      return Promise.reject(new Error("Suites can only be run once they have been saved."));
    } else {
      return _run(email_users, Suite.resourceTypeRun, resourceID, Resource.client, Resource.config).then(jobID => {
        this.jobID = jobID;
        return jobID;
      });
    }
  }

  public progress(): Promise<JobStatus> {
    if (this.jobID === undefined) {
      return Promise.reject(new Error("You must run the suite before fetching progress."));
    }
    return _progress(this.jobID, Resource.client, Resource.config);
  }
}

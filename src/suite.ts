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
  public static readonly contextType: string = "account";
  public static readonly resourceType: string = "suite";
  public static readonly resourceTypeRun: string = "Suite";
  public static readonly childTypes: readonly string[] = ["tests"];

  private tests: Test[] = [];

  public jobID: number;
  public options: SuiteOptions = { variables: {} };

  public constructor(name: string, public contextID?: number, options: SuiteOptions = {}) {
    super(name);
    this.setOptions(options);
  }

  public static fromID(id: number, callback?: (suite: Suite) => void, thisArg?: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
    super.getResource(id, Suite.resourceType, (resource: string) => {
      const suiteObj = JSON.parse(resource);

      if (suiteObj.tests !== undefined) {
        const tests: Test[] = new Array(suiteObj.tests.length);

        suiteObj.tests.forEach((testObj: object, index: number) => {
          Test.fromID(testObj["id"], (test: Test) => {
            test.setContextID(id);
            tests[index] = test;
            if (tests.filter(fullTest => fullTest !== undefined).length === tests.length) {
              suiteObj.tests = tests.map(fullTest => fullTest.toJSON()[Test.resourceType]);

              callback.call(thisArg, Suite.fromJSON(suiteObj));
            }
          });
        });
      }
    });
  }

  public static fromJSON(obj: Record<string, any>, copy: boolean = false): Suite { // eslint-disable-line @typescript-eslint/no-explicit-any
    const { name, id, tests, ...options } = obj;

    const suite = new Suite(name);
    if (!copy) {
      suite.setResourceID(id);
    }
    suite.setOptions(options, true);

    if (tests !== undefined) {
      tests.forEach(testObj => {
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
    if (!Object.prototype.hasOwnProperty.call(this.options, "variables")) {
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

  protected create(callback: () => void, thisArg: any): void {
    let done = 0;
    super.create(() => {
      this.tests.forEach(test => {
        test.save(() => {
          done++;
          if (done === this.tests.length) {
            if (typeof callback === "function") {
              callback.call(thisArg);
            }
          }
        });
      });
    }, this);
  }

  public toJSON(): object {
    const obj = {};

    obj[Suite.resourceType] = {
      name: this.name,
    };

    for (const option in this.options) {
      obj[Suite.resourceType][option] = this.options[option];
    }

    if (this.tests.length) {
      obj[Suite.resourceType]["tests"] = this.tests.map(test => test.toJSON()[Test.resourceType]);
    }

    return obj;
  }

  public run(email_users: number[] = []): void {
    _run(email_users, Suite.resourceTypeRun, this.getResourceID(), Resource.client, Resource.config, (jobID: number) => {
      this.jobID = jobID;
    }, this);
  }

  public progress(callback: (jobStatus: JobStatus) => void, thisArg: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
    _progress(this.jobID, Resource.client, Resource.config, callback, thisArg);
  }
}

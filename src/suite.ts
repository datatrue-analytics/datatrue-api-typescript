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
  public jobID?: number;
  public options: SuiteOptions = { variables: {} };

  public constructor(name: string, public contextID?: number, options: SuiteOptions = {}) {
    super(name);
    this.setOptions(options);
  }

  public static fromID(id: number, callback?: (suite: Suite) => void, thisArg?: any): void {
    super.getResource(id, Suite.resourceType, (resource: string) => {
      const suiteObj = JSON.parse(resource);

      if (suiteObj.tests !== undefined) {
        const tests: Test[] = new Array(suiteObj.tests.length);

        suiteObj.tests.forEach((testObj: Record<string, any>, index: number) => {
          Test.fromID(testObj["id"], (test: Test) => {
            test.setContextID(id);
            tests[index] = test;
            if (tests.filter(fullTest => fullTest !== undefined).length === tests.length) {
              suiteObj.tests = tests.map(fullTest => fullTest.toJSON()[Test.resourceType]);

              if (typeof callback === "function") {
                callback.call(thisArg, Suite.fromJSON(suiteObj));
              }
            }
          });
        });
      }
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

  public toJSON(): Record<string, any> {
    const obj: Record<string, any> = {};

    obj[Suite.resourceType] = {
      name: this.name,
    };

    for (const option in this.options) {
      obj[Suite.resourceType][option] = (this.options as Record<string, any>)[option];
    }

    if (this.tests.length) {
      obj[Suite.resourceType]["tests"] = this.tests.map(test => test.toJSON()[Test.resourceType]);
    }

    return obj;
  }

  public run(email_users: number[] = []): void {
    const resourceID = this.getResourceID();
    if (resourceID === undefined) {
      throw new Error("Suites can only be run once they have been saved.");
    } else {
      _run(email_users, Suite.resourceTypeRun, resourceID, Resource.client, Resource.config, (jobID: number) => {
        this.jobID = jobID;
      }, this);
    }
  }

  public progress(callback: (jobStatus: JobStatus) => void, thisArg: any): void {
    if (this.jobID === undefined) {
      throw new Error("You must run the suite before fetching progress.");
    }
    _progress(this.jobID, Resource.client, Resource.config, callback, thisArg);
  }
}

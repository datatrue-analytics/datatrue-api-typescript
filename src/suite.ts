/// <reference path="_resource.ts" />
/// <reference path="runnable.ts" />
namespace DataTrue {
  export interface SuiteOptions extends DataTrue.ResourceOptions {
    variables?: DataTrue.Variables,
    suite_type?: DataTrue.SuiteTypes,
  }

  export enum SuiteTypes {
    WEB = 0,
    MOBILE_APP = 1
  }

  export class Suite extends DataTrue.Resource implements DataTrue.Runnable {
    public static readonly contextType: string = "account";
    public static readonly resourceType: string = "suite";
    public static readonly resourceTypeRun: string = "Suite";
    public static readonly children: readonly string[] = ["tests"];

    private tests: Test[] = [];

    public jobID: number;
    public options: DataTrue.SuiteOptions = { variables: {} };

    public constructor(name: string, public contextID?: number, options: DataTrue.SuiteOptions = {}) {
      super(name);
      this.setOptions(options);
    }

    public static fromID(id: number): DataTrue.Suite {
      const obj = JSON.parse(super.getResource(id, Suite.resourceType));
      return DataTrue.Suite.fromJSON(obj);
    }

    public static fromJSON(obj: Record<string, any>, copy: boolean = false): DataTrue.Suite {
      const { name, id, tests, ...options } = obj;

      const suite = new DataTrue.Suite(name);
      if (!copy) {
        suite.setResourceID(id);
      }
      suite.setOptions(options, true);

      if (tests !== undefined) {
        tests.forEach(testObj => {
          const test = DataTrue.Test.fromID(testObj["id"]);
          test.setContextID(id);
          if (copy) {
            test.setResourceID(undefined);
          }
          suite.insertTest(test);
        });
      }

      return suite;
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

    public setOptions(options: DataTrue.SuiteOptions, override: boolean = false): void {
      super.setOptions(options, override);
    }

    public insertTest(test: DataTrue.Test, index: number = this.tests.length): void {
      super.insertChild(test, index, "tests");
    }

    public deleteTest(index: number): void {
      super.deleteChild(index, "tests");
    }

    public getTests(): readonly DataTrue.Test[] {
      return this.tests.slice();
    }

    protected create(): void {
      super.create();
      this.tests.forEach(test => {
        test.save();
      });
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
        obj[Suite.resourceType]["tests"] = this.tests.map(test => {
          return {
            id: test.getResourceID(),
            name: test.name,
            description: test.options.description,
            test_type: test.options.test_type,
          };
        });
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

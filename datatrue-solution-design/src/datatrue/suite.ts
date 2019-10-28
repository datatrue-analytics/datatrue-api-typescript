namespace DataTrue {
  export interface SuiteOptions {
    description?: string,
    variables?: DataTrue.Variables,
    suite_type?: DataTrue.SuiteTypes,
  }

  export enum SuiteTypes {
    WEB = 0,
    MOBILE_APP = 1
  }

  export class Suite extends DataTrue.Resource {
    public static readonly contextType: string = "account";
    public static readonly resourceType: string = "suite";
    public static readonly resourceTypeRun: string = "Suite";
    public static readonly children: readonly string[] = ["tests"];

    private tests: Test[] = [];

    public options: DataTrue.SuiteOptions = {};

    public constructor(name: string, public contextID?: number, options: DataTrue.SuiteOptions = {}) {
      super(name);
      this.setOptions(options);
    }

    public static fromID(id: number): DataTrue.Suite {
      const obj = JSON.parse(super.getResource(id, Suite.resourceType));
      return DataTrue.Suite.fromJSON(obj);
    }

    public static fromJSON(obj: Record<string, any>): DataTrue.Suite {
      const { name, id, tests, ...options } = obj;

      const suite = new DataTrue.Suite(name);
      suite.setResourceID(id);
      suite.setOptions(options, true);

      if (tests !== undefined) {
        tests.forEach(testObj => {
          const test = DataTrue.Test.fromID(testObj["id"]);
          test.setContextID(id);
          suite.addTest(test);
        });
      }

      return suite;
    }

    public setOptions(options: DataTrue.SuiteOptions, override: boolean = false): void {
      super.setOptions(options, override);
    }

    public setResourceID(id: number): void {
      super.setResourceID(id);
      this.tests.forEach(tests => tests.setContextID(id));
    }

    public addTest(test: DataTrue.Test, index: number = this.tests.length): void {
      super.addChild(test, index, "tests");
    }

    public deleteTest(index): void {
      super.deleteChild(index, "tests");
    }

    public getTests(): readonly DataTrue.Test[] {
      return this.tests.slice();
    }

    protected create(): void {
      super.create();
      this.tests.forEach(test => {
        test.setContextID(this.resourceID);
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

      return obj;
    }
  }
}

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

    private tests: readonly Test[] = [];

    public options: DataTrue.SuiteOptions = {};

    public constructor(name: string, public contextID?: number, options: DataTrue.SuiteOptions = {}) {
      super(name);
      this.setOptions(options);
    }

    public setOptions(options: DataTrue.SuiteOptions, override: boolean = false): void {
      super.setOptions(options, override);
    }

    public setResourceID(id: number): void {
      super.setResourceID(id);
      this.tests.forEach(tests => tests.setContextID(id));
    }

    public addTest(test: DataTrue.Test, index: number = -1): void {
      super.addChild(test, index, "tests");
    }

    public deleteTest(index): void {
      super.deleteChild(index, "tests");
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

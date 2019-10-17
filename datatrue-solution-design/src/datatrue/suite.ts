namespace DataTrue {
  export interface SuiteOptions {
    description?: string,
    variables?: DataTrue.Variables,
    suite_type?: DataTrue.SuiteTypes
  }

  export enum SuiteTypes {
    WEB = 0,
    MOBILE_APP = 1
  }

  export class Suite extends DataTrue.Resource {
    static readonly contextType: string = "account";
    static readonly resourceType: string = "suite";
    static readonly resourceTypeRun: string = "Suite";
    static readonly children: string[] = ["tests"];

    private tests: Test[] = [];

    public options: DataTrue.SuiteOptions = {};

    constructor(name: string, public contextID?: number, options: DataTrue.SuiteOptions = {}) {
      super(name);
      this.setOptions(options);
    }

    setOptions(options: DataTrue.SuiteOptions, override: boolean = false): void {
      super.setOptions(options, override);
    }

    setResourceID(id: number) {
      super.setResourceID(id);
      this.tests.forEach(tests => tests.setContextID(id));
    }

    addTest(test: DataTrue.Test,  index: number = -1) {
      this.tests.splice(index, 0, test);
    }

    toJSON(): Object {
      let obj = {};

      obj[Suite.resourceType] = {
        name: this.name,
      };

      for (let option in this.options) {
        obj[Suite.resourceType][option] = this.options[option];
      }

      return obj;
    }
  }
}

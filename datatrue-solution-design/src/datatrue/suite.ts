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
    readonly contextType: string = "account";
    readonly resourceType: string = "suite";
    readonly resourceTypeRun: string = "Suite";

    private tests: Test[] = [];

    constructor(name: string, contextId: number, public options: DataTrue.SuiteOptions={}) {
      super(name);
      this.contextID = contextId;
    }

    toJSON(): string {
      let obj = {};

      obj[this.resourceType] = {
        name: this.name,
      };

      Object.entries(this.options).forEach(([option, value]) => {
        obj[this.resourceType][option] = value;
      });

      return JSON.stringify(obj);
    }
  }
}

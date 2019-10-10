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

    private tests: Test[] = [];

    constructor(name: string, contextId: number, public options: DataTrue.SuiteOptions = {}) {
      super(name);
      this.contextID = contextId;
    }

    toJSON(): string {
      let obj = {};

      obj[(this.constructor as any).resourceType] = {
        name: this.name,
      };

      for (let option in this.options) {
        obj[option] = this.options[option];
      }

      return JSON.stringify(obj);
    }
  }
}

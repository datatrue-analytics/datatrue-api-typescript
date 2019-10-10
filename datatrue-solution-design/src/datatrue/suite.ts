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

    constructor(name: string, contextId: number, description: string="") {
      super(name, description);
      this.contextID = contextId;
    }

    toJSON(): string {
      let obj = {};

      obj[this.resourceType] = {
        name: this.name,
        description: this.description
      };

      return JSON.stringify(obj);
    }
  }
}

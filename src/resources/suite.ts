import Runnable, { JobStatus, _progress, _run } from "../runnable";
import Resource, { ResourceOptions } from "./resource";
import Test, { TestDTO, Variables, VariableTypes } from "./test";

export interface SuiteOptions extends ResourceOptions {
  variables?: Variables,
  suite_type?: SuiteTypes,
  restart_between_tests?: boolean,
  excluded_domains?: string[],
  sensitive_data_setting?: SensitiveDataSettings,
  persona_id?: number,
}

export enum SuiteTypes {
  WEB = 0,
  MOBILE_APP = 1
}

export enum SensitiveDataSettings {
  DISABLED = "disabled",
  FAIL_WHEN_DETECTED = "fail_when_detected",
  PASS_WHEN_DETECTED = "pass_when_detected",
}

export interface SuiteDTO {
  id: number,
  name: string,
  suite_type: number,
  description: string,
  sensitive_data_setting: string,
  excluded_domains: string[],
  persona_id: number,
  restart_between_tests: boolean,
  created_at: number,
  updated_at: number,
  variables: Record<string, Record<string, string>>,
  tests?: TestDTO[],
}

export default class Suite extends Resource implements Runnable {
  public static readonly resourceType: string = "suite";
  public static readonly resourceTypeRun: string = "Suite";
  public static readonly childTypes: readonly string[] = ["tests"];

  private tests?: Test[];
  private testDTOs: TestDTO[] = [];

  public readonly contextType: string = "account";
  public jobID?: string;
  public options: SuiteOptions = { variables: {} };

  public constructor(
    name: string,
    protected contextID?: number,
    options: SuiteOptions = {}
  ) {
    super(name);
    this.setOptions(options);
  }

  public static async fromID(id: number): Promise<Suite> {
    const resource = await super.getResource(id, Suite.resourceType);
    const suiteObj = JSON.parse(resource);
    return Suite.fromDTO(suiteObj);
  }

  private static fromDTO(suiteObj: SuiteDTO): Suite {
    const testDTOs: TestDTO[] | undefined = suiteObj.tests;

    delete suiteObj.tests;
    const suite = Suite.fromJSON(suiteObj);
    if (testDTOs !== undefined) {
      suite.testDTOs = testDTOs;
    }

    return suite;
  }

  public static fromJSON(
    obj: Record<string, any>,
    copy: boolean = false
  ): Suite {
    const { name, id, account_id: accountId, tests, ...options } = obj;

    const suite = new Suite(name, accountId);
    if (!copy) {
      suite.setResourceID(id);
    }
    suite.setOptions(options, true);

    if (tests !== undefined) {
      suite.tests = [];
      tests.forEach((testObj: Record<string, any>, index: number) => {
        const test = Test.fromJSON(testObj);
        test.setContextID(id);
        if (copy) {
          test.setResourceID(undefined);
        }
        test.setOptions({ position: index + 1 });
        suite.tests?.push(test);
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

  private static hydrateTests<
    T extends TypedPropertyDescriptor<(...args: any[]) => Promise<any>>
  >(
    _target: Suite,
    _propertyKey: string | symbol,
    descriptor: T
  ): T {
    const method = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const self: Suite = this as unknown as Suite;

      if (self.tests === undefined) {
        const testPromises = self.testDTOs.map(testDTO => {
          return Test.fromID(testDTO.id);
        });

        self.tests = await Promise.all(testPromises);
        self.tests.forEach(test => test.setContextID(self.getContextID()));
      }

      if (method !== undefined) {
        return method.apply(self, args);
      }
    };
    return descriptor;
  }

  @Suite.hydrateTests
  public insertTest(
    test: Test,
    index: number = (this.tests as Test[]).length
  ): Promise<void> {
    super.insertChild(test, index, "tests");
    return Promise.resolve();
  }

  @Suite.hydrateTests
  public deleteTest(index: number): Promise<void> {
    super.deleteChild(index, "tests");
    return Promise.resolve();
  }

  @Suite.hydrateTests
  public getTests(): Promise<readonly Test[]> {
    return Promise.resolve((this.tests as Test[]).slice());
  }

  @Suite.hydrateTests
  protected async create(): Promise<void> {
    await super.create();

    for (const test of this.tests as Test[]) {
      await test.save();
    }
  }

  public async toJSON(): Promise<Record<string, any>> {
    const obj: Record<string, any> = {
      name: this.name,
      ...this.options,
    };

    const tests: readonly Test[] = await this.getTests();

    if (tests.length) {
      obj.tests = [];
      for (const test of tests) {
        obj.tests.push(await test.toJSON());
      }
    }

    return obj;
  }

  public async run(
    email_users: number[] = [],
    variables: Record<string, string> = {}
  ): Promise<string> {
    const resourceID = this.getResourceID();
    if (resourceID === undefined) {
      throw new Error("Suites can only be run once they have been saved.");
    } else {
      try {
        const jobID = await _run(
          email_users,
          variables,
          Suite.resourceTypeRun,
          resourceID
        );

        this.jobID = jobID;
        return jobID;
      } catch (e) {
        throw new Error(`Failed to run suite ${this.getResourceID()}`);
      }
    }
  }

  public async progress(): Promise<JobStatus> {
    if (this.jobID === undefined) {
      throw new Error("You must run the suite before fetching progress.");
    }
    return _progress(this.jobID);
  }
}

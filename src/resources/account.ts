import config from "../config";
import Resource from "./resource";
import Suite, { SuiteDTO } from "./suite";

export default class Account extends Resource {
  public static readonly resourceType: string = "account";
  public static readonly childTypes: readonly string[] = ["suites"];

  private suites?: Suite[];

  public readonly contextType: string = "";
  public stepsTotal?: number;
  public stepsUsed?: number;
  public allowanceResetAt?: Date;

  public constructor(name: string) {
    super(name);
  }

  public static async fromID(id: number): Promise<Account> {
    const resource = await super.getResource(id, Account.resourceType);
    return Account.fromJSON(JSON.parse(resource));
  }

  public static fromJSON(
    obj: Record<string, any>,
    copy: boolean = false
  ): Account {
    const {
      name,
      id,
      steps_total: stepsTotal,
      steps_used: stepsUsed,
      allowance_reset_at: allowanceResetAt,
      suites,
    } = obj;

    const account = new Account(name);
    if (!copy) {
      account.setResourceID(id);
    }
    account.stepsTotal = stepsTotal;
    account.stepsUsed = stepsUsed;

    if (allowanceResetAt !== undefined) {
      account.allowanceResetAt = new Date(allowanceResetAt);
    }

    if (suites !== undefined) {
      account.suites = [];
      suites.forEach((suiteObj: Record<string, any>, index: number) => {
        const suite = Suite.fromJSON(suiteObj, copy);
        suite.setContextID(id);
        suite.setOptions({ position: index + 1 });
        account.suites?.push(suite);
      });
    }

    return account;
  }

  public static async getAccounts(): Promise<Account[]> {
    const uri = [
      config.apiEndpoint,
      "management_api/v1",
      "accounts",
    ].join("/");

    const response = await config.httpClient.makeRequest(uri, "get", {
      "headers": {
        "authorization": "Token " + config.userToken,
      },
    });

    if (response.status >= 400) {
      throw new Error("Failed to retrieve accounts");
    }

    return JSON.parse(response.body).map((accountObj: Record<string, any>) => {
      return Account.fromJSON(accountObj);
    });
  }

  private static hydrateSuites<
    T extends TypedPropertyDescriptor<(...args: any[]) => Promise<any>>
  >(
    _target: Account,
    _propertyKey: string | symbol,
    descriptor: T
  ): T {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const self: Account = this as unknown as Account;

      if (self.suites === undefined) {
        const resourceID = self.getResourceID();
        if (resourceID !== undefined) {
          const uri = [
            config.apiEndpoint,
            "management_api/v1",
            "accounts",
            resourceID,
            "suites",
          ].join("/");

          const response = await config.httpClient.makeRequest(uri, "get", {
            "headers": {
              "authorization": "Token " + config.userToken,
            },
          });

          if (response.status >= 400) {
            throw new Error("Failed to retrieve suites");
          }

          const suiteDTOs: SuiteDTO[] = JSON.parse(response.body);

          self.suites = suiteDTOs.map((suiteObj: SuiteDTO) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return Suite.fromDTO(suiteObj);
          });

          self.suites.forEach(suite => suite.setContextID(resourceID));
        } else {
          self.suites = [];
        }
      }

      if (method !== undefined) {
        return method.apply(self, args);
      }
    };

    return descriptor;
  }

  @Account.hydrateSuites
  public async save(): Promise<void> {
    await Promise.all((this.suites as Suite[]).map(suite => {
      return suite.save();
    }));
  }

  @Account.hydrateSuites
  public async delete(): Promise<void> {
    await Promise.all((this.suites as Suite[]).map(suite => {
      return suite.delete();
    }));
  }

  @Account.hydrateSuites
  public insertSuite(
    suite: Suite,
    index: number = (this.suites as Suite[]).length
  ): Promise<void> {
    super.insertChild(suite, index, "suites");
    return Promise.resolve();
  }

  @Account.hydrateSuites
  public getSuites(): Promise<readonly Suite[]> {
    return Promise.resolve((this.suites as Suite[]).slice());
  }

  public async toJSON(): Promise<Record<string, any>> {
    const obj: Record<string, any> = {
      id: this.resourceID,
      name: this.name,
      steps_total: this.stepsTotal,
      steps_used: this.stepsUsed,
    };

    const suites = await this.getSuites();

    if (suites.length) {
      obj.suites = [];
      for (const suite of suites) {
        obj.suites.push(await suite.toJSON());
      }
    }

    return obj;
  }
}

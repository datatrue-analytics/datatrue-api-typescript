import Resource from "./resource";
import Suite from "./suite";

export default class Account extends Resource {
  public static readonly resourceType: string = "account";
  public static readonly childTypes: readonly string[] = ["suites"];

  private suites: Suite[] = [];

  public readonly contextType: string = "";
  public stepsTotal?: number;
  public stepsUsed?: number;

  public constructor(name: string) {
    super(name);
  }

  public static async fromID(id: number): Promise<Account> {
    const resource = await super.getResource(id, Account.resourceType);
    const uri = [
      Resource.config.apiEndpoint,
      "management_api/v1",
      "accounts",
      id,
      "suites",
    ].join("/");

    const response = await Resource.client.makeRequest(uri, "get", {
      "headers": {
        "authorization": "Token " + Resource.config.userToken,
      },
    });

    if (response.status >= 400) {
      throw new Error("Failed to retrieve suites");
    }

    const suites: Suite[] = JSON.parse(response.body).map((suiteObj: Record<string, any>) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      return Suite.fromDTO(suiteObj);
    });

    const account = Account.fromJSON(JSON.parse(resource));
    suites.forEach(suite => {
      suite.setContextID(id);
      account.insertSuite(suite);
    });

    return account;
  }

  public static fromJSON(
    obj: Record<string, any>,
    copy: boolean = false
  ): Account {
    const { name, id, steps_total, steps_used, suites } = obj;

    const account = new Account(name);
    if (!copy) {
      account.setResourceID(id);
    }
    account.stepsTotal = steps_total;
    account.stepsUsed = steps_used;

    if (suites !== undefined) {
      suites.forEach((suiteObj: Record<string, any>) => {
        const suite = Suite.fromJSON(suiteObj);
        suite.setContextID(id);
        if (copy) {
          suite.setResourceID(undefined);
        }
        account.insertSuite(suite);
      });
    }

    return account;
  }

  public static async getAccounts(): Promise<Account[]> {
    const uri = [
      Resource.config.apiEndpoint,
      "management_api/v1",
      "accounts",
    ].join("/");

    const response = await Resource.client.makeRequest(uri, "get", {
      "headers": {
        "authorization": "Token " + Resource.config.userToken,
      },
    });

    if (response.status >= 400) {
      throw new Error("Failed to retrieve accounts");
    }

    return JSON.parse(response.body).map((accountObj: Record<string, any>) => {
      return Account.fromJSON(accountObj);
    });
  }

  public async save(): Promise<void> {
    await Promise.all(this.suites.map(suite => {
      return suite.save();
    }));
  }

  public async delete(): Promise<void> {
    await Promise.all(this.suites.map(suite => {
      return suite.delete();
    }));
  }

  public insertSuite(suite: Suite, index: number = this.suites.length): void {
    super.insertChild(suite, index, "suites");
  }

  public getSuites(): readonly Suite[] {
    return this.suites;
  }

  public async toJSON(): Promise<Record<string, any>> {
    const obj: Record<string, any> = {
      name: this.name,
      steps_total: this.stepsTotal,
      steps_used: this.stepsUsed,
    };

    if (this.suites.length) {
      obj.suites = [];
      for (const suite of this.suites) {
        obj.suites.push(await suite.toJSON());
      }
    }

    return obj;
  }
}

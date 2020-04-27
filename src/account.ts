import Resource from "./resource";
import Suite from "./suite";
import Test from "./test";

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

  public static fromID(id: number): Promise<Account> {
    return super.getResource(id, Account.resourceType).then(resource => {
      const uri = [
        Resource.config.apiEndpoint,
        "management_api/v1",
        "accounts",
        id,
        "suites",
      ].join("/");

      return Resource.client.makeRequest(uri, "get", {
        "headers": {
          "authorization": "Token " + Resource.config.userToken,
        },
      }).then(response => {
        if (response.status >= 400) {
          throw new Error("Failed to retrieve suites");
        }

        const suitePromises: Promise<Suite>[] = JSON.parse(response.body).map((suiteObj: Record<string, any>) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          return Suite.fromDTJSON(suiteObj);
        });

        return Promise.all(suitePromises).then(suites => {
          const account = Account.fromJSON(JSON.parse(resource));
          suites.forEach(suite => {
            account.insertSuite(suite);
          });
          return account;
        });
      });
    });
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

  public static getAccounts(): Promise<Account[]> {
    const uri = [
      Resource.config.apiEndpoint,
      "management_api/v1",
      "accounts",
    ].join("/");

    return Resource.client.makeRequest(uri, "get", {
      "headers": {
        "authorization": "Token " + Resource.config.userToken,
      },
    }).then(response => {
      if (response.status >= 400) {
        throw new Error("Failed to retrieve accounts");
      }
      return JSON.parse(response.body).map((accountObj: Record<string, any>) => {
        return Account.fromJSON(accountObj);
      });
    });
  }

  public save(): Promise<void> {
    return Promise.all(this.suites.map(suite => {
      return suite.save();
    })).then();
  }

  public delete(): Promise<void> {
    return Promise.all(this.suites.map(suite => {
      return suite.delete();
    })).then();
  }

  public insertSuite(suite: Suite, index: number = this.suites.length): void {
    super.insertChild(suite, index, "suites");
  }

  public getSuites(): readonly Suite[] {
    return this.suites;
  }

  public toJSON(): Record<string, any> {
    const obj: Record<string, any> = {
      name: this.name,
      steps_total: this.stepsTotal,
      steps_used: this.stepsUsed,
    };

    if (this.suites.length) {
      obj["suites"] = this.suites.map(suite => suite.toJSON());
    }

    return obj;
  }
}

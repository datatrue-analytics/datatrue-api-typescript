namespace DataTrue {
  export var api_endpoint: string = "datatrue.com";
  export var management_token: string = "";
  export var ci_token: string = "";

  export abstract class Resource {
    contextType: string;
    contextID: number;
    resourceType: string;
    resourceID: number;
    options: Object;

    constructor(public name: string, public description: string = "") { }

    abstract toJSON(): string;

    create(): void {
      const uri = [
        DataTrue.api_endpoint,
        "management_api/v1",
        this.contextType + "s",
        this.contextID,
        this.resourceType + "s"].join("/");
      const request = this.save("post", uri);
    }

    update(): void {
      const uri = [
        DataTrue.api_endpoint,
        "management_api/v1",
        this.resourceType + "s",
        this.contextID].join("/");
      const request = this.save("put", uri);
    }

    run(email_users: number[] = []): void {
      const uri = [
        DataTrue.api_endpoint,
        "ci_api",
        `test_runs?${DataTrue.ci_token}`
      ].join("/");
      const options = {
        "method": "post" as GoogleAppsScript.URL_Fetch.HttpMethod,
        "contentType": "application/json",
        "payload": JSON.stringify({
          "test_run": {
            "test_id": this.resourceID,
            "email_users": email_users
          }
        }),
        "headers": {
          "content-type": "application/json"
        }
      };

      const request = UrlFetchApp.fetch(uri, options);
    }

    private save(method: GoogleAppsScript.URL_Fetch.HttpMethod, uri: string): GoogleAppsScript.URL_Fetch.HTTPResponse {
      const options = {
        "method": method,
        "contentType": "application/json",
        "payload": this.toJSON(),
        "headers": {
          "content-type": "application/json",
          "authorization": "Token " + DataTrue.management_token
        }
      };

      return UrlFetchApp.fetch(uri, options);
    }
  }
}

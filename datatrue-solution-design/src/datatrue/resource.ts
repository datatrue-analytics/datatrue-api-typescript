namespace DataTrue {
  export var api_endpoint: string = "datatrue.com";
  export var management_token: string = "";
  export var ci_token: string = "";

  export abstract class Resource {
    static readonly contextType: string;
    static readonly resourceType: string;
    static readonly resourceTypeRun: string;

    jobID: number;
    contextID: number;
    resourceID: number;
    options: Object;

    constructor(public name: string) { }

    abstract toJSON(): string;

    static fromID(id: number): void { }

    static getResource(id: number, resourceType: string): string {
      const uri = [
        DataTrue.api_endpoint,
        "management_api/v1",
        resourceType + "s",
        id].join("/");

      const options = {
        "method": "get" as GoogleAppsScript.URL_Fetch.HttpMethod,
        "contentType": "application/json",
        "headers": {
          "content-type": "application/json",
          "authorization": "Token " + DataTrue.management_token
        }
      };

      return UrlFetchApp.fetch(uri, options).getContentText();
    }

    create(): void {
      const uri = [
        DataTrue.api_endpoint,
        "management_api/v1",
        (this.constructor as any).contextType + "s",
        this.contextID,
        (this.constructor as any).resourceType + "s"].join("/");

      const request = this.save("post", uri);

      this.resourceID = JSON.parse(request.getContentText())[(this.constructor as any).resourceType]["id"];
    }

    update(): void {
      const uri = [
        DataTrue.api_endpoint,
        "management_api/v1",
        (this.constructor as any).resourceType + "s",
        this.contextID].join("/");

      const request = this.save("put", uri);
    }

    run(email_users: number[] = []): void {
      const uri = [
        DataTrue.api_endpoint,
        "ci_api",
        `test_runs?api_key=${DataTrue.ci_token}`
      ].join("/");
      const options = {
        "method": "post" as GoogleAppsScript.URL_Fetch.HttpMethod,
        "contentType": "application/json",
        "payload": JSON.stringify({
          "test_run": {
            "test_class": (this.constructor as any).resourceTypeRun,
            "test_id": this.resourceID,
            "email_users": email_users
          }
        }),
        "headers": {
          "content-type": "application/json"
        }
      };

      const request = UrlFetchApp.fetch(uri, options);

      this.jobID = JSON.parse(request.getContentText())["job_id"];
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

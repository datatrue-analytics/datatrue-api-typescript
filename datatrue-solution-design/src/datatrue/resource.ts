namespace DataTrue {
  export var apiEndpoint: string = "datatrue.com";
  export var managementToken: string = "";
  export var ciToken: string = "";

  export interface JobStatus {
    status: string,
    options: {
      test_run_id: number
    },
    num?: number,
    total?: number,
    progress?: {
      percentage: number,
      tests: {
        test_result_id: number,
        id: number,
        name: string,
        state: string,
        running: boolean,
        steps_completed: number,
        pii: {
          num_pii_exposure: number,
          num_pii_data_types: number,
          num_pii_data_processors: number
        }
      }[]
    },
    message?: string
  }

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
        DataTrue.apiEndpoint,
        "management_api/v1",
        resourceType + "s",
        id].join("/");

      const options = {
        "method": "get" as GoogleAppsScript.URL_Fetch.HttpMethod,
        "contentType": "application/json",
        "headers": {
          "content-type": "application/json",
          "authorization": "Token " + DataTrue.managementToken
        }
      };

      return UrlFetchApp.fetch(uri, options).getContentText();
    }

    create(): void {
      const uri = [
        DataTrue.apiEndpoint,
        "management_api/v1",
        (this.constructor as any).contextType + "s",
        this.contextID,
        (this.constructor as any).resourceType + "s"].join("/");

      const request = this.save("post", uri);

      this.resourceID = JSON.parse(request.getContentText())[(this.constructor as any).resourceType]["id"];
    }

    update(): void {
      const uri = [
        DataTrue.apiEndpoint,
        "management_api/v1",
        (this.constructor as any).resourceType + "s",
        this.contextID].join("/");

      const request = this.save("put", uri);
    }

    delete(): void {
      const uri = [
        DataTrue.apiEndpoint,
        "management_api/v1",
        (this.constructor as any).resourceType + "s",
        this.contextID].join("/");

      const request = this.save("delete", uri);
    }

    run(email_users: number[] = []): void {
      const uri = [
        DataTrue.apiEndpoint,
        "ci_api",
        `test_runs?api_key=${DataTrue.ciToken}`
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

    progress(): void {
      const uri = [
        DataTrue.apiEndpoint,
        "ci_api",
        "test_runs",
        "progress",
        `${this.jobID}?api_key=${DataTrue.ciToken}`
      ].join("/");

      const options = {
        "method": "get" as GoogleAppsScript.URL_Fetch.HttpMethod,
        "contentType": "application/json",
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
          "authorization": "Token " + DataTrue.managementToken
        }
      };

      return UrlFetchApp.fetch(uri, options);
    }
  }
}

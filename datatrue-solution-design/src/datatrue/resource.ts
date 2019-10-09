namespace DataTrue {
  var api_endpoint: string = "datatrue.com";
  var management_token: string = "";
  var ci_token: string = "";

  export abstract class Resource {
    contextType: string;
    contextID: string;
    resourceType: string;

    constructor(public name: string, public description: string="") { }

    abstract toJSON(): string;

    create(): void {
      const uri = [
        api_endpoint,
        "management_api/v1",
        this.contextType + "s",
        this.contextID,
        this.resourceType + "s"].join("/");
      this.save("post", uri);
    }

    update(): void {
    }

    private save(method: GoogleAppsScript.URL_Fetch.HttpMethod, uri: string): void {
      const options = {
        "method": method,
        "contentType": "application/json",
        "payload": this.toJSON(),
        "headers": {
          "content-type": "application/json",
          "authorization": "Token " + management_token
        }
      };

      const request = UrlFetchApp.fetch(uri, options);
    }
  }
}

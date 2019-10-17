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

  const resourceTypes = {
    dataLayerValidations: "data_layer_validations",
    steps: "steps",
    suites: "suites",
    tagValidations: "tag_validations",
    tests: "tests"
  };

  export abstract class Resource {
    static readonly contextType: string;
    static readonly resourceType: string;
    static readonly children: string[];
    static readonly resourceTypeRun?: string;

    jobID?: number;
    contextID?: number;
    resourceID?: number;
    options: Object;

    protected toDelete: Resource[] = [];

    constructor(public name: string) {
    }

    /**
     * Convert the resource to an Object
     *
     * @abstract
     * @returns {Object} object representation of the resource
     * @memberof Resource
     */
    abstract toJSON(): Object;

    /**
     * Convert the resource to a JSON string
     *
     * @returns {string} the resource represented as a JSON string
     * @memberof Resource
     */
    toString(): string {
      return JSON.stringify(this.toJSON());
    }

    /**
     * Create a resource from a given ID
     *
     * @static
     * @param {number} id the ID of the resource
     * @memberof Resource
     */
    static fromID(id: number): void { }

    setResourceID(id: number): void {
      this.resourceID = id;
    }

    setContextID(id: number): void {
      this.contextID = id;
    }

    static fromJSON(): void { }

    /**
     * Set options from the passed options object
     *
     * @param {Object} options the object to set options from
     * @param {boolean} [override] whether to override the options object
     * @memberof Resource
     */
    setOptions(options: Object, override?: boolean): void {
      if (override) {
        this.options = options;
      } else {
        this.options = {
          ...this.options,
          ...options
        };
      }
    }

    /**
     * Fetch a resource from DataTrue
     *
     * @static
     * @param {number} id the id of the resource to fetch
     * @param {string} resourceType the type of the resource to fetch
     * @returns {string} the resource represented as a JSON string
     * @memberof Resource
     */
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

    /**
     * Save a resource to DataTrue
     *
     * @memberof Resource
     */
    public save(): void {
      if (this.resourceID) {
        this.update();
      } else {
        this.create();
      }
      this.toDelete.forEach(child => child.delete());
      this.toDelete = [];
    }

    /**
     * Create the resource in DataTrue
     *
     * @protected
     * @memberof Resource
     */
    protected create(): void {
      const uri = [
        DataTrue.apiEndpoint,
        "management_api/v1",
        (this.constructor as any).contextType + "s",
        this.contextID,
        (this.constructor as any).resourceType + "s"].join("/");

      const request = this.makeRequest("post", uri, this.toString());

      this.setResourceID(JSON.parse(request.getContentText())[(this.constructor as any).resourceType]["id"]);
    }

    /**
     * Update the resource and all children in DataTrue
     *
     * @protected
     * @memberof Resource
     */
    protected update(): void {
      const uri = [
        DataTrue.apiEndpoint,
        "management_api/v1",
        (this.constructor as any).resourceType + "s",
        this.resourceID].join("/");

      const payload = this.toJSON();

      const request = this.makeRequest("put", uri, JSON.stringify(this.removeChildren(payload)));

      for (let childs of (this.constructor as any).children) {
        this[childs].forEach(child => {
          child.save();
        });
      }
    }

    private removeChildren(obj: Object): Object {
      for (let child of (this.constructor as any).children) {
        if (Object.prototype.hasOwnProperty.call(obj, (this.constructor as any).resourceType)) {
          delete obj[(this.constructor as any).resourceType][resourceTypes[child]];
        } else {
          delete obj[resourceTypes[child]];
        }
      }
      return obj;
    }

    /**
     * Delete the resource in DataTrue
     *
     * @memberof Resource
     */
    public delete(): void {
      const uri = [
        DataTrue.apiEndpoint,
        "management_api/v1",
        (this.constructor as any).resourceType + "s",
        this.contextID].join("/");

      const request = this.makeRequest("delete", uri);
    }

    /**
     * Run the resource in DataTrue
     *
     * @param {number[]} [email_users=[]] a list of IDs for who should be emailed regarding the test run
     * @memberof Resource
     */
    public run(email_users: number[] = []): void {
      const uri = [
        DataTrue.apiEndpoint,
        "ci_api",
        `test_runs?api_key=${DataTrue.ciToken}`
      ].join("/");

      const request = this.makeRequest("post", uri, JSON.stringify({
        "test_run": {
          "test_class": (this.constructor as any).resourceTypeRun,
          "test_id": this.resourceID,
          "email_users": email_users
        }
      }));

      this.jobID = JSON.parse(request.getContentText())["job_id"];
    }

    /**
     * Retrieve the progress of a running test
     *
     * @returns {DataTrue.JobStatus} the status of the running test
     * @memberof Resource
     */
    public progress(): DataTrue.JobStatus {
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

      return JSON.parse(UrlFetchApp.fetch(uri, options).getContentText());
    }

    private makeRequest(method: GoogleAppsScript.URL_Fetch.HttpMethod, uri: string, payload: string = ""): GoogleAppsScript.URL_Fetch.HTTPResponse {
      const options = {
        "method": method,
        "contentType": "application/json",
        "payload": payload,
        "headers": {
          "content-type": "application/json",
          "authorization": "Token " + DataTrue.managementToken
        }
      };

      return UrlFetchApp.fetch(uri, options);
    }
  }
}

namespace DataTrue {
  export var apiEndpoint: string = "datatrue.com";
  export var managementToken: string = "";
  export var ciToken: string = "";

  export interface JobStatus {
    status: string,
    options: {
      test_run_id: number,
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
          num_pii_data_processors: number,
        },
      }[],
    },
    message?: string,
  }

  const resourceTypes = {
    dataLayerValidations: "data_layer_validations",
    steps: "steps",
    suites: "suites",
    tagValidations: "tag_validations",
    tests: "tests",
  };

  export abstract class Resource {
    public static readonly contextType: string;
    public static readonly resourceType: string;
    public static readonly children: readonly string[];
    public static readonly resourceTypeRun?: string;

    public jobID?: number;
    public contextID?: number;
    public resourceID?: number;
    public options: object;

    protected toDelete: Resource[] = [];

    public constructor(public name: string) { }

    /**
     * Convert the resource to an Object
     *
     * @abstract
     * @returns {object} object representation of the resource
     * @memberof Resource
     */
    abstract toJSON(): object;

    /**
     * Convert the resource to a JSON string
     *
     * @returns {string} the resource represented as a JSON string
     * @memberof Resource
     */
    public toString(): string {
      return JSON.stringify(this.toJSON());
    }

    /**
     * Create a resource from a given ID
     *
     * @static
     * @param {number} id the ID of the resource
     * @memberof Resource
     */
    public static fromID(id: number): void { }

    public setResourceID(id: number): void {
      this.resourceID = id;
    }

    public setContextID(id: number): void {
      this.contextID = id;
    }

    public static fromJSON(): void { }

    /**
     * Set options from the passed options object
     *
     * @param {object} options the object to set options from
     * @param {boolean} [override] whether to override the options object
     * @memberof Resource
     */
    public setOptions(options: object, override?: boolean): void {
      if (override) {
        this.options = options;
      } else {
        this.options = {
          ...this.options,
          ...options,
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
    protected static getResource(id: number, resourceType: string): string {
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
          "authorization": "Token " + DataTrue.managementToken,
        },
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

      for (const childs of (this.constructor as any).children) {
        this[childs].forEach(child => {
          child.save();
        });
      }
    }

    /**
     * Add a child to a resource
     *
     * @protected
     * @param {object} child child to add to the Resource
     * @param {number} [index=-1] index to add the child at
     * @param {string} childType type of the child
     * @memberof Resource
     */
    protected addChild(child: object, index: number = -1, childType: string): void {
      const children = this[childType].slice();
      children.splice(index, 0, child);
      this[childType] = children;
    }

    /**
     * Delete a child from a resource
     *
     * @protected
     * @param {number} index index to delete the child from
     * @param {string} childType type of the child
     * @memberof Resource
     */
    protected deleteChild(index: number, childType: string): void {
      this.toDelete.push(this[childType][index]);
      const children = this[childType].slice();
      children.splice(index, 1);
      this[childType] = children;
    }

    /**
     * Removes children from obj so that the Resource can be updated
     *
     * @private
     * @param {object} obj object to remove children from
     * @returns {object} obj without children
     * @memberof Resource
     */
    private removeChildren(obj: object): object {
      for (const child of (this.constructor as any).children) {
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
        `test_runs?api_key=${DataTrue.ciToken}`,
      ].join("/");

      const request = this.makeRequest("post", uri, JSON.stringify({
        "test_run": {
          "test_class": (this.constructor as any).resourceTypeRun,
          "test_id": this.resourceID,
          "email_users": email_users,
        },
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
        `${this.jobID}?api_key=${DataTrue.ciToken}`,
      ].join("/");

      const options = {
        "method": "get" as GoogleAppsScript.URL_Fetch.HttpMethod,
        "contentType": "application/json",
        "headers": {
          "content-type": "application/json",
        },
      };

      return JSON.parse(UrlFetchApp.fetch(uri, options).getContentText());
    }

    /**
     * Make a HTTP request to DataTrue
     *
     * @private
     * @param {GoogleAppsScript.URL_Fetch.HttpMethod} method HTTP method
     * @param {string} uri uri to make request to
     * @param {string} [payload=""] payload to include in request
     * @returns {GoogleAppsScript.URL_Fetch.HTTPResponse} HTTP response
     * @memberof Resource
     */
    private makeRequest(method: GoogleAppsScript.URL_Fetch.HttpMethod, uri: string, payload: string = ""): GoogleAppsScript.URL_Fetch.HTTPResponse {
      const options = {
        "method": method,
        "contentType": "application/json",
        "payload": payload,
        "headers": {
          "content-type": "application/json",
          "authorization": "Token " + DataTrue.managementToken,
        },
      };

      return UrlFetchApp.fetch(uri, options);
    }
  }
}

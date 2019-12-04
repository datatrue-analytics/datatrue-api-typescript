namespace DataTrue {
  export var apiEndpoint: string = "datatrue.com";
  export var managementToken: string = "";
  export var ciToken: string = "";

  const resourceTypes = {
    dataLayerValidations: "data_layer_validations",
    steps: "steps",
    suites: "suites",
    tagValidations: "tag_validations",
    tests: "tests",
  };

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
  export const _makeRequest = function _makeRequest(method: GoogleAppsScript.URL_Fetch.HttpMethod, uri: string, payload: string = ""): GoogleAppsScript.URL_Fetch.HTTPResponse {
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
  };

  export abstract class Resource {
    public static readonly contextType: string;
    public static readonly resourceType: string;
    public static readonly children: readonly string[];
    public static readonly resourceTypeRun?: string;

    protected toDelete: Resource[] = [];
    protected resourceID?: number;
    protected contextID?: number;

    public options: object;

    public constructor(public name: string) { }

    /**
     * Create a resource from a given ID
     *
     * @static
     * @param {number} id the ID of the resource
     * @memberof Resource
     */
    public static fromID(id: number): void { }

    /**
     * Create a resource from an object
     *
     * @static
     * @param {Record<string, any>} obj object to create resource from
     * @param {boolean} [copy=false] whether to create a copy of the resource or not (removes resource IDs)
     * @memberof Resource
     */
    public static fromJSON(obj: Record<string, any>, copy: boolean = false): void { }

    /**
     * Convert the resource to an Object
     *
     * @abstract
     * @returns {object} object representation of the resource
     * @memberof Resource
     */
    public abstract toJSON(): object;

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
     * Gets the resourceID of a resource
     *
     * @returns {number} resourceID of the resource
     * @memberof Resource
     */
    public getResourceID(): number {
      return this.resourceID;
    }

    /**
     * Gets the contextID of a resource
     *
     * @returns {number} contextID of the resource
     * @memberof Resource
     */
    public getContextID(): number {
      return this.contextID;
    }

    /**
     * Sets the resourceID of a resource
     *
     * @param {number} id the resourceID to set
     * @memberof Resource
     */
    public setResourceID(id: number): void {
      this.resourceID = id;
    }

    /**
     * Sets the contextID of a resource
     *
     * @param {number} id the contextID to set
     * @memberof Resource
     */
    public setContextID(id: number): void {
      this.contextID = id;
    }

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

      const request = DataTrue._makeRequest("post", uri, this.toString());

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

      const request = DataTrue._makeRequest("put", uri, JSON.stringify(this.removeChildren(payload)));

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
     * @param {number} [index=0] index to add the child at
     * @param {string} childType type of the child
     * @memberof Resource
     */
    protected insertChild(child: object, index: number = 0, childType: string): void {
      this[childType].splice(index, 0, child);
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
      this[childType].splice(index, 1);
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

      const request = DataTrue._makeRequest("delete", uri);
    }
  }
}

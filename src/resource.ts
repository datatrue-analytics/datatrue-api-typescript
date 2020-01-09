import HTTPClient from "./httpClient/httpClient";

const resourceTypes: Record<string, string> = {
  dataLayerValidations: "data_layer_validations",
  steps: "steps",
  suites: "suites",
  tagValidations: "tag_validations",
  tests: "tests",
};

/**
 * @hidden
 */
export interface ResourceOptions {
  description?: string,
  position?: number,
}

/**
 * @hidden
 */
export interface Config {
  apiEndpoint: string,
  userToken: string,
  accountToken: string,
}

/**
 * Base class for all DataTrue resource types
 *
 * @abstract
 * @class Resource
 * @hidden
 */
export default abstract class Resource {
  public static readonly resourceType: string;
  public static readonly childTypes: readonly string[];
  public static readonly resourceTypeRun?: string;

  protected toDelete: Resource[] = [];
  protected resourceID?: number;
  protected contextID?: number;

  protected static client: HTTPClient;
  protected static config: Config;

  public abstract readonly contextType: string;
  public options: ResourceOptions = {};

  public constructor(public name: string) { }

  /**
   * Create a resource from a given ID
   *
   * @static
   * @param {number} id the ID of the resource
   * @returns {Promise<Resource>} Promise of the resource
   */
  public static fromID(id: number): Promise<Resource> { // eslint-disable-line @typescript-eslint/no-unused-vars
    return Promise.reject(new Error("Function not implemented"));
  }

  /**
   * Create a resource from an object
   *
   * @static
   * @param {Record<string, any>} obj object to create resource from
   * @param {boolean} [copy=false] whether to create a copy of the resource or not (removes resource IDs)
   */
  public static fromJSON(obj: Record<string, any>, copy: boolean = false): void { } // eslint-disable-line @typescript-eslint/no-unused-vars

  /**
   * Convert the resource to an Object
   *
   * @abstract
   * @returns {Record<string, any>} object representation of the resource
   */
  public abstract toJSON(): Record<string, any>;

  /**
   * Convert the resource to a JSON string
   *
   * @returns {string} the resource represented as a JSON string
   */
  public toString(): string {
    return JSON.stringify(this.toJSON());
  }

  /**
   * Gets the resourceID of a resource
   *
   * @returns {(number | undefined)} resourceID of the resource
   */
  public getResourceID(): number | undefined {
    return this.resourceID;
  }

  /**
   * Gets the contextID of a resource
   *
   * @returns {(number | undefined)} contextID of the resource
   */
  public getContextID(): number | undefined {
    return this.contextID;
  }

  /**
   * Sets the resourceID of a resource
   *
   * @param {(number | undefined)} id the resourceID to set
   */
  public setResourceID(id: number | undefined): void {
    this.resourceID = id;
    (this.constructor as any).childTypes.forEach((childType: string) => {
      (this as Record<string, any>)[childType].forEach((child: Resource) => {
        child.setContextID(id);
      });
    });
  }

  /**
   * Sets the contextID of a resource
   *
   * @param {(number | undefined)} id the contextID to set
   */
  public setContextID(id: number | undefined): void {
    this.contextID = id;
  }

  /**
   * Set options from the passed options object
   *
   * @param {ResourceOptions} options the object to set options from
   * @param {boolean} [override] whether to override the options object
   */
  public setOptions(options: ResourceOptions, override?: boolean): void {
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
   * @protected
   * @static
   * @param {number} id the id of the resource to fetch
   * @param {string} resourceType the type of the resource to fetch
   * @returns {Promise<string>} Promise of the resource as a JSON string
   */
  protected static getResource(id: number, resourceType: string): Promise<string> {
    const uri = [
      Resource.config.apiEndpoint,
      "management_api/v1",
      resourceType + "s",
      id].join("/");

    return Resource.client.makeRequest(uri, "get", {
      "headers": {
        "authorization": "Token " + Resource.config.userToken,
      },
    }).then(response => {
      if (response.status >= 400) {
        throw response;
      }
      return response.body;
    });
  }

  /**
   * Save a resource to DataTrue
   *
   * @returns {Promise<void>} Promise
   */
  public save(): Promise<void> {
    const after = (): Promise<void> => {
      const promises = this.toDelete.slice().map(child => {
        return child.delete().then(() => {
          this.toDelete.splice(this.toDelete.indexOf(child), 1);
        });
      });
      return Promise.all(promises).then();
    };

    let pr: Promise<void>;

    if (this.resourceID) {
      pr = this.update();
    } else {
      pr = this.create();
    }

    return pr.then(after);
  }

  /**
   * Create the resource in DataTrue
   *
   * @protected
   * @returns {Promise<void>} Promise
   */
  protected create(): Promise<void> {
    const resourceType: string = (this.constructor as any).resourceType;

    const uri = [
      Resource.config.apiEndpoint,
      "management_api/v1",
      this.contextType + "s",
      this.contextID,
      resourceType + "s"].join("/");

    return Resource.client.makeRequest(uri, "post", {
      body: this.toString(),
      headers: {
        "authorization": "Token " + Resource.config.userToken,
      },
    }).then(response => {
      if (response.status >= 400) {
        throw response;
      }

      const responseObj = JSON.parse(response.body);

      this.setResourceID(responseObj[resourceType]["id"]);

      // Sets resource IDs for all children that were created
      (this.constructor as any).childTypes.forEach((childType: string) => {
        if (responseObj[resourceType][resourceTypes[childType]] !== undefined) {
          responseObj[resourceType][resourceTypes[childType]].forEach((childObj: Record<string, any>, index: number) => {
            (this as Record<string, any>)[childType][index].setResourceID(childObj["id"]);
          });
        }
      });
    });
  }

  /**
   * Update the resource and all children in DataTrue
   *
   * @protected
   * @returns {Promise<void>} Promise
   */
  protected update(): Promise<void> {
    const uri = [
      Resource.config.apiEndpoint,
      "management_api/v1",
      (this.constructor as any).resourceType + "s",
      this.resourceID].join("/");

    const payload = this.toJSON();

    return Resource.client.makeRequest(uri, "put", {
      body: JSON.stringify(this.beforeUpdate(payload)),
      headers: {
        "authorization": "Token " + Resource.config.userToken,
      },
    }).then((response) => {
      if (response.status >= 400) {
        throw response;
      }

      const promises = (this.constructor as any).childTypes.flatMap((childType: string) => {
        return (this as Record<string, any>)[childType].map((child: Resource) => {
          return child.save();
        });
      });
      return Promise.all(promises).then(() => {});
    });
  }

  /**
   * Add a child to a resource
   *
   * @protected
   * @param {object} child child to add to the Resource
   * @param {number} [index=0] index to add the child at
   * @param {string} resourceType type of the child
   */
  protected insertChild(child: object, index: number = 0, resourceType: string): void {
    (this as Record<string, any>)[resourceType].splice(index, 0, child);
    if ((this.constructor as any).childTypes.indexOf(resourceType) > -1) {
      (this as Record<string, any>)[resourceType].forEach((child: Resource, index: number) => {
        child.setOptions({ position: index + 1 });
      });
    }
  }

  /**
   * Delete a child from a resource
   *
   * @protected
   * @param {number} index index to delete the child from
   * @param {string} childType type of the child
   */
  protected deleteChild(index: number, childType: string): void {
    this.toDelete.push((this as Record<string, any>)[childType][index]);
    (this as Record<string, any>)[childType].splice(index, 1);
  }

  /**
   * Removes children from obj so that the Resource can be updated
   *
   * @private
   * @param {Record<string, any>} obj object to remove children from
   * @returns {object} obj without children
   */
  private beforeUpdate(obj: Record<string, any>): object {
    for (const childType of (this.constructor as any).childTypes) {
      if (obj[(this.constructor as any).resourceType] !== undefined) {
        delete obj[(this.constructor as any).resourceType][resourceTypes[childType]];
      } else {
        delete obj[resourceTypes[childType]];
      }
    }
    return obj;
  }

  /**
   * Delete the resource in DataTrue
   *
   * @returns {Promise<void>} Promise
   */
  public delete(): Promise<void> {
    const uri = [
      Resource.config.apiEndpoint,
      "management_api/v1",
      (this.constructor as any).resourceType + "s",
      this.contextID].join("/");

    return Resource.client.makeRequest(uri, "delete", {
      headers: {
        "authorization": "Token " + Resource.config.userToken,
      },
    }).then((response) => {
      if (response.status >= 400) {
        throw response;
      }
    });
  }
}

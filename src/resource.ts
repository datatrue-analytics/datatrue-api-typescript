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
   * @param {(resource: Resource) => void} callback callback to execute once resource has been fetched
   * @param {any} [thisArg] context of the callback
   */
  public static fromID(id: number, callback: (resource: Resource) => void, thisArg?: any): void { } // eslint-disable-line @typescript-eslint/no-unused-vars

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
   * @param {(resource: string) => void} [callback] callback to execute once the resource has been fetched
   * @param {*} [thisArg] context of the callback
   */
  protected static getResource(id: number, resourceType: string, callback?: (resource: string) => void, thisArg?: any): void {
    const uri = [
      Resource.config.apiEndpoint,
      "management_api/v1",
      resourceType + "s",
      id].join("/");

    Resource.client.makeRequest(uri, "get", {
      "headers": {
        "content-type": "application/json",
        "authorization": "Token " + Resource.config.userToken,
      },
    }, (response) => {
      if (typeof callback === "function") {
        callback.call(thisArg, response.body);
      }
    });
  }

  /**
   * Save a resource to DataTrue
   *
   * @param {() => void} [callback] callback to execute after the Resource has been saved
   * @param {*} [thisArg] context of the callback
   */
  public save(callback?: () => void, thisArg?: any): void {
    const after = (): void => {
      this.toDelete.forEach(child => child.delete());
      this.toDelete = [];

      if (typeof callback === "function") {
        callback.call(thisArg);
      }
    };

    if (this.resourceID) {
      this.update(after, this);
    } else {
      this.create(after, this);
    }
  }

  /**
   * Create the resource in DataTrue
   *
   * @protected
   * @param {() => void} [callback] callback to execute after the Resource has been created
   * @param {*} [thisArg] context of the callback
   */
  protected create(callback?: () => void, thisArg?: any): void {
    const resourceType: string = (this.constructor as any).resourceType;

    const uri = [
      Resource.config.apiEndpoint,
      "management_api/v1",
      this.contextType + "s",
      this.contextID,
      resourceType + "s"].join("/");

    Resource.client.makeRequest(uri, "post", {
      body: this.toString(),
      headers: {
        "content-type": "application/json",
        "authorization": "Token " + Resource.config.userToken,
      },
    }, (response) => {
      const responseObj = JSON.parse(response.body);

      this.setResourceID(responseObj[resourceType]["id"]);

      (this.constructor as any).childTypes.forEach((childType: string) => {
        if (responseObj[resourceType][resourceTypes[childType]] !== undefined) {
          responseObj[resourceType][resourceTypes[childType]].forEach((childObj: Record<string, any>, index: number) => {
            (this as Record<string, any>)[childType][index].setResourceID(childObj["id"]);
          });
        }
      });

      if (typeof callback === "function") {
        callback.call(thisArg);
      }
    }, this);
  }

  /**
   * Update the resource and all children in DataTrue
   *
   * @protected
   * @param {() => void} [callback] callback to execute after the Resource has been updated
   * @param {*} [thisArg] context of the callback
   */
  protected update(callback?: () => void, thisArg?: any): void {
    const uri = [
      Resource.config.apiEndpoint,
      "management_api/v1",
      (this.constructor as any).resourceType + "s",
      this.resourceID].join("/");

    const payload = this.toJSON();

    Resource.client.makeRequest(uri, "put", {
      body: JSON.stringify(this.beforeUpdate(payload)),
      headers: {
        "content-type": "application/json",
        "authorization": "Token " + Resource.config.userToken,
      },
    }, () => {
      for (const childType of (this.constructor as any).childTypes) {
        (this as Record<string, any>)[childType].forEach((child: Resource) => {
          child.save();
        });
      }

      if (typeof callback === "function") {
        callback.call(thisArg);
      }
    }, this);
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
      if (Object.prototype.hasOwnProperty.call(obj, (this.constructor as any).resourceType)) {
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
   */
  public delete(): void {
    const uri = [
      Resource.config.apiEndpoint,
      "management_api/v1",
      (this.constructor as any).resourceType + "s",
      this.contextID].join("/");

    Resource.client.makeRequest(uri, "delete", {
      headers: {
        "content-type": "application/json",
        "authorization": "Token " + Resource.config.userToken,
      },
    });
  }
}

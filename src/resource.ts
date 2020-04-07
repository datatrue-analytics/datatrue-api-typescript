import HTTPClient from "./httpClient/httpClient";

/**
 * @hidden
 */
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
   * @param id the ID of the resource
   * @returns Promise of the resource
   */
  public static fromID(id: number): Promise<Resource> { // eslint-disable-line @typescript-eslint/no-unused-vars
    return Promise.reject(new Error("Function not implemented"));
  }

  /**
   * Create a resource from an object
   *
   * @param obj object to create resource from
   * @param copy whether to create a copy of the resource or not (removes resource IDs)
   */
  public static fromJSON(obj: Record<string, any>, copy: boolean = false): void { } // eslint-disable-line @typescript-eslint/no-unused-vars

  /**
   * Convert the resource to an Object
   *
   * @returns object representation of the resource
   */
  public abstract toJSON(): Record<string, any>;

  /**
   * Convert the resource to a JSON string
   *
   * @returns the resource represented as a JSON string
   */
  public toString(): string {
    return JSON.stringify(this.toJSON());
  }

  /**
   * Gets the resourceID of a resource
   *
   * @returns resourceID of the resource
   */
  public getResourceID(): number | undefined {
    return this.resourceID;
  }

  /**
   * Gets the contextID of a resource
   *
   * @returns contextID of the resource
   */
  public getContextID(): number | undefined {
    return this.contextID;
  }

  /**
   * Sets the resourceID of a resource
   *
   * @param id the resourceID to set
   */
  public setResourceID(id: number | undefined): void {
    this.resourceID = id;
    (this.constructor as typeof Resource).childTypes.forEach((childType: string) => {
      (this as Record<string, any>)[childType].forEach((child: Resource) => {
        child.setContextID(id);
      });
    });
  }

  /**
   * Sets the contextID of a resource
   *
   * @param id the contextID to set
   */
  public setContextID(id: number | undefined): void {
    this.contextID = id;
  }

  /**
   * Set options from the passed options object
   *
   * @param options the object to set options from
   * @param override whether to override the options object
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
   * @param id the id of the resource to fetch
   * @param resourceType the type of the resource to fetch
   * @returns Promise of the resource as a JSON string
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
   * @returns Promise
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
   * @returns Promise
   */
  protected create(): Promise<void> {
    const resourceType: string = (this.constructor as typeof Resource).resourceType;

    const uri = [
      Resource.config.apiEndpoint,
      "management_api/v1",
      this.contextType + "s",
      this.contextID,
      resourceType + "s"].join("/");

    const payload = this.toJSON();

    return Resource.client.makeRequest(uri, "post", {
      body: JSON.stringify(this.beforeSave(payload)),
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
      (this.constructor as typeof Resource).childTypes.forEach((childType: string) => {
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
   * @returns Promise
   */
  protected update(): Promise<void> {
    const uri = [
      Resource.config.apiEndpoint,
      "management_api/v1",
      (this.constructor as typeof Resource).resourceType + "s",
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

      const promises = (this.constructor as typeof Resource).childTypes.flatMap((childType: string) => {
        return (this as Record<string, any>)[childType].map((child: Resource) => {
          return child.save();
        });
      });
      return Promise.all(promises).then(() => { });
    });
  }

  /**
   * Add a child to a resource
   *
   * @param child child to add to the Resource
   * @param index index to add the child at
   * @param resourceType type of the child
   */
  protected insertChild(child: Record<string, any>, index: number = 0, resourceType: string): void {
    (this as Record<string, any>)[resourceType].splice(index, 0, child);
    if ((this.constructor as typeof Resource).childTypes.includes(resourceType)) {
      (this as Record<string, any>)[resourceType].forEach((child: Resource, index: number) => {
        child.setOptions({ position: index + 1 });
      });
    }
  }

  /**
   * Delete a child from a resource
   *
   * @param index index to delete the child from
   * @param childType type of the child
   */
  protected deleteChild(index: number, childType: string): void {
    this.toDelete.push((this as Record<string, any>)[childType][index]);
    (this as Record<string, any>)[childType].splice(index, 1);
  }

  /**
   * Format the object to the required specifications to save
   *
   * @param obj object to save
   * @returns object in correct format for DataTrue
   */
  private beforeSave(obj: Record<string, any>): Record<string, any> {
    if ((this.constructor as typeof Resource).resourceType === "test") {
      return {
        test: obj,
      };
    } else {
      return obj;
    }
  }

  /**
   * Removes children from obj so that the Resource can be updated
   *
   * @param obj object to remove children from
   * @returns obj without children
   */
  private beforeUpdate(obj: Record<string, any>): Record<string, any> {
    for (const childType of (this.constructor as typeof Resource).childTypes) {
      if (obj[(this.constructor as typeof Resource).resourceType] !== undefined) {
        delete obj[(this.constructor as typeof Resource).resourceType][resourceTypes[childType]];
      } else {
        delete obj[resourceTypes[childType]];
      }
    }

    if ((this.constructor as typeof Resource).resourceType === "test") {
      return {
        test: obj,
      };
    } else {
      return obj;
    }
  }

  /**
   * Delete the resource in DataTrue
   *
   * @returns Promise
   */
  public delete(): Promise<void> {
    const uri = [
      Resource.config.apiEndpoint,
      "management_api/v1",
      (this.constructor as typeof Resource).resourceType + "s",
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

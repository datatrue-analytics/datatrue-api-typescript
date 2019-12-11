import Resource, { ResourceOptions } from "./resource";

export interface DataLayerValidationOptions extends ResourceOptions {
  enabled?: boolean,
  source?: string,
  selector?: string,
  selector_type?: string,
  iframe_selector?: string,
  iframe_selector_type?: string,
  attr?: string,
  cookie_name?: string,
  js_variable_name?: string,
  custom_js_code?: string,
  regex?: string,
  variable_name?: string,
  validation_enabled?: boolean,
}

export interface PropertyValidation {
  name: string,
  value: string,
}

export default class DataLayerValidation extends Resource {
  public static readonly contextType: string = "step";
  public static readonly resourceType: string = "data_layer_validations";
  public static readonly childTypes: string[] = [];

  private propertyValidations: PropertyValidation[] = [];

  public options: DataLayerValidationOptions = {};

  public constructor(name: string, public contextID?: number, options: DataLayerValidationOptions = {}) {
    super(name);
    this.setOptions(options);
  }

  public static fromID(id: number, callback?: (dataLayerValidation: DataLayerValidation) => void, thisArg?: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
    super.getResource(id, DataLayerValidation.resourceType, (resource: string) => {
      if (typeof callback === "function") {
        callback.call(thisArg, DataLayerValidation.fromJSON(JSON.parse(resource)));
      }
    });
  }

  public static fromJSON(obj: Record<string, any>, copy: boolean = false): DataLayerValidation { // eslint-disable-line @typescript-eslint/no-explicit-any
    const { name, id, property_validations, ...options } = obj;

    const dataLayerValidation = new DataLayerValidation(name);
    if (!copy) {
      dataLayerValidation.setResourceID(id);
    }
    dataLayerValidation.setOptions(options, true);

    if (property_validations !== undefined) {
      property_validations.forEach((propertyValidationObj: PropertyValidation) => {
        dataLayerValidation.insertPropertyValidation(propertyValidationObj);
      });
    }

    return dataLayerValidation;
  }

  public insertPropertyValidation(propertyValidation: PropertyValidation, index: number = this.propertyValidations.length): void {
    super.insertChild(propertyValidation, index, "propertyValidations");
  }

  public deletePropertyValidation(index: number): void {
    this.propertyValidations.splice(index, 1);
  }

  public getPropertyValidations(): readonly PropertyValidation[] {
    return this.propertyValidations.slice();
  }

  public setOptions(options: DataLayerValidationOptions, override: boolean = false): void {
    super.setOptions(options, override);
  }

  public toJSON(): Record<string, any> {
    const obj: Record<string, any> = {
      name: this.name,
      property_validations: this.propertyValidations,
    };

    for (const option in this.options) {
      obj[option] = (this.options as Record<string, any>)[option];
    }

    return obj;
  }
}

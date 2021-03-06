import Resource, { ResourceOptions } from "./resource";
import { IframeSelectorTypes, WebSelectorTypes } from "./step";

export enum DataLayerValidationSource {
  DOM = "dom",
  URL = "url",
  COOKIE = "cookie",
  JS_VARIABLE = "js_variable",
  CUSTOM_JS = "custom_js",
}

export interface DataLayerValidationOptions extends ResourceOptions {
  enabled?: boolean,
  source?: DataLayerValidationSource,
  selector?: string,
  selector_type?: WebSelectorTypes,
  iframe_selector?: string,
  iframe_selector_type?: IframeSelectorTypes,
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
  regex?: boolean,
}

export default class DataLayerValidation extends Resource {
  public static readonly resourceType: string = "data_layer_validation";
  public static readonly childTypes: readonly string[] = [];

  private propertyValidations: PropertyValidation[] = [];

  public readonly contextType: string = "step";
  public options: DataLayerValidationOptions = {};

  public constructor(
    name: string,
    protected contextID?: number,
    options: DataLayerValidationOptions = {}
  ) {
    super(name);
    this.setOptions(options);
  }

  public static async fromID(id: number): Promise<DataLayerValidation> {
    const resource = await super.getResource(
      id,
      DataLayerValidation.resourceType
    );

    return DataLayerValidation.fromJSON(JSON.parse(resource));
  }

  public static fromJSON(
    obj: Record<string, any>,
    copy: boolean = false
  ): DataLayerValidation {
    const {
      name,
      id,
      step_id: stepId,
      property_validations: propertyValidations,
      ...options
    } = obj;

    const dataLayerValidation = new DataLayerValidation(name, stepId);
    if (!copy) {
      dataLayerValidation.setResourceID(id);
    }
    dataLayerValidation.setOptions(options, true);

    if (propertyValidations !== undefined) {
      propertyValidations.forEach(
        (propertyValidationObj: Record<string, any>) => {
          const obj: PropertyValidation = {
            name: propertyValidationObj.name,
            value: propertyValidationObj.value,
          };

          if (propertyValidationObj.regex !== undefined) {
            obj.regex = propertyValidationObj.regex === "1" ? true : false;
          }

          dataLayerValidation.insertPropertyValidation(obj);
        }
      );
    }

    return dataLayerValidation;
  }

  public insertPropertyValidation(
    propertyValidation: PropertyValidation,
    index: number = this.propertyValidations.length
  ): void {
    super.insertChild(propertyValidation, index, "propertyValidations");
  }

  public deletePropertyValidation(index: number): void {
    this.propertyValidations.splice(index, 1);
  }

  public getPropertyValidations(): readonly PropertyValidation[] {
    return this.propertyValidations.slice();
  }

  public setOptions(
    options: DataLayerValidationOptions,
    override: boolean = false
  ): void {
    super.setOptions(options, override);
  }

  public toJSON(): Promise<Record<string, any>> {
    const obj: Record<string, any> = {
      id: this.resourceID,
      name: this.name,
      property_validations: this.propertyValidations.map(propertyValidation => {
        const obj: Record<string, any> = {
          name: propertyValidation.name,
          value: propertyValidation.value,
        };

        if (propertyValidation.regex !== undefined) {
          obj.regex = propertyValidation.regex ? "1" : "0";
        }

        return obj;
      }),
      ...this.options,
    };

    return Promise.resolve(obj);
  }
}

namespace DataTrue {
  export interface DataLayerValidationOptions {
    description?: string,
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

  export class DataLayerValidation extends DataTrue.Resource {
    public static readonly contextType: string = "step";
    public static readonly resourceType: string = "data_layer_validations";
    public static readonly children: string[] = [];

    private propertyValidations: DataTrue.PropertyValidation[] = [];

    public options: DataTrue.DataLayerValidationOptions = {};

    public constructor(name: string, public contextID?: number, options: DataTrue.DataLayerValidationOptions = {}) {
      super(name);
      this.setOptions(options);
    }

    public static fromID(id: number): DataTrue.DataLayerValidation {
      const obj = super.getResource(id, DataLayerValidation.resourceType);
      return DataTrue.DataLayerValidation.fromJSON(obj);
    }

    public static fromJSON(obj: any): DataTrue.DataLayerValidation {
      const { name, id, property_validations, ...options } = obj;

      const dataLayerValidation = new DataTrue.DataLayerValidation(name);
      dataLayerValidation.setResourceID(id);
      dataLayerValidation.setOptions(options, true);

      if (property_validations !== undefined) {
        property_validations.forEach(propertyValidationObj => {
          dataLayerValidation.addPropertyValidation(propertyValidationObj);
        });
      }

      return dataLayerValidation;
    }

    public addPropertyValidation(propertyValidation: DataTrue.PropertyValidation, index: number = this.propertyValidations.length): void {
      super.addChild(propertyValidation, index, "propertyValidations");
    }

    public deletePropertyValidation(index: number): void {
      this.propertyValidations.splice(index, 1);
    }

    public getPropertyValidations(): readonly DataTrue.PropertyValidation[] {
      return this.propertyValidations.slice();
    }

    public setOptions(options: DataTrue.DataLayerValidationOptions, override: boolean = false): void {
      super.setOptions(options, override);
    }

    public toJSON(): object {
      const obj: object = {
        name: this.name,
        property_validations: this.propertyValidations,
      };

      for (const option in this.options) {
        obj[option] = this.options[option];
      }

      return obj;
    }

    public run(): void {
      throw new Error("Unable to run DataLayerValidation");
    }

    public progress(): DataTrue.JobStatus {
      throw new Error("Unable to retrieve progress for DataLayerValidation");
    }
  }
}

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
    property_validations?: {
      name: string,
      value: string,
    }[],
  }

  export class DataLayerValidation extends DataTrue.Resource {
    public static readonly contextType: string = "step";
    public static readonly resourceType: string = "data_layer_validations";
    public static readonly children: readonly string[] = [];

    public options: DataTrue.DataLayerValidationOptions = {};

    public constructor(name: string, public contextID?: number, options: DataTrue.DataLayerValidationOptions = {}) {
      super(name);
      this.setOptions(options);
    }

    public setOptions(options: DataTrue.DataLayerValidationOptions, override: boolean = false): void {
      super.setOptions(options, override);
    }

    public toJSON(): object {
      const obj: object = {
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

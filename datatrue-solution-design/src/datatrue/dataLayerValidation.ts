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
      value: string
    }[]
  }

  export class DataLayerValidation extends DataTrue.Resource {
    static readonly contextType: string = "step";
    static readonly resourceType: string = "data_layer_validations";

    public options: DataTrue.DataLayerValidationOptions = {};

    constructor(name: string, public contextID?: number, options: DataTrue.DataLayerValidationOptions = {}) {
      super(name);
      this.setOptions(options);
    }

    setOptions(options: DataTrue.DataLayerValidationOptions, override: boolean = false) {
      super.setOptions(options, override);
    }

    toJSON(): string {
      let obj: Object = {
      };

      for (let option in this.options) {
        obj[option] = this.options[option];
      }
      
      return JSON.stringify(obj);
    }

    run(): void {
      throw new Error("Unable to run DataLayerValidation");
    }

    progress(): DataTrue.JobStatus {
      throw new Error("Unable to retrieve progress for DataLayerValidation");
    }
  }
}

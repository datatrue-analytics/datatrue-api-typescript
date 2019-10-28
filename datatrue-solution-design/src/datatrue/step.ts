namespace DataTrue {
  export enum StepActions {
    GOTO_URL = 0,
    CLICK_LINK = 1,
    CLICK_BUTTON = 2,
    TEXT_FIELD = 3,
    SELECT_LIST = 4,
    CLICK_ELEMENT = 5,
    HOVER = 6,
    COVERAGE = 7,
    ENTER = 8,
    CLOSE = 9,
    EMAIL = 10,
    GO_BACK = 11,
    SCROLL_TO = 12,
    RUN_SCRIPT = 13,
    START_APPLICATION = 14,
    SEND_KEYS = 15,
    CLICK_MOBILE_ELEMENT = 16,
    RESTART_APP = 17,
    TAP_COORDS = 18,
    HIDE_KEYBOARD = 19,
    SWIPE = 20,
    MOBILE_SELECT_LIST = 21,
    PRESS_BACK = 22
  }

  export interface StepOptions {
    description?: string,
    js_code?: string,
    target?: string,
    selector_type?: string,
    selector?: string,
    iframe_selector_type?: string,
    iframe_selector?: string,
    pause?: number,
    wait_while_present?: string,
  }

  export enum StepStrategies {
    BREADTH_FIRST = "breadth_first",
    DEPTH_FIRST = "depth_first"
  }

  export interface StepSettings {
    strategy?: DataTrue.StepStrategies,
    obey_robots?: boolean,
    template_detection?: boolean,
    use_common_tag_validations?: boolean,
  }

  export class Step extends DataTrue.Resource {
    public static readonly contextType: string = "test";
    public static readonly resourceType: string = "step";
    public static readonly children: readonly string[] = ["tagValidations", "dataLayerValidations"];

    private tagValidations: DataTrue.TagValidation[] = [];
    private dataLayerValidations: DataTrue.DataLayerValidation[] = [];

    public options: DataTrue.StepOptions = {};

    public constructor(name: string, private action: DataTrue.StepActions, public contextID?: number, options: DataTrue.StepOptions = {}) {
      super(name);
      this.setOptions(options);
    }

    public static fromID(id: number): DataTrue.Step {
      const obj = super.getResource(id);
      return DataTrue.Step.fromJSON(obj);
    }

    public static fromJSON(obj: any): DataTrue.Step {
      const { name, id, action, tag_validations, data_layer_validations, ...options } = obj;

      const step = new DataTrue.Step(name, action);
      step.setResourceID(id);
      step.setOptions(options, true);

      tag_validations.forEach(tagValidationObj => {
        const tagValidation = DataTrue.TagValidation.fromJSON(tagValidationObj);
        tagValidation.setContextID(id);
        step.addTagValidation(tagValidation);
      });

      data_layer_validations.forEach(dataLayerValidationObj => {
        const dataLayerValidation = DataTrue.DataLayerValidation.fromJSON(dataLayerValidationObj);
        dataLayerValidation.setContextID(id);
        step.addDataLayerValidation(dataLayerValidation);
      });

      return step;
    }

    public addTagValidation(tagValidation: DataTrue.TagValidation, index: number = -1): void {
      super.addChild(tagValidation, index, "tagValidations");
    }

    public addDataLayerValidation(dataLayerValidation: DataTrue.DataLayerValidation, index: number = -1): void {
      super.addChild(dataLayerValidation, index, "dataLayerValidations");
    }

    public deleteTagValidation(index: number): void {
      super.deleteChild(index, "tagValidations");
    }

    public deleteDataLayerValidation(index: number): void {
      super.deleteChild(index, "dataLayerValidations");
    }

    public getTagValidations(): readonly DataTrue.TagValidation[] {
      return this.tagValidations.slice();
    }

    public getDataLayerValidations(): readonly DataTrue.DataLayerValidation[] {
      return this.dataLayerValidations.slice();
    }

    public setOptions(options: DataTrue.StepOptions, override: boolean = false): void {
      super.setOptions(options, override);
    }

    public setResourceID(id: number): void {
      super.setResourceID(id);
      this.tagValidations.forEach(tagValidation => tagValidation.setContextID(id));
      this.dataLayerValidations.forEach(dataLayerValidation => dataLayerValidation.setContextID(id));
    }

    public toJSON(): object {
      const obj = {
        name: this.name,
        action: this.action,
      };

      for (const option in this.options) {
        obj[option] = this.options[option];
      }

      if (this.tagValidations.length) {
        obj["tag_validations"] = this.tagValidations.map(tagValidation => JSON.parse(tagValidation.toString()));
      }

      if (this.dataLayerValidations.length) {
        obj["data_layer_validations"] = this.dataLayerValidations.map(dataLayerValidation => JSON.parse(dataLayerValidation.toString()));
      }

      return obj;
    }

    public run(): void {
      throw new Error("Unable to run Step");
    }

    public progress(): DataTrue.JobStatus {
      throw new Error("Unable to retrieve progress for Step");
    }
  }
}

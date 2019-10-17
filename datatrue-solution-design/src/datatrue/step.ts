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
    wait_while_present?: string
  }

  export enum StepStrategies {
    BREADTH_FIRST = "breadth_first",
    DEPTH_FIRST = "depth_first"
  }

  export interface StepSettings {
    strategy?: DataTrue.StepStrategies
    obey_robots?: boolean,
    template_detection?: boolean,
    use_common_tag_validations?: boolean
  }

  export class Step extends DataTrue.Resource {
    static readonly contextType: string = "test";
    static readonly resourceType: string = "step";
    static readonly children: string[] = ["tagValidations", "dataLayerValidations"];

    private tagValidations: DataTrue.TagValidation[] = [];
    private dataLayerValidations: DataTrue.DataLayerValidation[] = [];

    public options: DataTrue.StepOptions = {};

    constructor(name: string, private action: DataTrue.StepActions, public contextID?: number, options: DataTrue.StepOptions = {}) {
      super(name);
      this.setOptions(options);
    }

    addTagValidation(tagValidation: DataTrue.TagValidation, index: number = -1) {
      this.tagValidations.splice(index, 0, tagValidation);
    }

    addDataLayerValidation(dataLayerValidation: DataTrue.DataLayerValidation, index: number = -1) {
      this.dataLayerValidations.splice(index, 0, dataLayerValidation);
    }

    deleteTagValidation(index: number) {
      this.toDelete.push(this.tagValidations[index]);
      this.tagValidations.splice(index, 1);
    }

    deleteDataLayerValidation(index: number) {
      this.toDelete.push(this.dataLayerValidations[index]);
      this.dataLayerValidations.splice(index, 1);
    }

    setOptions(options: DataTrue.StepOptions, override: boolean = false): void {
      super.setOptions(options, override);
    }

    setResourceID(id: number) {
      super.setResourceID(id);
      this.tagValidations.forEach(tagValidation => tagValidation.setContextID(id));
      this.dataLayerValidations.forEach(dataLayerValidation => dataLayerValidation.setContextID(id));
    }

    toJSON(): Object {
      let obj = {
        name: this.name,
        action: this.action
      };

      for (let option in this.options) {
        obj[option] = this.options[option];
      }

      if (this.tagValidations.length) {
        obj["tag_validations"] = this.tagValidations.map(tag_validation => JSON.parse(tag_validation.toString()));
      }

      return obj;
    }

    run(): void {
      throw new Error("Unable to run Step");
    }

    progress(): DataTrue.JobStatus {
      throw new Error("Unable to retrieve progress for Step");
    }
  }
}

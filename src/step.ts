import DataLayerValidation from "./dataLayerValidation";
import Resource, { ResourceOptions } from "./resource";
import TagValidation from "./tagValidation";

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

export enum WebSelectorTypes {
  TEXT = "text",
  ELEMENT_ID = "id",
  CSS = "css",
  XPATH = "xpath",
}

export enum MobileSelectorTypes {
  ELEMENT_ID = "id",
  XPATH = "xpath",
  ACCESSIBILITY_ID = "accessibility_id",
  ACTIVE_ELEMENT = "active_element"
}

export type SelectorTypes = WebSelectorTypes | MobileSelectorTypes;

export enum IframeSelectorTypes {
  ELEMENT_ID = "id",
  XPATH = "xpath",
}

export interface StepOptions extends ResourceOptions {
  js_code?: string,
  target?: string,
  selector_type?: SelectorTypes,
  selector?: string,
  iframe_selector_type?: IframeSelectorTypes,
  iframe_selector?: string,
  pause?: number,
  wait_while_present?: string,
  settings?: StepSettings,
}

export enum StepStrategies {
  BREADTH_FIRST = "breadth_first",
  DEPTH_FIRST = "depth_first",
}

export interface StepSettings {
  strategy?: StepStrategies,
  obey_robots?: boolean,
  template_detection?: boolean,
  use_common_tag_validations?: boolean,
}

export default class Step extends Resource {
  public static readonly resourceType: string = "step";
  public static readonly childTypes: readonly string[] = ["tagValidations", "dataLayerValidations"];

  private tagValidations: TagValidation[] = [];
  private dataLayerValidations: DataLayerValidation[] = [];

  public readonly contextType: string = "test";
  public options: StepOptions = {};

  public constructor(
    name: string,
    public action: StepActions,
    public contextID?: number,
    options: StepOptions = {}
  ) {
    super(name);
    this.setOptions(options);
  }

  public static fromID(id: number): Promise<Step> {
    return super.getResource(id, Step.resourceType).then(resource => {
      return Step.fromJSON(JSON.parse(resource));
    });
  }

  public static fromJSON(
    obj: Record<string, any>,
    copy: boolean = false
  ): Step {
    const { name, id, action, tag_validations, data_layer_validations, ...options } = obj;

    const step = new Step(name, action);
    if (!copy) {
      step.setResourceID(id);
    }
    step.setOptions(options, true);

    if (tag_validations !== undefined) {
      tag_validations.forEach((tagValidationObj: Record<string, any>) => {
        const tagValidation = TagValidation.fromJSON(tagValidationObj);
        tagValidation.setContextID(id);
        if (copy) {
          tagValidation.setResourceID(undefined);
        }
        step.insertTagValidation(tagValidation);
      });
    }

    if (data_layer_validations !== undefined) {
      data_layer_validations.forEach((dataLayerValidationObj: Record<string, any>) => {
        const dataLayerValidation = DataLayerValidation.fromJSON(dataLayerValidationObj);
        dataLayerValidation.setContextID(id);
        if (copy) {
          dataLayerValidation.setContextID(undefined);
        }
        step.insertDataLayerValidation(dataLayerValidation);
      });
    }

    return step;
  }

  public insertTagValidation(
    tagValidation: TagValidation,
    index: number = this.tagValidations.length
  ): void {
    super.insertChild(tagValidation, index, "tagValidations");
  }

  public insertDataLayerValidation(
    dataLayerValidation: DataLayerValidation,
    index: number = this.dataLayerValidations.length
  ): void {
    super.insertChild(dataLayerValidation, index, "dataLayerValidations");
  }

  public deleteTagValidation(index: number): void {
    super.deleteChild(index, "tagValidations");
  }

  public deleteDataLayerValidation(index: number): void {
    super.deleteChild(index, "dataLayerValidations");
  }

  public getTagValidations(): readonly TagValidation[] {
    return this.tagValidations.slice();
  }

  public getDataLayerValidations(): readonly DataLayerValidation[] {
    return this.dataLayerValidations.slice();
  }

  public setOptions(options: StepOptions, override: boolean = false): void {
    super.setOptions(options, override);
  }

  public toJSON(): Record<string, any> {
    const obj: Record<string, any> = {
      name: this.name,
      action: this.action,
      ...this.options,
    };

    if (this.tagValidations.length) {
      obj["tag_validations"] = this.tagValidations.map(tagValidation => tagValidation.toJSON());
    }

    if (this.dataLayerValidations.length) {
      obj["data_layer_validations"] = this.dataLayerValidations.map(dataLayerValidation => dataLayerValidation.toJSON());
    }

    return obj;
  }
}

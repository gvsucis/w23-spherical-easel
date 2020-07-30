import Two from "two.js";
import { SENodule } from "@/models/SENodule";
import { Stylable } from "./Styleable";
import { Resizeable } from "./Resizeable";
import SETTINGS from "@/global-settings";
import { VNodeChildren } from "vue";
import { StyleOptions } from "@/types/Styles";

export enum DisplayStyle {
  RESETVARIABLESTODEFAULTS,
  APPLYTEMPORARYVARIABLES,
  APPLYCURRENTVARIABLES
}

/**
 * A Nodule consists of one or more TwoJS(SVG) elements
 */
export default abstract class Nodule implements Stylable, Resizeable {
  // Declare owner, this field will be initialized by the associated owner of the plottable Nodule
  // public owner!: SENodule;
  public name!: string;

  /**
   * Add various TwoJS (SVG) elements of this nodule to appropriate layers
   * @param {Two.Group[]} layers
   */
  abstract addToLayers(layers: Two.Group[]): void;

  /**
   * This operation reverses the action performed by addToLayers()
   */
  abstract removeFromLayers(): void;

  /**This operation constraint the visual properties (linewidth, circle size, etc) when the view is zoomed in/out */
  abstract adjustSize(): void;

  /** Update visual style(s) */
  abstract normalDisplay(): void;
  abstract glowingDisplay(): void;
  abstract updateStyle(options: StyleOptions): void;

  /** Get the current style state of the Nodule */
  abstract currentStyleState(front: boolean): StyleOptions;
  /** Get the default style state of the Nodule */
  abstract defaultStyleState(front: boolean): StyleOptions;

  /** Set the temporary/glowing/default/updated style*/
  abstract stylize(flag: DisplayStyle): void;

  /** Hide the object if flag = false, set normalDisplay() if flag = true  */
  abstract setVisible(flag: boolean): void;

  /**
   * Update the display of the object called after all the necessary variables have been set so
   * an updated object will be rendered correctly
   */
  abstract updateDisplay(): void;

  //** Get the back contrasting style using the value of contrast */
  static contrastFillColor(frontColor: string): string {
    return frontColor;
  }
  static contrastStrokeColor(frontColor: string): string {
    return frontColor;
  }

  static contrastOpacity(frontOpacity: number): number {
    return SETTINGS.contrast * frontOpacity;
  }

  static contrastStrokeWidthPercent(frontPercent: number): number {
    return frontPercent;
  }
  static contrastPointRadiusPercent(frontPercent: number): number {
    return frontPercent;
  }
}

/** @format */

// import SETTINGS from "@/global-settings";
import SETTINGS from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import {
  StyleOptions,
  StyleEditPanels,
  DEFAULT_NONFREEPOINT_FRONT_STYLE,
  DEFAULT_NONFREEPOINT_BACK_STYLE
} from "@/types/Styles";
import Point from "@/plottables/Point";

/**
 * Each Point object is uniquely associated with a SEPoint object.
 * As part of plottables, Point concerns mainly with the visual appearance, but
 * SEPoint concerns mainly with geometry computations.
 */

export default class NonFreePoint extends Point {
  /**
   * non free points are smaller by nonFreePointScalePercent
   */
  private nonFreePointScalePercent = SETTINGS.point.nonFree.scalePercent;

  constructor() {
    super();
    // Now apply the new style and size
    this.stylize(DisplayStyle.ApplyCurrentVariables);
    this.adjustSize();
    this.styleOptions.set(
      StyleEditPanels.Front,
      DEFAULT_NONFREEPOINT_FRONT_STYLE
    );
    this.styleOptions.set(
      StyleEditPanels.Back,
      DEFAULT_NONFREEPOINT_BACK_STYLE
    );
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front:
        return DEFAULT_NONFREEPOINT_FRONT_STYLE;
      case StyleEditPanels.Back:
        if (SETTINGS.point.dynamicBackStyle)
          return {
            ...DEFAULT_NONFREEPOINT_BACK_STYLE,
            pointRadiusPercent: Nodule.contrastPointRadiusPercent(
              this.nonFreePointScalePercent
            ),
            strokeColor: Nodule.contrastStrokeColor(
              SETTINGS.point.nonFree.strokeColor.front
            ),
            fillColor: Nodule.contrastFillColor(
              SETTINGS.point.nonFree.fillColor.front
            )
          };
        else return DEFAULT_NONFREEPOINT_BACK_STYLE;

      default:
        return {};
    }
  }
  /**
   * Sets the variables for point radius glowing/not
   */
  adjustSize(): void {
    const frontStyle = this.styleOptions.get(StyleEditPanels.Front);
    const backStyle = this.styleOptions.get(StyleEditPanels.Back);
    const radiusPercentFront = frontStyle?.pointRadiusPercent ?? 100;
    const radiusPercentBack = backStyle?.pointRadiusPercent ?? 90;
    this.frontPoint.scale =
      ((Point.pointScaleFactor * radiusPercentFront) / 100) *
      (this.nonFreePointScalePercent / 100);

    this.backPoint.scale =
      (((Point.pointScaleFactor * this.nonFreePointScalePercent) / 100) *
        (backStyle?.dynamicBackStyle ?? false
          ? Nodule.contrastPointRadiusPercent(radiusPercentFront)
          : radiusPercentBack)) /
      100;

    this.glowingFrontPoint.scale =
      (((Point.pointScaleFactor * this.nonFreePointScalePercent) / 100) *
        radiusPercentFront) /
      100;

    this.glowingBackPoint.scale =
      (((Point.pointScaleFactor * this.nonFreePointScalePercent) / 100) *
        (backStyle?.dynamicBackStyle ?? false
          ? Nodule.contrastStrokeWidthPercent(radiusPercentFront)
          : radiusPercentBack)) /
      100;
  }
}

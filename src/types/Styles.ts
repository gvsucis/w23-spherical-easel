export enum Styles {
  // Important: Be sure to include "Color" for enum member
  // that refers to Color property
  strokeWidthPercentage,
  strokeColor,
  fillColor,
  dashArray,
  dashOffset,
  opacity,
  dynamicBackStyle,
  pointRadiusPercent
}

export type StyleOptions = {
  front: boolean;
  strokeWidthPercent?: number;
  strokeColor?: string;
  fillColor?: string;
  dashArray?: number[];
  dashOffset?: number;
  opacity?: number;
  dynamicBackStyle?: boolean;
  pointRadiusPercent?: number;
};

import { Command } from "./Command";
import Nodule from "@/plottables/Nodule";
import { StyleOptions, StyleEditPanels } from "../types/Styles";

export class StyleNoduleCommand extends Command {
  private nodules: Nodule[] = [];
  private panel: StyleEditPanels;
  private currentStyles: StyleOptions[] = [];
  private pastStyles: StyleOptions[] = [];
  private currentBackStyleContrast: number | undefined;
  private pastBackStyleContrast: number | undefined;

  constructor(
    nodules: Nodule[],
    panel: StyleEditPanels,
    currentStyles: StyleOptions[],
    pastStyles: StyleOptions[],
    currentBackStyleContrast?: number,
    pastBackStyleContrast?: number
  ) {
    super();
    console.debug("Creating StyleNoduleCommand");
    this.nodules.push(...nodules);

    this.panel = panel;
    // Carefully clone so that we create new objects and no pointer from the inputs are carried to the variables of this command
    currentStyles.forEach(obj => {
      this.currentStyles.push({ ...obj });
    });
    pastStyles.forEach(obj => {
      this.pastStyles.push({ ...obj });
    });
    this.currentBackStyleContrast = currentBackStyleContrast;
    this.pastBackStyleContrast = pastBackStyleContrast;
  }

  do(): void {
    for (let i = 0; i < this.nodules.length; i++) {
      Command.store.changeStyle({
        selected: [this.nodules[i]],
        panel: this.panel,
        payload: {
          ...this.currentStyles[i]
        }
      });
    }
  }

  saveState(): void {
    this.lastState = 0;
  }

  restoreState(): void {
    for (let i = 0; i < this.nodules.length; i++) {
      console.debug(
        "Restore effect of StyleNoduleCommand to ",
        this.nodules[i],
        "with payload",
        this.pastStyles[i]
      );
      Command.store.changeStyle({
        selected: [this.nodules[i]],
        panel: this.panel,
        payload: {
          ...this.pastStyles[i]
        }
      });
    }
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}

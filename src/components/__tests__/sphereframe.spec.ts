import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "@/../tests/vue-helper";
import { SEStore } from "@/store";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
// import PointHandler from "@/eventHandlers/PointHandler";
import Vue from "vue";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { Vector3 } from "three";
import "@/../tests/jest-custom-matchers";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { Wrapper } from "@vue/test-utils";
import Point from "@/plottables/Point";
import Line from "@/plottables/Line";

/*
TODO: the test cases below create the object using newly created node.
Should we include test cases where the tools select existing objects
during the creation. For instance, when creating a line one of the endpoints 
is already on the sphere
*/
describe("SphereFrame.vue", () => {
  let wrapper: Wrapper<Vue>;
  beforeEach(async () => {
    // It is important to reset the actionMode back to subsequent
    // mutation to actionMode will trigger a Vue Watch update
    wrapper = createWrapper(SphereFrame);
    SEStore.init();
    SEStore.setActionMode({ id: "", name: "" });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("is an instance", () => {
    expect(wrapper.exists).toBeTruthy();
    expect(wrapper.isVueInstance).toBeTruthy();
  });

  it("has SVG element", () => {
    const canvas = wrapper.find("svg");
    expect(canvas.exists).toBeTruthy();
    expect(canvas).toBeDefined();
  });

  it("has TwoJS instance and midground layer", () => {
    expect(wrapper.vm.$data.twoInstance).toBeDefined();
    expect(wrapper.vm.$data.layers[LAYER.midground]).toBeDefined();
  });

  it("contains boundary circle of the right radius", () => {
    //   console.debug(wrapper.vm.$data.layers[LAYER.midground]);
    const midLayer = wrapper.vm.$data.layers[LAYER.midground];
    expect(midLayer.children.length).toBeGreaterThan(0);
    expect(midLayer.children[0]).toBeInstanceOf(Two.Circle);
    expect(midLayer.children[0]._radius).toEqual(
      SETTINGS.boundaryCircle.radius
    );
  });

  const TEST_MOUSE_X = 111;
  const TEST_MOUSE_Y = 137;

  async function drawPointAt(x: number, y: number, isBackground = false) {
    SEStore.setActionMode({
      id: "point",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    const target = wrapper.find("#canvas");
    expect(target.exists).toBeTruthy();

    await target.trigger("mousemove", {
      clientX: x,
      clientY: y,
      shiftKey: isBackground
    });
    expect(wrapper.vm.$data.currentTool.isOnSphere).toBeTruthy();
    await target.trigger("mousedown", {
      clientX: x,
      clientY: y,
      shiftKey: isBackground
    });
    await target.trigger("mouseup", {
      clientX: x,
      clientY: y,
      shiftKey: isBackground
    });
  }
  async function makePoint(isBackground: boolean): Promise<SEPoint> {
    await drawPointAt(TEST_MOUSE_X, TEST_MOUSE_Y, isBackground);
    const count = SEStore.sePoints.length;
    // The most recent point
    return SEStore.sePoints[count - 1] as SEPoint;
  }

  function constructSEPoint(
    x_screen: number,
    y_screen: number,
    isForeground: boolean
  ): SEPoint {
    const R = SETTINGS.boundaryCircle.radius;
    const zScreen =
      Math.sqrt(R * R - x_screen * x_screen - y_screen * y_screen) *
      (isForeground ? +1 : -1);
    const p = new SEPoint(new Point());
    const pos = new Vector3(x_screen, y_screen, zScreen).normalize();
    p.locationVector.copy(pos);
    return p;
  }

  describe("with PointTool", () => {
    // it("switches to point tool", async () => {
    //   SEStore.setActionMode({
    //     id: "point",
    //     name: "PointTool"
    //   });
    //   await wrapper.vm.$nextTick();
    //   expect(wrapper.vm.$data.currentTool).toBeInstanceOf(PointHandler);
    // });
    beforeEach(async () => {
      SEStore.setActionMode({
        id: "point",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
    });

    it("adds a new (foreground) point when clicking on sphere while using PointTool", async () => {
      const prevPointCount = SEStore.sePoints.length;
      const p = await makePoint(false /* foreground point */);
      expect(SEStore.sePoints.length).toBe(prevPointCount + 1);
      expect(p.locationVector.z).toBeGreaterThan(0);
    });
    it("adds a new (background) point when clicking on sphere while using PointTool", async () => {
      const prevPointCount = SEStore.sePoints.length;
      const p = await makePoint(true /* back ground point */);
      expect(SEStore.sePoints.length).toBe(prevPointCount + 1);
      expect(p.locationVector.z).toBeLessThan(0);
    });
  });

  async function dragMouse(
    fromX: number,
    fromY: number,
    fromBg: boolean,
    toX: number,
    toY: number,
    toBg: boolean
  ): Promise<void> {
    const target = wrapper.find("#canvas");
    expect(target.exists).toBeTruthy();
    await target.trigger("mousemove", {
      clientX: fromX,
      clientY: fromY,
      shiftKey: fromBg
    });
    console.debug("Mouse pressed at", fromX, fromY);
    await target.trigger("mousedown", {
      clientX: fromX,
      clientY: fromY,
      shiftKey: fromBg
    });
    await target.trigger("mousemove", {
      clientX: toX,
      clientY: toY,
      shiftKey: toBg
    });
    console.debug("Mouse release at", toX, toY);
    await target.trigger("mouseup", {
      clientX: toX,
      clientY: toY,
      shiftKey: toBg
    });
    return await wrapper.vm.$nextTick();
  }

  async function drawLine(
    x1: number,
    y1: number,
    isPoint1Foreground: boolean,
    x2: number,
    y2: number,
    isPoint2Foreground: boolean
  ): Promise<void> {
    SEStore.setActionMode({
      id: "line",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    await dragMouse(x1, y1, !isPoint1Foreground, x2, y2, !isPoint2Foreground);
  }

  describe("with LineTool", () => {
    async function runLineTest(
      isPoint1Foreground: boolean,
      isPoint2Foreground: boolean
    ): Promise<void> {
      const endX = TEST_MOUSE_X + 10;
      const endY = TEST_MOUSE_Y - 10;
      const prevLineCount = SEStore.seLines.length;
      await drawLine(
        TEST_MOUSE_X,
        TEST_MOUSE_Y,
        isPoint1Foreground,
        endX,
        endY,
        isPoint2Foreground
      );
      const newLineCount = SEStore.seLines.length;
      expect(newLineCount).toBe(prevLineCount + 1);
      const R = SETTINGS.boundaryCircle.radius;
      const startZCoord =
        Math.sqrt(
          R * R - TEST_MOUSE_X * TEST_MOUSE_X - TEST_MOUSE_Y * TEST_MOUSE_Y
        ) * (isPoint1Foreground ? +1 : -1);
      const endZCoord =
        Math.sqrt(R * R - endX * endX - endY * endY) *
        (isPoint2Foreground ? +1 : -1);
      const newLine: SELine = SEStore.seLines[prevLineCount];
      // Start vector
      const startVector = new Vector3(
        TEST_MOUSE_X,
        -TEST_MOUSE_Y, // Must flip the Y coordinate
        startZCoord
      ).normalize();
      // End vector is foreground
      const endVector = new Vector3(endX, -endY, endZCoord).normalize();
      const dir = new Vector3()
        .crossVectors(startVector, endVector)
        .normalize();
      expect(newLine.startSEPoint.locationVector).toBeVector3CloseTo(
        startVector,
        3
      );
      expect(newLine.endSEPoint.locationVector).toBeVector3CloseTo(
        endVector,
        3
      );
      expect(newLine.normalVector).toBeVector3CloseTo(dir, 3);
    }
    it("adds a new line (fg/fg) while in LineTool", async () => {
      await runLineTest(true, true);
    });
    it("adds a new line (fg/bg) while in LineTool", async () => {
      await runLineTest(true, false);
    });
    it("adds a new line (bg/bg) while in LineTool", async () => {
      await runLineTest(false, false);
    });
    it("adds a new line (bg/fg) while in LineTool", async () => {
      await runLineTest(false, true);
    });
  });

  describe("with SegmentTool", () => {
    async function runSegmentTest(
      isPoint1Foreground: boolean,
      isPoint2Foreground: boolean
    ): Promise<void> {
      SEStore.setActionMode({
        id: "segment",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      const endX = TEST_MOUSE_X + 10;
      const endY = TEST_MOUSE_Y - 10;
      const prevSegmentCount = SEStore.seSegments.length;
      await dragMouse(
        TEST_MOUSE_X,
        TEST_MOUSE_Y,
        !isPoint1Foreground,
        endX,
        endY,
        !isPoint2Foreground
      );
      // await wrapper.vm.$nextTick();
      const newSegmentCount = SEStore.seSegments.length;
      expect(newSegmentCount).toBe(prevSegmentCount + 1);
      const R = SETTINGS.boundaryCircle.radius;
      const startZCoord =
        Math.sqrt(
          R * R - TEST_MOUSE_X * TEST_MOUSE_X - TEST_MOUSE_Y * TEST_MOUSE_Y
        ) * (isPoint1Foreground ? +1 : -1);
      const endZCoord =
        Math.sqrt(R * R - endX * endX - endY * endY) *
        (isPoint2Foreground ? +1 : -1);
      const newSegment: SESegment = SEStore.seSegments[prevSegmentCount];
      // Start vector
      const startVector = new Vector3(
        TEST_MOUSE_X,
        -TEST_MOUSE_Y,
        startZCoord
      ).normalize();
      // End vector
      const endVector = new Vector3(endX, -endY, endZCoord).normalize();
      const dir = new Vector3()
        .crossVectors(startVector, endVector)
        .normalize();
      expect(newSegment.startSEPoint.locationVector).toBeVector3CloseTo(
        startVector,
        3
      );
      expect(newSegment.endSEPoint.locationVector).toBeVector3CloseTo(
        endVector,
        3
      );
      expect(newSegment.normalVector).toBeVector3CloseTo(dir, 3);
    }

    it("adds a new segment (fg/fg) while in SegmentTool", async () => {
      await runSegmentTest(true, true);
    });
    it("adds a new segment (fg/bg) while in SegmentTool", async () => {
      await runSegmentTest(true, false);
    });
    it("adds a new segment (bg/fg) while in SegmentTool", async () => {
      await runSegmentTest(false, true);
    });
    it("adds a new segment (bg/bg) while in SegmentTool", async () => {
      await runSegmentTest(false, false);
    });
  });

  describe("with CircleTool", () => {
    async function runCircleTest(
      isPoint1Foreground: boolean,
      isPoint2Foreground: boolean
    ): Promise<void> {
      SEStore.setActionMode({
        id: "circle",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      const endX = TEST_MOUSE_X + 10;
      const endY = TEST_MOUSE_Y - 10;
      const prevCircleCount = SEStore.seCircles.length;
      await dragMouse(
        TEST_MOUSE_X,
        TEST_MOUSE_Y,
        !isPoint1Foreground,
        endX,
        endY,
        !isPoint2Foreground
      );
      // await wrapper.vm.$nextTick();
      const newCircleCount = SEStore.seCircles.length;
      expect(newCircleCount).toBe(prevCircleCount + 1);
      const R = SETTINGS.boundaryCircle.radius;
      const startZCoord =
        Math.sqrt(
          R * R - TEST_MOUSE_X * TEST_MOUSE_X - TEST_MOUSE_Y * TEST_MOUSE_Y
        ) * (isPoint1Foreground ? +1 : -1);
      const endZCoord =
        Math.sqrt(R * R - endX * endX - endY * endY) *
        (isPoint2Foreground ? +1 : -1);
      const newCircle: SECircle = SEStore.seCircles[prevCircleCount];
      // Center vector is foreground
      const centerVector = new Vector3(
        TEST_MOUSE_X,
        -TEST_MOUSE_Y,
        startZCoord
      ).normalize();
      // Radius vector is foreground
      const radiusVector = new Vector3(endX, -endY, endZCoord).normalize();
      expect(newCircle.centerSEPoint.locationVector).toBeVector3CloseTo(
        centerVector,
        3
      );
      expect(newCircle.circleSEPoint.locationVector).toBeVector3CloseTo(
        radiusVector,
        3
      );
    }
    it("adds a new circle (fg/fg) while in CircleTool", async () => {
      await runCircleTest(true, true);
    });
    it("adds a new circle (fg/bg) while in CircleTool", async () => {
      await runCircleTest(true, false);
    });
    it("adds a new circle (bg/fg) while in CircleTool", async () => {
      await runCircleTest(false, true);
    });
    it("adds a new circle (bg/bg) while in CircleTool", async () => {
      await runCircleTest(false, false);
    });
  });

  describe("with AntipodalPoint tool", () => {
    async function runAntipodeTest(isForeground: boolean) {
      const prevPointCount = SEStore.sePoints.length;
      const p = await makePoint(isForeground);
      expect(SEStore.sePoints.length).toBe(prevPointCount + 2);
      const a = SEStore.sePoints[prevPointCount];
      const b = SEStore.sePoints[prevPointCount + 1];
      expect(a.locationVector.x).toBe(-b.locationVector.x);
      expect(a.locationVector.y).toBe(-b.locationVector.y);
      expect(a.locationVector.z).toBe(-b.locationVector.z);
    }
    beforeEach(async () => {
      SEStore.setActionMode({
        id: "antipodalPoint",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
    });

    it("adds a new (foreground) point and its antipodal when clicking on sphere while using PointTool", async () => {
      await runAntipodeTest(true);
    });

    it("adds a new (background) point and its antipodal when clicking on sphere while using PointTool", async () => {
      // const prevPointCount = SEStore.sePoints.length;
      // const p = await makePoint(true /* back ground point */);
      // expect(SEStore.sePoints.length).toBe(prevPointCount + 2);
      // const a = SEStore.sePoints[prevPointCount];
      // const b = SEStore.sePoints[prevPointCount + 1];
      // expect(a.locationVector.x).toBe(-b.locationVector.x);
      // expect(a.locationVector.y).toBe(-b.locationVector.y);
      // expect(a.locationVector.z).toBe(-b.locationVector.z);
      await runAntipodeTest(false);
    });
  });

  describe.only("With Perpendicular Tool", () => {
    async function clickAt(x: number, y: number, withShift = false) {
      const target = wrapper.find("#canvas");

      await target.trigger("mousemove", {
        clientX: x,
        clientY: y,
        shiftKey: withShift
      });
      await target.trigger("mousedown", {
        clientX: x,
        clientY: y,
        shiftKey: withShift
      });
      await target.trigger("mouseup", {
        clientX: x,
        clientY: y,
        shiftKey: withShift
      });
    }
    beforeEach(async () => {
      SEStore.init();
      SEStore.setActionMode({
        id: "perpendicular",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
    });
    async function runPerpendicularToLIneTest(
      foregroundPoint: boolean
    ): Promise<void> {
      const lineCount = SEStore.seLines.length;
      await drawLine(150, 170, true, 113, 200, true);
      expect(SEStore.seLines.length).toBe(lineCount + 1);

      const pointCount = SEStore.sePoints.length;
      await drawPointAt(61, 93, !foregroundPoint);
      const aPoint = SEStore.sePoints[pointCount];
      console.debug("Thru point at", aPoint.locationVector.toFixed(3));
      // SEStore.addPoint(aPoint);
      expect(SEStore.sePoints.length).toBe(pointCount + 1);
      SEStore.setActionMode({
        id: "perpendicular",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      await clickAt(61, 93); // Select the point
      await clickAt(150, 170); // select the line

      expect(SEStore.seLines.length).toBeGreaterThanOrEqual(lineCount + 2);
    }
    it("adds a line thru a foreground point perpendicular to another line", async () => {
      await runPerpendicularToLIneTest(true);
      // const names = SEStore.seLines
      //   .map((ln: SELine) => ln.noduleDescription)
      //   .join("\n");
      // console.log("Lines", names);
    });
    it("adds a line thru a background point perpendicular to another line", async () => {
      await runPerpendicularToLIneTest(false);
    });
  });
});

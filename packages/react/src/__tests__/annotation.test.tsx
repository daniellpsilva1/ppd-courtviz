import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { CalloutCircle, ZonePercentage, InsightLabel, ArrowAnnotation } from "../annotation";
import { ppd } from "@courtviz/themes";

describe("Annotation primitives", () => {
  it("renders CalloutCircle", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CalloutCircle, { cx: 100, cy: 200, theme: ppd }),
    );
    expect(markup).toContain("circle");
    expect(markup).toContain(ppd.playerHost);
  });

  it("renders ZonePercentage badge", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ZonePercentage, { percentage: 81, theme: ppd, x: 50, y: 50 }),
    );
    expect(markup).toContain("81%");
  });

  it("renders InsightLabel in uppercase", () => {
    const markup = renderToStaticMarkup(
      React.createElement(InsightLabel, {
        anchorX: 10,
        anchorY: 20,
        text: "wide serve",
        theme: ppd,
        x: 80,
        y: 40,
      }),
    );
    expect(markup).toContain("WIDE SERVE");
  });

  it("renders ArrowAnnotation", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ArrowAnnotation, { theme: ppd, x1: 0, x2: 50, y1: 0, y2: 50 }),
    );
    expect(markup).toContain("polygon");
    expect(markup).toContain("line");
  });
});

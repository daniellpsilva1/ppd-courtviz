import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { FigureFrame } from "../figure-frame";
import { ppd } from "@courtviz/themes";

describe("FigureFrame", () => {
  it("renders an svg with title and subtitle", () => {
    const markup = renderToStaticMarkup(
      React.createElement(FigureFrame, {
        format: "square",
        subtitle: "Test subtitle",
        theme: ppd,
        title: "Test Title",
      }),
    );
    expect(markup).toContain("Test Title");
    expect(markup).toContain("Test subtitle");
    expect(markup).toContain("<svg");
  });

  it("renders source note when provided", () => {
    const markup = renderToStaticMarkup(
      React.createElement(FigureFrame, {
        format: "square",
        source: "Data source",
        theme: ppd,
        title: "Title",
      }),
    );
    expect(markup).toContain("Data source");
  });

  it("renders branding footer when branding prop is set", () => {
    const markup = renderToStaticMarkup(
      React.createElement(FigureFrame, {
        branding: { logo: true, handle: "@peakperformancedata" },
        format: "square",
        theme: ppd,
        title: "Title",
      }),
    );
    expect(markup).toContain("figure-branding-footer");
    expect(markup).toContain("@peakperformancedata");
    expect(markup).toContain("PPD");
  });

  it("renders children inside content area", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        FigureFrame,
        { format: "square", theme: ppd, title: "Title" },
        React.createElement("rect", { height: 100, width: 100, x: 50, y: 50 }),
      ),
    );
    expect(markup).toContain("rect");
  });

  it("supports landscape format layout", () => {
    const markup = renderToStaticMarkup(
      React.createElement(FigureFrame, {
        format: "landscape",
        theme: ppd,
        title: "Landscape Title",
      }),
    );
    expect(markup).toContain('viewBox="0 0 1920 1080"');
    expect(markup).toContain("Landscape Title");
  });
});

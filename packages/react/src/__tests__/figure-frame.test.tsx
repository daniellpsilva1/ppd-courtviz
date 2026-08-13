import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { socialFormats } from "@ppd/tokens";
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
    expect(markup).toContain("brand-mark-icon");
  });

  it("renders logo image when logoHref is provided", () => {
    const markup = renderToStaticMarkup(
      React.createElement(FigureFrame, {
        branding: { logo: true, handle: "@peakperformancedata", logoHref: "data:image/png;base64,abc" },
        format: "square",
        theme: ppd,
        title: "Title",
      }),
    );
    expect(markup).toContain("figure-branding-footer");
    expect(markup).toContain("<image");
    expect(markup).toContain("data:image/png;base64,abc");
    expect(markup).not.toContain("brand-mark-monogram");
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

  it("suppresses branding footer when showBrandingFooter is false", () => {
    const markup = renderToStaticMarkup(
      React.createElement(FigureFrame, {
        branding: { logo: true, handle: "@peakperformancedata", source: "Source line" },
        format: "square",
        showBrandingFooter: false,
        theme: ppd,
        title: "Title",
      }),
    );
    expect(markup).not.toContain("figure-branding-footer");
    expect(markup).not.toContain("@peakperformancedata");
    expect(markup).toContain("Source line");
  });

  it("renders slide index pagination when slideIndex and slideCount are provided", () => {
    const markup = renderToStaticMarkup(
      React.createElement(FigureFrame, {
        format: "square",
        slideCount: 10,
        slideIndex: 2,
        theme: ppd,
        title: "Title",
      }),
    );
    expect(markup).toContain("3 / 10");
  });

  it("keeps portrait slide index inside the safe area (above IG bottom chrome)", () => {
    const markup = renderToStaticMarkup(
      React.createElement(FigureFrame, {
        branding: { handle: "@peakperformancedata", logo: true },
        format: "portrait",
        slideCount: 10,
        slideIndex: 2,
        theme: ppd,
        title: "Title",
      }),
    );
    const tag = markup.match(/data-testid="figure-slide-index"[^>]*>/)?.[0] ?? "";
    const y = Number(tag.match(/\sy="(\d+(?:\.\d+)?)"/)?.[1] ?? NaN);
    const portrait = socialFormats.portrait;
    const safeBottomEdge = portrait.height - portrait.safeArea.bottom;
    // Must clear IG feed chrome (safe bottom), not the old padding-based y
    expect(y).toBeLessThanOrEqual(safeBottomEdge);
    expect(y).toBeLessThan(portrait.height - 40 * 0.5);
    expect(markup).toContain("3 / 10");
  });

  it("does not reserve phantom title height when title is omitted", () => {
    const withTitle = renderToStaticMarkup(
      React.createElement(
        FigureFrame,
        { format: "portrait", theme: ppd, title: "Has Title", id: "with-title" },
        React.createElement("g", { id: "content-with-title" }),
      ),
    );
    const withoutTitle = renderToStaticMarkup(
      React.createElement(
        FigureFrame,
        { format: "portrait", theme: ppd, id: "no-title" },
        React.createElement("g", { id: "content-no-title" }),
      ),
    );

    const titledY = Number(withTitle.match(/translate\((\d+(?:\.\d+)?) (\d+(?:\.\d+)?)\)/)?.[2] ?? NaN);
    const untitledY = Number(withoutTitle.match(/translate\((\d+(?:\.\d+)?) (\d+(?:\.\d+)?)\)/)?.[2] ?? NaN);

    expect(untitledY).toBeLessThan(titledY);
    // Portrait safe top is 48; untitled content should start at the safe inset, not +100.
    expect(untitledY).toBe(48);
  });
});

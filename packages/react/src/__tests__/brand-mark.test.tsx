import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { BrandMark } from "../brand-mark";
import { ppd } from "@courtviz/themes";

describe("BrandMark", () => {
  it("renders monogram variant with logo icon", () => {
    const markup = renderToStaticMarkup(
      React.createElement(BrandMark, { theme: ppd, variant: "monogram" }),
    );
    expect(markup).toContain("brand-mark-monogram");
    expect(markup).toContain("brand-mark-icon");
    expect(markup).toContain("circle");
  });

  it("renders lockup variant with wordmark", () => {
    const markup = renderToStaticMarkup(
      React.createElement(BrandMark, { theme: ppd, variant: "lockup" }),
    );
    expect(markup).toContain("PEAK PERFORMANCE");
    expect(markup).toContain("DATA");
    expect(markup).toContain("brand-mark-lockup");
  });
});

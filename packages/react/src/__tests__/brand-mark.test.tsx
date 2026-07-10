import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { BrandMark } from "../brand-mark";
import { ppd } from "@courtviz/themes";

describe("BrandMark", () => {
  it("renders monogram variant", () => {
    const markup = renderToStaticMarkup(
      React.createElement(BrandMark, { theme: ppd, variant: "monogram" }),
    );
    expect(markup).toContain("PPD");
    expect(markup).toContain("brand-mark-monogram");
  });

  it("renders lockup variant", () => {
    const markup = renderToStaticMarkup(
      React.createElement(BrandMark, { theme: ppd, variant: "lockup" }),
    );
    expect(markup).toContain("PEAK PERFORMANCE");
    expect(markup).toContain("brand-mark-lockup");
  });
});

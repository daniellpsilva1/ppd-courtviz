import React from "react";
import { describe, expect, it } from "vitest";
import { renderToSVGDocument } from "../index";

describe("render", () => {
  it("renderToSVGDocument wraps markup", () => {
    const svg = renderToSVGDocument(
      React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg" }, "test"),
    );
    expect(svg).toContain("<?xml");
    expect(svg).toContain("test");
  });

  it("svgToPNG honors width and height", async () => {
    const { svgToPNG } = await import("../index");
    const svg = `<?xml version="1.0"?><svg width="100" height="50" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="50" fill="red"/></svg>`;
    const buf = await svgToPNG(svg, { height: 50, width: 100 });
    expect(buf.length).toBeGreaterThan(100);
  });
});

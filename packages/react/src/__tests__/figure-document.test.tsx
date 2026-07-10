import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { toCourtvizTheme } from "@ppd/brand";
import { FigureDocument } from "../figure-document";

describe("FigureDocument", () => {
  it("renders editorial a11y attributes by default", () => {
    const html = renderToStaticMarkup(
      <FigureDocument
        accessibleSummary="Court heatmap summary"
        height={800}
        id="fig-1"
        title="Test figure"
        width={600}
      >
        <rect fill="red" height={10} width={10} />
      </FigureDocument>,
    );
    expect(html).toContain('role="img"');
    expect(html).toContain("Court heatmap summary");
    expect(html).toContain(toCourtvizTheme("editorial").background);
  });
});

import { describe, expect, it } from "vitest";
import { fitTextOnNLines, measureSvgText, truncateText, wrapText } from "../text-measure";

const fontOpts = { fontFamily: "Inter", fontSize: 16 };

describe("text-measure", () => {
  describe("measureSvgText", () => {
    it("returns positive width for non-empty string", () => {
      const w = measureSvgText("Hello world", fontOpts);
      expect(w).toBeGreaterThan(0);
    });

    it("returns 0 for empty string", () => {
      expect(measureSvgText("", fontOpts)).toBe(0);
    });

    it("scales with font size", () => {
      const small = measureSvgText("Test", { fontFamily: "Inter", fontSize: 10 });
      const large = measureSvgText("Test", { fontFamily: "Inter", fontSize: 24 });
      expect(large).toBeGreaterThan(small);
    });
  });

  describe("wrapText", () => {
    it("wraps text that exceeds maxWidth into multiple lines", () => {
      const lines = wrapText("This is a long sentence that should wrap", {
        ...fontOpts,
        maxWidth: 100,
      });
      expect(lines.length).toBeGreaterThan(1);
    });

    it("keeps short text on a single line", () => {
      const lines = wrapText("Short", { ...fontOpts, maxWidth: 200 });
      expect(lines).toHaveLength(1);
    });
  });

  describe("truncateText", () => {
    it("returns original text if it fits within maxWidth", () => {
      const result = truncateText("Short", { ...fontOpts, maxWidth: 200 });
      expect(result).toBe("Short");
    });

    it("truncates and adds ellipsis when text exceeds maxWidth", () => {
      const result = truncateText("This is a very long text that definitely won't fit", {
        ...fontOpts,
        maxWidth: 50,
      });
      expect(result.length).toBeLessThan("This is a very long text that definitely won't fit".length);
      expect(result.endsWith("…")).toBe(true);
    });
  });

  describe("fitTextOnNLines", () => {
    it("returns original text on one line if it fits", () => {
      const result = fitTextOnNLines("Short text", {
        ...fontOpts,
        maxWidth: 200,
        maxLines: 3,
      });
      expect(result.lines).toHaveLength(1);
      expect(result.lines[0]).toBe("Short text");
    });

    it("wraps into multiple lines when needed", () => {
      const result = fitTextOnNLines(
        "This is a moderately long sentence that should wrap across multiple lines",
        { ...fontOpts, maxWidth: 120, maxLines: 3 },
      );
      expect(result.lines.length).toBeGreaterThan(1);
      expect(result.lines.length).toBeLessThanOrEqual(3);
    });
  });
});

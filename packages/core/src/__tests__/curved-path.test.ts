import { describe, expect, it } from "vitest";
import { curvedPath, parseQuadraticPath } from "../curved-path";

describe("curvedPath", () => {
  it("separates control and end coordinates so fractional pixels do not merge", () => {
    const d = curvedPath(310.4, 512.7, 180.2, 340.1, 0.04, {
      xMin: 50,
      xMax: 490,
      yMin: 40,
      yMax: 520,
    });

    expect(d).toContain(" Q");
    expect(d).toMatch(/ Q[-\d.]+,[-\d.]+ [-\d.]+,[-\d.]+$/);

    const parsed = parseQuadraticPath(d);
    expect(parsed.x1).toBeCloseTo(310.4);
    expect(parsed.y1).toBeCloseTo(512.7);
    expect(parsed.x2).toBeCloseTo(180.2);
    expect(parsed.y2).toBeCloseTo(340.1);
    expect(parsed.cx).toBeGreaterThan(50);
    expect(parsed.cx).toBeLessThan(490);
  });

  it("returns a straight segment for zero-length input", () => {
    expect(curvedPath(10, 20, 10, 20)).toBe("M10,20L10,20");
  });
});

import { describe, expect, it } from "vitest";
import { courtCenterY, courtToThree } from "../court-to-three";

describe("courtToThree", () => {
  it("maps court x/y to x/z with y as height", () => {
    expect(courtToThree(1, 5)).toEqual([1, 0.03, 5]);
    expect(courtToThree(0, 0, 0.1)).toEqual([0, 0.1, 0]);
  });

  it("returns near-half center z", () => {
    expect(courtCenterY("near")).toBeCloseTo(5.9425);
  });
});

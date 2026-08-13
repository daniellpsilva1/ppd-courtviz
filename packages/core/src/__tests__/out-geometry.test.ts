import { describe, expect, it } from "vitest";
import {
  COURT_LENGTH,
  DOUBLES_HALF,
  SINGLES_HALF,
} from "../geometry";
import {
  classifyOutBounce,
  shouldPlotOutError,
} from "../out-geometry";

describe("classifyOutBounce", () => {
  it("flags clear in-court bounce as in_court", () => {
    expect(classifyOutBounce(1.643, 14.281)).toBe("in_court");
  });

  it("treats alley landings as alley (singles out)", () => {
    expect(classifyOutBounce(-(SINGLES_HALF + 0.3), 20)).toBe("alley");
    expect(classifyOutBounce(SINGLES_HALF + 0.2, 5)).toBe("alley");
  });

  it("classifies past-baseline as long", () => {
    expect(classifyOutBounce(-2, -0.5)).toBe("long");
    expect(classifyOutBounce(1, COURT_LENGTH + 0.4)).toBe("long");
  });

  it("classifies past doubles sideline as wide", () => {
    expect(classifyOutBounce(-(DOUBLES_HALF + 0.4), 15)).toBe("wide");
  });

  it("classifies corner outs", () => {
    expect(classifyOutBounce(DOUBLES_HALF + 0.5, COURT_LENGTH + 0.5)).toBe("corner");
  });

  it("drops far tracking junk", () => {
    expect(classifyOutBounce(0, COURT_LENGTH + 3)).toBe("far");
    expect(classifyOutBounce(DOUBLES_HALF + 3, 12)).toBe("far");
  });

  it("does not expand inside with a large line tolerance", () => {
    // Barely past baseline is a true long out, not in_court.
    expect(classifyOutBounce(0.038, COURT_LENGTH + 0.05)).toBe("long");
  });
});

describe("shouldPlotOutError", () => {
  it("rejects null coords and in_court", () => {
    expect(shouldPlotOutError(null, 10)).toBe(false);
    expect(shouldPlotOutError(1, 14)).toBe(false);
  });

  it("keeps alley / long / wide", () => {
    expect(shouldPlotOutError(-(SINGLES_HALF + 0.3), 20)).toBe(true);
    expect(shouldPlotOutError(-2, -0.5)).toBe(true);
    expect(shouldPlotOutError(-(DOUBLES_HALF + 0.4), 15)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import {
  chartPalette,
  contrastRatio,
  motionTokens,
  semanticColors,
  signatureDevices,
  sportColors,
  tokens,
} from "../index";

describe("@ppd/tokens", () => {
  it("exports a complete token object", () => {
    expect(tokens.primitives.primary).toBe("#2563EB");
    expect(tokens.brand.handle).toBe("@peakperformancedata");
    expect(tokens.social.square.width).toBe(1080);
    expect(tokens.typography.families.condensed).toBe("Barlow Condensed");
    expect(tokens.primitives.marketing).toBe("#0047FF");
  });

  it("defines chart palette with six colors", () => {
    expect(chartPalette).toHaveLength(6);
  });

  it("defines all court surface colors", () => {
    expect(sportColors.surface.clay).toBeDefined();
    expect(sportColors.surface.hard).toBeDefined();
    expect(sportColors.surface.grass).toBeDefined();
  });

  it("meets minimum contrast for ink on dark background", () => {
    const ratio = contrastRatio(
      semanticColors.dark.ink,
      semanticColors.dark.background,
    );
    expect(ratio).toBeGreaterThan(7);
  });

  it("defines all social format presets", () => {
    expect(tokens.social.square.aspectRatio).toBe("1:1");
    expect(tokens.social.portrait.aspectRatio).toBe("4:5");
    expect(tokens.social.story.aspectRatio).toBe("9:16");
    expect(tokens.social.landscape.aspectRatio).toBe("16:9");
  });

  it("defines motion spring presets with required damping", () => {
    expect(motionTokens.springs.snappy.damping).toBe(200);
    expect(motionTokens.springs.smooth.damping).toBe(28);
    expect(motionTokens.springs.bouncy.damping).toBe(14);
    expect(motionTokens.springs.gentle.damping).toBe(18);
  });

  it("defines motion duration tokens in frames", () => {
    expect(motionTokens.durations.fastFrames).toBeGreaterThan(0);
    expect(motionTokens.durations.normalFrames).toBeGreaterThan(motionTokens.durations.fastFrames);
    expect(motionTokens.durations.slowFrames).toBeGreaterThan(motionTokens.durations.normalFrames);
    expect(motionTokens.durations.stingerFrames).toBeGreaterThan(motionTokens.durations.slowFrames);
  });

  it("defines motion easing curves as cubic-bezier arrays", () => {
    expect(motionTokens.easing.courtLine).toHaveLength(4);
    expect(motionTokens.easing.baselineSweep).toHaveLength(4);
    expect(motionTokens.easing.easeOutExpo).toHaveLength(4);
  });

  it("defines signature graphic devices", () => {
    expect(signatureDevices.baselineRule.height).toBeGreaterThan(0);
    expect(signatureDevices.baselineRule.accentWidth).toBeGreaterThan(0);
    expect(signatureDevices.baselineRule.accentWidth).toBeLessThanOrEqual(1);
    expect(signatureDevices.cornerNotch.size).toBeGreaterThan(0);
  });
});

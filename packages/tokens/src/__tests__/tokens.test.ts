import { describe, expect, it } from "vitest";
import {
  chartPalette,
  contrastRatio,
  semanticColors,
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
});

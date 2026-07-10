import { describe, expect, it } from "vitest";
import { toCourtvizTheme } from "../adapters/courtviz-theme";
import { semanticColors } from "@ppd/tokens";

describe("toCourtvizTheme", () => {
  it("maps editorial mode to PPD light palette", () => {
    const theme = toCourtvizTheme("editorial");
    expect(theme.name).toBe("ppd-editorial");
    expect(theme.background).toBe(semanticColors.light.surface);
    expect(theme.ink).toBe("#0F172A");
  });

  it("maps product mode with PPD dark shell", () => {
    const theme = toCourtvizTheme("product");
    expect(theme.border).toBeTruthy();
    expect(theme.background).toBe(semanticColors.dark.background);
  });

  it("maps broadcast mode", () => {
    const theme = toCourtvizTheme("broadcast");
    expect(theme.name).toBe("ppd-broadcast");
    expect(theme.brand?.handle).toBeTruthy();
  });
});

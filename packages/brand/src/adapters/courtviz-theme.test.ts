import { describe, expect, it } from "vitest";
import { toCourtvizTheme } from "../adapters/courtviz-theme";

describe("toCourtvizTheme", () => {
  it("maps editorial mode to warm paper", () => {
    const theme = toCourtvizTheme("editorial");
    expect(theme.name).toBe("ppd-editorial");
    expect(theme.background).toBe("#F7F3EB");
  });

  it("maps product mode with border", () => {
    const theme = toCourtvizTheme("product");
    expect(theme.border).toBeTruthy();
    expect(theme.background).toBe("#0E1117");
  });

  it("maps broadcast mode", () => {
    const theme = toCourtvizTheme("broadcast");
    expect(theme.name).toBe("ppd-broadcast");
    expect(theme.brand?.handle).toBeTruthy();
  });
});

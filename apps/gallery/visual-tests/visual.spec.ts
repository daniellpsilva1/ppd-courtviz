import { test, expect, type Page } from "@playwright/test";

const stories = [
  { id: "court--court-matrix", name: "court-matrix" },
  { id: "court--full-court-clay", name: "full-court-clay" },
  { id: "court--full-court-hard", name: "full-court-hard" },
  { id: "court--full-court-grass", name: "full-court-grass" },
  { id: "court--half-court-clay", name: "half-court-clay" },
  { id: "court--dark-theme-court", name: "dark-theme-court" },
  { id: "court--broadcast-court", name: "broadcast-court" },
  { id: "court--landscape-court", name: "landscape-court" },
  { id: "hexbin--bounce-hexmap-host", name: "bounce-hexmap-host" },
  { id: "hexbin--bounce-hexmap-speed", name: "bounce-hexmap-speed" },
  { id: "hexbin--bounce-hexmap-guest", name: "bounce-hexmap-guest" },
  { id: "hexbin--hexmap-dark-theme", name: "hexmap-dark-theme" },
  { id: "hexbin--hexmap-all-themes", name: "hexmap-all-themes" },
  { id: "momentum--momentum-full", name: "momentum-full" },
  { id: "momentum--momentum-dark", name: "momentum-dark" },
  { id: "momentum--momentum-compact", name: "momentum-compact" },
  { id: "momentum--color-bar-efficiency", name: "color-bar-efficiency" },
  { id: "density--density-host", name: "density-host" },
  { id: "density--density-guest", name: "density-guest" },
  { id: "density--density-with-annotation", name: "density-with-annotation" },
  { id: "density--density-dark-theme", name: "density-dark-theme" },
];

async function screenshotStory(page: Page, storyId: string, name: string) {
  await page.goto(`/?story=${storyId}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  const ladleMain = page.locator("[data-testid='ladle-main']").or(page.locator("main"));
  await expect(ladleMain).toHaveScreenshot(`${name}.png`);
}

for (const story of stories) {
  test(`visual: ${story.name}`, async ({ page }) => {
    await screenshotStory(page, story.id, story.name);
  });
}

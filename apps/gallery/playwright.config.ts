import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
    },
  },
  outputDir: "visual-report",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  snapshotDir: "visual-snapshots",
  snapshotPathTemplate: "{snapshotDir}/{testFilePath}/{projectName}-{arg}{ext}",
  testDir: "./visual-tests",
  use: {
    baseURL: "http://localhost:61000",
  },
  webServer: {
    command: "pnpm preview",
    cwd: ".",
    port: 61000,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});

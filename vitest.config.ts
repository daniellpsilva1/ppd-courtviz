import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: [path.resolve(__dirname, "scripts/__tests__/**/*.test.ts")],
    passWithNoTests: true,
  },
});

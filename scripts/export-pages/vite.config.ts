import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root,
  plugins: [react()],
  server: { host: "127.0.0.1", port: 61002, strictPort: true },
  preview: { host: "127.0.0.1", port: 61002, strictPort: true },
  resolve: {
    alias: {
      "@courtviz/spike": join(root, "../../packages/spike/src"),
      "@courtviz/three": join(root, "../../packages/three/src"),
      "@courtviz/motion": join(root, "../../packages/motion/src"),
      "@courtviz/react": join(root, "../../packages/react/src"),
      "@courtviz/core": join(root, "../../packages/core/src"),
      "@courtviz/themes": join(root, "../../packages/themes/src"),
      "@courtviz/data": join(root, "../../packages/data/src"),
      "@ppd/brand": join(root, "../../packages/brand/src"),
      "@ppd/tokens": join(root, "../../packages/tokens/src"),
    },
  },
});

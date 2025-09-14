import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/index.ts",
  outDir: "./dist",
  format: ["esm"],
  sourcemap: true,
  platform: "node",
});

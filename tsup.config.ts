import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "esnext",
  clean: true,
  bundle: true,
  noExternal: ["@msg91comm/sendotp-sdk"], // Bundle this broken package
  outDir: "dist",
  minify: false,
  sourcemap: true,
});

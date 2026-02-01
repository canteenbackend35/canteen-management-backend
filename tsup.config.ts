import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "esnext",
  clean: true,
  bundle: true,
  noExternal: ["@msg91comm/sendotp-sdk"], 
  external: [
    "@prisma/client",
    "express",
    "cors",
    "cookie-parser",
    "jsonwebtoken",
    "redis"
  ],
  outDir: "dist",
  minify: false,
  sourcemap: true,
  shims: true, // Helps with ESM/CommonJS compatibility
});

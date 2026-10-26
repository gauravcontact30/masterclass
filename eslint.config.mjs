import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Build scripts are CommonJS by extension: `require` is the module system
  // a .cjs file is written in, not a style choice to lint away.
  {
    files: ["**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  // A test renders plain anchors as fixtures; the Link rule is about pages.
  {
    files: ["__tests__/**"],
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-*/**",
    "coverage/**",
    "scratch/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "artifacts/**",
    ".playwright-mcp/**",
    ".scannerwork/**",
    ".remember/**",
  ]),
]);

export default eslintConfig;

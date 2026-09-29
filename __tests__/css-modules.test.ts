/** @jest-environment node */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { transform } from "lightningcss";

// Jest stubs CSS imports, so a stylesheet Turbopack rejects still passes every
// component test. Compile each CSS Module the way the bundler does instead:
// pure mode refuses selectors without a local class, such as a bare
// `[data-category="x"]`, and one refused file breaks every page in dev.
const files = readdirSync(join(process.cwd(), "components")).filter(name => name.endsWith(".module.css"));

test.each(files)("%s compiles as a pure CSS Module", name => {
  const filename = join("components", name);
  expect(() => transform({ filename, code: readFileSync(filename), cssModules: { pure: true } })).not.toThrow();
});

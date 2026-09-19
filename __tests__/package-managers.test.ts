/** @jest-environment node */
import { withoutYarn } from "@/lib/package-managers";

test("a yarn command becomes its npm and pnpm equivalents, in that order", () => {
  expect(withoutYarn("yarn add zod")).toBe("npm install zod\npnpm add zod");
  expect(withoutYarn("yarn add -D vitest")).toBe("npm install -D vitest\npnpm add -D vitest");
  expect(withoutYarn("yarn add --dev @types/node")).toBe("npm install -D @types/node\npnpm add -D @types/node");
  expect(withoutYarn("yarn remove lodash")).toBe("npm uninstall lodash\npnpm remove lodash");
  expect(withoutYarn("yarn dlx next upgrade")).toBe("npx next upgrade\npnpm dlx next upgrade");
  expect(withoutYarn("yarn create next-app")).toBe("npm create next-app\npnpm create next-app");
  expect(withoutYarn("yarn upgrade react")).toBe("npm update react\npnpm update react");
});

test("bare yarn installs the lockfile, and a script name gets the `run` both others require", () => {
  expect(withoutYarn("yarn")).toBe("npm install\npnpm install");
  expect(withoutYarn("yarn install")).toBe("npm install\npnpm install");
  expect(withoutYarn("yarn build")).toBe("npm run build\npnpm run build");
  expect(withoutYarn("yarn run build")).toBe("npm run build\npnpm run build");
  expect(withoutYarn("yarn test")).toBe("npm test\npnpm test");
});

test("a yarn line is dropped when the block already shows the same command", () => {
  // The common "three ways to say it" list collapses to the two we standardise on.
  expect(withoutYarn("npm install zod\nyarn add zod\npnpm add zod")).toBe("npm install zod\npnpm add zod");
  // Order is kept: yarn listed first must not push a duplicate ahead of the original.
  expect(withoutYarn("yarn add zod\nnpm install zod")).toBe("npm install zod\npnpm add zod");
});

test("indentation, shell prompts and surrounding lines survive", () => {
  expect(withoutYarn("  yarn add zod")).toBe("  npm install zod\n  pnpm add zod");
  expect(withoutYarn("$ yarn add zod")).toBe("npm install zod\npnpm add zod");
  expect(withoutYarn("cd app\nyarn add zod\nnpm run dev")).toBe("cd app\nnpm install zod\npnpm add zod\nnpm run dev");
});

test("only a line that runs yarn is rewritten", () => {
  // A comment and a real lockfile reference both say something the reader needs.
  expect(withoutYarn("# yarn is not supported here")).toBe("# yarn is not supported here");
  expect(withoutYarn("rm -f yarn.lock")).toBe("rm -f yarn.lock");
  expect(withoutYarn('const manager = "yarn";')).toBe('const manager = "yarn";');
});

test("code with no yarn in it is returned untouched", () => {
  const code = "npm install\nnpm run build";
  expect(withoutYarn(code)).toBe(code);
  expect(withoutYarn("")).toBe("");
});

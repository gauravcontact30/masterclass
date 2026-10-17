import nextJest from "next/jest.js";
const createConfig=nextJest({dir:"./"});
export default createConfig({
  testEnvironment:"jsdom",
  setupFilesAfterEnv:["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^server-only$": "<rootDir>/__tests__/mocks/server-only.ts",
    "^@t3-oss/env-nextjs$": "<rootDir>/__tests__/mocks/t3-env.ts",
    "^uncrypto$": "<rootDir>/node_modules/uncrypto/dist/crypto.node.cjs",
    "^@arcjet/next$": "<rootDir>/__tests__/mocks/arcjet.ts",
    "^next/cache$": "<rootDir>/__tests__/mocks/next-cache.ts"
  },
  testMatch:["**/__tests__/**/*.test.[jt]s?(x)"],
  clearMocks:true,
  // Render-heavy suites (the catalogue, search and reader pages) take several
  // seconds each under parallel load; 5s made them fail at random.
  testTimeout:60000,
  collectCoverageFrom:[
    "{app,components,lib}/**/*.{ts,tsx}",
    "!**/*.d.ts",
  ],
  coverageReporters:["text-summary","json-summary","lcov"],
});

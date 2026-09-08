import nextJest from "next/jest.js";
const createConfig=nextJest({dir:"./"});
export default createConfig({testEnvironment:"jsdom",setupFilesAfterEnv:["<rootDir>/jest.setup.ts"],moduleNameMapper:{"^@/(.*)$":"<rootDir>/$1","^server-only$":"<rootDir>/__tests__/mocks/server-only.ts"},testMatch:["**/__tests__/**/*.test.[jt]s?(x)"],clearMocks:true});

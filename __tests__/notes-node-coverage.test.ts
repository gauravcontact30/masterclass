/** @jest-environment node */
import { DEFAULT_GUIDES } from "@/lib/generation/default-library";
import { NODE_CORE_LESSON_COUNT, NODE_LESSON_SEEDS } from "@/lib/generation/guides/node";
import { getStudyNote, NOTES_SUMMARIES } from "@/lib/server/notes-study-catalog";
import { dueGuides } from "@/lib/server/default-library";

const guide = DEFAULT_GUIDES.find(item => item.id === "node")!;
const course = getStudyNote("node-course")!;
const text = guide.curriculum.lessons.map(lesson => [lesson.title, lesson.explanation, lesson.code].join(" ")).join(" ").toLowerCase();

test.each([
  "event-driven", "event loop", "timers", "pending", "poll", "check", "close", "non-blocking", "worker pool", "v8", "libuv",
  "global", "process", "buffer", "__dirname", "__filename", "fs/promises", "node:fs", "path", "http", "https", "http2", "eventemitter",
  "readable", "writable", "duplex", "transform", "crypto", "os", "util", "child_process", "worker_threads", "cluster", "url", "querystring",
  "zlib", "dns", "net", "tls", "readline", "perf_hooks", "async_hooks", "diagnostics_channel", "node:test",
  "commonjs", "require", "module.exports", "esm", "import", "export", "npm", "package.json", "package-lock.json", "npx", "yarn", "pnpm", "semver",
  "express", "nestjs", "fastify", "koa", "hapi", "feathers", "mongoose", "sequelize", "prisma", "typeorm", "knex", "pg", "mysql2", "mongodb", "redis",
  "callbacks", "promises", "async/await", "top-level await", "generators", "iterators", "zod", "joi", "yup", "ajv", "json schema", "body-parser", "multer",
  "passport", "jsonwebtoken", "jwt", "bcrypt", "argon2", "helmet", "cors", "express-rate-limit", "socket.io", "websocket", "trpc",
  "jest", "mocha", "chai", "supertest", "vitest", "sinon", "nodemon", "pm2", "eslint", "prettier", "dotenv", "winston", "pino", "lodash", "axios", "node-fetch", "commander.js", "inquirer.js",
  "garbage collection", "memory leak", "cpu profiling", "backpressure", "native c++ addons", "n-api", "xss", "csrf", "sql injection", "microservices",
])("Node.js curriculum teaches %s", topic => {
  expect(text).toContain(topic);
});

test("all Node.js categories and chapters are available through one named course", () => {
  expect(NOTES_SUMMARIES.filter(note => note.technology === "node" && note.learnInApp)).toHaveLength(1);
  expect(course.title).toBe("Node.js");
  expect(course.contents).toHaveLength(NODE_LESSON_SEEDS.length);
  expect([...new Set(course.contents!.map(chapter => chapter.category))]).toEqual([
    "Getting started", "Core Architecture & Concepts", "Node.js Core Modules", "Package Management & Modules System",
    "Asynchronous Flow Control", "Web Frameworks & HTTP Servers", "Database Integration & ORMs/ODMs", "Data Validation & Parsing",
    "Authentication & Security", "Real-Time Communication", "Testing Frameworks", "DevTools, Utilities & Quality Assurance", "Advanced Concepts & Performance",
  ]);
  for (const [index, chapter] of course.contents!.entries()) {
    expect(chapter.id).toBe(`node-lesson-${index}`);
    expect(getStudyNote(chapter.id)?.title).toBe(NODE_LESSON_SEEDS[index].title);
  }
  expect(NODE_CORE_LESSON_COUNT).toBe(12);
  expect(new Set(NODE_LESSON_SEEDS.map(seed => seed.id)).size).toBe(NODE_LESSON_SEEDS.length);
});

test("existing Node.js library files refresh and ecosystem subjects are searchable on the card", () => {
  expect(guide.version).toBeGreaterThan(2);
  expect(dueGuides(new Map([["node", 2]])).some(item => item.id === "node")).toBe(true);
  const summary = NOTES_SUMMARIES.find(note => note.id === "node-course")!;
  for (const term of ["libuv", "fs/promises", "fastify", "prisma", "multer", "socket.io", "sinon.js", "pm2", "node-api", "microservices"]) {
    expect(summary.searchText).toContain(term);
  }
});

/** @jest-environment node */
import { DEFAULT_GUIDES } from "@/lib/generation/default-library";
import { NESTJS_CORE_LESSON_COUNT, NESTJS_LESSON_SEEDS } from "@/lib/generation/guides/nestjs";
import { getStudyNote, NOTES_SUMMARIES, NOTES_TECHNOLOGIES } from "@/lib/server/notes-study-catalog";
import { dueGuides } from "@/lib/server/default-library";
import preview from "@/lib/catalog-preview.json";

const guide = DEFAULT_GUIDES.find(item => item.id === "nestjs")!;
const course = getStudyNote("nestjs-course")!;
const text = guide.curriculum.lessons.map(lesson => [lesson.title, lesson.explanation, lesson.code].join(" ")).join(" ").toLowerCase();

test.each([
  "architecture", "cli", "@module", "dynamic modules", "global modules", "@controller", "request/response", "@injectable", "custom providers",
  "constructor injection", "property injection", "scopes", "middleware", "functional", "class middleware", "@useguards", "role-based", "auth",
  "interceptors", "logging", "data transformation", "stream manipulation", "validationpipe", "parseintpipe", "custom transformation", "@catch", "http exceptions",
  "typeorm", "prisma", "mongoose", "mongodb", "entities", "schemas", "repositories", "query builders", "migrations", "seeding",
  "passport.js", "jwt", "session-based", "rbac", "abac", "helmet", "cors", "encryption", "hashing", "bcrypt",
  "configuration", "cookies", "file uploads", "cron", "intervals", "timeouts", "bullmq", "cache-manager", "redis", "event emitter", "sse",
  "socket.io", "ws", "gateways", "rest apis", "graphql", "code-first", "schema-first", "federation", "tcp", "mqtt", "nats", "rabbitmq", "grpc", "kafka",
  "unit testing", "jest", "mocking providers", "e2e testing", "supertest", "testingmodule", "classserializerinterceptor", "terminus", "swc", "webpack", "dockerization", "deployment",
])("Nest JS curriculum teaches %s", topic => expect(text).toContain(topic));

test("Nest JS is the exact guide, card and technology display name with complete categories", () => {
  expect(guide.curriculum.title).toBe("Nest JS");
  expect(course.title).toBe("Nest JS");
  expect(course.readerTitle).toBe("Nest JS");
  expect(NOTES_TECHNOLOGIES.find(item => item.id === "nestjs")?.title).toBe("Nest JS");
  expect(preview.technologies.find(item => item.id === "nestjs")?.title).toBe("Nest JS");
  expect(NOTES_SUMMARIES.filter(note => note.technology === "nestjs" && note.learnInApp)).toHaveLength(1);
  expect(course.contents).toHaveLength(NESTJS_LESSON_SEEDS.length);
  expect([...new Set(course.contents!.map(chapter => chapter.category))]).toEqual([
    "Getting started", "Core Fundamentals", "Request Lifecycle & Middleware", "Database & Persistence", "Security & Authentication",
    "Advanced Techniques", "Architectural Styles", "Testing", "Devops & Production",
  ]);
  for (const [index, chapter] of course.contents!.entries()) {
    expect(chapter.id).toBe(`nestjs-lesson-${index}`);
    expect(getStudyNote(chapter.id)?.title).toBe(NESTJS_LESSON_SEEDS[index].title);
  }
  expect(NESTJS_CORE_LESSON_COUNT).toBe(12);
  expect(new Set(NESTJS_LESSON_SEEDS.map(seed => seed.id)).size).toBe(NESTJS_LESSON_SEEDS.length);
});

test("existing Nest files refresh and integration names are searchable", () => {
  expect(guide.version).toBeGreaterThan(2);
  expect(dueGuides(new Map([["nestjs", 2]])).some(item => item.id === "nestjs")).toBe(true);
  const summary = NOTES_SUMMARIES.find(note => note.id === "nestjs-course")!;
  for (const term of ["bullmq", "sse", "rbac", "abac", "grpc", "kafka", "terminus", "swc", "dockerization"]) expect(summary.searchText).toContain(term);
});

import type { OfficialTechnologyDoc } from "./official-docs-data";
import type { DocsProject } from "./official-docs-projects";
import type { AnswerFile } from "./pro-learn/types";

const file = (path: string, code: string): AnswerFile => ({ path, code: code.trim() + "\n", note: "" });
const json = (path: string, value: unknown) => file(path, JSON.stringify(value, null, 2));
const ignore = file(".gitignore", "node_modules/\ndist/\n.env\n");

export const BACKEND_PROJECTS: Record<string, DocsProject> = {
  nestjs: {
    title: "A modular Nest.js lesson API",
    summary: "Follow a request from a controller through an injected service, with an explicit module and bootstrap file.",
    prerequisites: ["Node.js 22.12+ or a current supported LTS release, and npm.", "Save the complete files in an empty folder; port 3000 must be free."],
    points: ["The controller delegates lesson lookups to an injectable service.", "The module registers both classes so Nest can resolve their dependencies."],
    files: [
      file("src/main.ts", `import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  await app.listen(3000, '127.0.0.1');
}

bootstrap().catch(error => {
  console.error(error);
  process.exitCode = 1;
});`),
      file("src/app.module.ts", `import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller.js';
import { LessonsService } from './lessons.service.js';

@Module({ controllers: [LessonsController], providers: [LessonsService] })
export class AppModule {}`),
      file("src/lessons.controller.ts", `import { Controller, Get, NotFoundException, Param, ParseIntPipe } from '@nestjs/common';
import { LessonsService } from './lessons.service.js';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessons: LessonsService) {}

  @Get()
  findAll() {
    return this.lessons.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    const lesson = this.lessons.findOne(id);
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }
}`),
      file("src/lessons.service.ts", `import { Injectable } from '@nestjs/common';

@Injectable()
export class LessonsService {
  private readonly lessons = [
    { id: 1, title: 'Controllers' },
    { id: 2, title: 'Dependency injection' },
  ];

  findAll() { return this.lessons; }
  findOne(id: number) { return this.lessons.find(lesson => lesson.id === id); }
}`),
      json("tsconfig.json", { compilerOptions: { target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", rootDir: "src", outDir: "dist", experimentalDecorators: true, emitDecoratorMetadata: true, strict: true, skipLibCheck: true }, include: ["src/**/*.ts"] }),
      json("package.json", { name: "nest-lessons", private: true, type: "module", scripts: { build: "tsc", start: "npm run build && node dist/main.js" }, dependencies: { "@nestjs/common": "^12.0.0", "@nestjs/core": "^12.0.0", "@nestjs/platform-express": "^12.0.0", "reflect-metadata": "^0.2.2", rxjs: "^7.8.2" }, devDependencies: { typescript: "^6.0.0", "@types/node": "^22.0.0" } }),
      ignore,
    ],
    commands: [{ command: "npm install", description: "Install the framework and TypeScript compiler." }, { command: "npm start", description: "Compile the source and start the HTTP server." }],
    verify: ["Open http://localhost:3000/lessons to see two lessons; /lessons/1 returns one lesson.", "Request /lessons/abc for a 400 response or /lessons/999 for a 404 response.", "Stop the server with Ctrl+C. This example uses an in-memory list, not a database."],
  },
  mongoose: {
    title: "Validate and save a MongoDB lesson",
    summary: "Connect to a local MongoDB instance, validate a document, persist it, and read it back through a Mongoose model.",
    prerequisites: ["Node.js 22.12+ and npm.", "Docker with Compose and a free local port 27018, or an existing MongoDB instance configured in .env."],
    points: ["The model owns the lesson schema and its validation rules.", "The script closes its database connection even when an operation fails."],
    files: [
      file("src/lesson.js", `import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  minutes: { type: Number, required: true, min: 1 },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

export const Lesson = mongoose.model('Lesson', lessonSchema);`),
      file("src/main.js", `import mongoose from 'mongoose';
import { Lesson } from './lesson.js';

try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  const lesson = new Lesson({ title: 'Schema validation', minutes: 20 });
  await lesson.validate();
  await lesson.save();
  const saved = await Lesson.findById(lesson._id).lean().exec();
  console.log(saved);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}`),
      file("test/lesson.test.js", `import test from 'node:test';
import assert from 'node:assert/strict';
import { Lesson } from '../src/lesson.js';

test('rejects invalid lessons without connecting to MongoDB', async () => {
  await assert.rejects(new Lesson({ minutes: 0 }).validate(), error => {
    assert.ok(error.errors.title);
    assert.ok(error.errors.minutes);
    return true;
  });
});

test('applies defaults and trims a valid title', async () => {
  const lesson = new Lesson({ title: '  Queries  ', minutes: 10 });
  await lesson.validate();
  assert.equal(lesson.title, 'Queries');
  assert.equal(lesson.completed, false);
});`),
      file(".env.example", "MONGODB_URI=mongodb://127.0.0.1:27018/docs_lessons"),
      file("compose.yaml", `services:
  mongodb:
    image: mongo:8
    ports: ['127.0.0.1:27018:27017']
    volumes: ['lesson-data:/data/db']
    healthcheck:
      test: ['CMD', 'mongosh', '--quiet', '--eval', 'db.adminCommand({ ping: 1 })']
      interval: 5s
      timeout: 5s
      retries: 12
volumes:
  lesson-data:`),
      json("package.json", { name: "mongoose-lessons", private: true, type: "module", scripts: { start: "node --env-file=.env src/main.js", test: "node --test" }, dependencies: { mongoose: "^9.0.0" } }),
      ignore,
    ],
    commands: [
      { command: "npm install", description: "Install Mongoose and its MongoDB driver." },
      { command: 'node -e "require(\'node:fs\').copyFileSync(\'.env.example\', \'.env\', require(\'node:fs\').constants.COPYFILE_EXCL)"', description: "Create .env from the example without overwriting an existing configuration." },
      { command: "docker compose up -d --wait", description: "Start the local database and wait for its health check." },
      { command: "npm test", description: "Check schema defaults and validation; these tests do not need a database." },
      { command: "npm start", description: "Save a new lesson and print the stored document." },
      { command: "docker compose down", description: "Stop the local database; the named volume keeps the saved lessons." },
    ],
    verify: ["The output includes title, minutes, completed, _id, and timestamps.", "Each run inserts one lesson into the local docs_lessons database.", "Both validation tests pass; an invalid document is rejected before saving."],
  },
};

/** Original learning summaries based on the linked official guides. */
export const BACKEND_DOCS: OfficialTechnologyDoc[] = [
  {
    id: "nestjs", title: "Nest.js", category: "Backend & APIs", version: "v12", badge: "Official",
    tagline: "Modular Node.js applications with dependency injection",
    officialUrl: "https://docs.nestjs.com/", githubUrl: "https://github.com/nestjs/nest",
    overview: { en: "Nest organizes server applications into modules, controllers, and injectable providers. Explore routing and dependency injection through a small TypeScript API.", hi: "Nest में मॉड्यूल, कंट्रोलर और प्रोवाइडर से Node.js सर्वर बनाएं तथा निर्भरता इंजेक्शन और रूटिंग सीखें।" },
    keyPoints: ["Controllers map incoming HTTP requests to methods.", "Providers hold logic that controllers can request through dependency injection.", "Modules register controllers and providers and define which dependencies they export."],
    keyFeatures: [{ title: "Controllers", description: "Combine a controller prefix and a method decorator to define an endpoint." }, { title: "Providers", description: "Register an injectable service and receive it through the constructor." }, { title: "Modules", description: "Import another module to use the providers it exports." }],
    architecturePoints: ["NestFactory creates the application from its root module.", "The container resolves registered dependencies before serving requests.", "An HTTP adapter connects the framework to the underlying server library."],
    bestPractices: ["Keep request handling in controllers and reusable operations in services.", "Prefer constructor injection so dependencies are explicit."],
    commonGotchas: ["A provider must be registered in a module before it can be injected.", "Importing a class in TypeScript does not make a provider available across module boundaries."],
    cliCommands: BACKEND_PROJECTS.nestjs.commands,
    codeExample: { filename: "src/lessons.controller.ts", language: "typescript", code: BACKEND_PROJECTS.nestjs.files[2].code, explanation: "A controller delegates reads to its injected service." },
  },
  {
    id: "mongoose", title: "Mongoose", category: "Databases & Storage", version: "v9", badge: "Official",
    tagline: "Schema-based MongoDB modeling for Node.js",
    officialUrl: "https://mongoosejs.com/docs/", githubUrl: "https://github.com/Automattic/mongoose",
    overview: { en: "Mongoose adds schemas, casting, validation, and model APIs to MongoDB applications. Follow the connection, validation, and persistence lifecycle in a complete example.", hi: "Mongoose से MongoDB दस्तावेज़ों के स्कीमा बनाएं, डेटा की जांच करें और Node.js में मॉडल द्वारा डेटा सहेजें तथा पढ़ें।" },
    keyPoints: ["Schemas describe document fields, types, and options.", "A model is compiled from a schema and provides database operations.", "Document validation checks configured rules before saving."],
    keyFeatures: [{ title: "Schemas", description: "Declare field types, defaults, and rules such as required and minimum values." }, { title: "Models", description: "Create documents and query the collection through a compiled model." }, { title: "Connections", description: "Await connection establishment and handle initial connection failures." }],
    architecturePoints: ["Mongoose uses the MongoDB driver to communicate with the database.", "Queries describe operations that execute when awaited or passed to exec().", "Schema middleware can run before or after document operations."],
    bestPractices: ["Await mongoose.connect() before starting database-dependent work.", "Keep database credentials in environment configuration."],
    commonGotchas: ["The unique schema option creates an index; it is not a validator.", "Update validators are opt-in with runValidators and only check updated paths."],
    cliCommands: BACKEND_PROJECTS.mongoose.commands,
    codeExample: { filename: "src/lesson.js", language: "javascript", code: BACKEND_PROJECTS.mongoose.files[0].code, explanation: "The schema validates lesson fields and adds timestamps." },
  },
];

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
];

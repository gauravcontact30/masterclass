/**
 * Writes lib/deep-courses/topic-index.json: each in-depth course's topics (id, title, module, level, minutes,
 * summary) for client components (topic cards on /learning/lessons, course progress on the dashboard), which must
 * not import the full course content. Re-run after adding or renaming a topic:
 *
 *   npm run deep-courses:index
 */
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const ids = ["core-java", "advanced-java", "spring-boot", "cpp", "dsa", "java-basic-to-advanced"];
const index: Record<string, { id: string; title: string; module: string; level: string; minutes: number; summary: string }[]> = {};
for (const id of ids) {
  const { COURSE } = await import(pathToFileURL(resolve(root, `lib/deep-courses/content/${id}.ts`)).href);
  index[id] = COURSE.topics.map((topic: { id: string; title: string; module: string; level: string; minutes: number; summary: string }) =>
    ({ id: topic.id, title: topic.title, module: topic.module, level: topic.level, minutes: topic.minutes, summary: topic.summary }));
}
writeFileSync(resolve(root, "lib/deep-courses/topic-index.json"), `${JSON.stringify(index, null, 1)}\n`);
console.log(Object.entries(index).map(([id, topics]) => `${id}: ${topics.length}`).join(", "));

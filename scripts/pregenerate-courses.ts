/**
 * Writes every generated in-depth course ahead of time (outline, then every topic), so no learner waits for a lesson
 * to be written on first open. Resumable: ready outlines and topics are skipped, failed ones are retried.
 * Research is limited to ~3 concurrent Perplexity calls inside lib/server/course-generator.ts.
 *
 *   npx tsx --conditions=react-server --env-file=.env scripts/pregenerate-courses.ts            # every course
 *   npx tsx --conditions=react-server --env-file=.env scripts/pregenerate-courses.ts langchain  # named courses
 *   ... langflow/text-splitting                                                                   # one topic
 *   ... --status                                                                                  # report only
 *   ... --topics=2                                                                                # first N topics per course (trial)
 */
import { COURSE_CATALOG } from "../lib/deep-courses/catalog";
import { SCRIPT_BUDGET, generateOutline, generateTopic, readGeneratedCourse } from "../lib/server/course-generator";

const args = process.argv.slice(2);
const named = args.filter(arg => !arg.startsWith("--"));
// "course/topic" names a single topic; a bare id names a whole course.
const namedTopics = new Set(named.filter(arg => arg.includes("/")));
const namedCourses = named.map(arg => arg.split("/")[0]);
const statusOnly = args.includes("--status");
const topicLimit = Number(args.find(arg => arg.startsWith("--topics="))?.slice(9)) || Infinity;
// Topics written at once: research queues itself at three, writing and review overlap with it.
const PARALLEL = 4;

const courses = COURSE_CATALOG.filter(course => !course.handwritten && (!named.length || namedCourses.includes(course.id)));

async function pool<T>(items: T[], size: number, run: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => { while (next < items.length) await run(items[next++]); }));
}

async function main() {
  const jobs: { course: string; topic: string }[] = [];
  let ready = 0, total = 0;
  for (const course of courses) {
    let stored = await readGeneratedCourse(course.id);
    if (!statusOnly && stored?.course.status !== "ready") {
      try { console.log(`outline ${course.id}: ${await generateOutline(course.id, SCRIPT_BUDGET)}`); }
      catch (error) { console.error(`outline ${course.id} failed: ${String(error).slice(0, 160)}`); continue; }
      stored = await readGeneratedCourse(course.id);
    }
    if (stored?.course.status !== "ready") { console.log(`${course.id}: no outline yet`); continue; }
    const topics = stored.course.topics.slice(0, topicLimit)
      .filter(topic => !namedTopics.size || namedTopics.has(`${course.id}/${topic.id}`) || named.includes(course.id));
    total += topics.length;
    for (const topic of topics) {
      if (stored.topics.get(topic.id)?.status === "ready") ready++;
      else jobs.push({ course: course.id, topic: topic.id });
    }
  }
  console.log(`${courses.length} courses, ${ready}/${total} topics ready, ${jobs.length} to write`);
  if (statusOnly) return;

  let done = 0, failed = 0, skipped = 0;
  const started = Date.now();
  await pool(jobs, PARALLEL, async ({ course, topic }) => {
    const at = Date.now();
    let state;
    try { state = await generateTopic(course, topic, SCRIPT_BUDGET); }
    catch (error) { failed++; console.error(`  ✗ ${course}/${topic}: ${String(error).slice(0, 160)}`); return; }
    if (state !== "ready") { skipped++; console.log(`  … ${course}/${topic}: being written by another run, skipped`); return; }
    done++;
    const minutes = (Date.now() - started) / 60_000;
    console.log(`  ✓ ${course}/${topic} in ${Math.round((Date.now() - at) / 1000)} s · ${done + failed}/${jobs.length} · ~${Math.round((minutes / (done + failed)) * (jobs.length - done - failed))} min left`);
  });
  console.log(`written ${done}, failed ${failed}, skipped ${skipped} (rerun to retry failures and skipped topics)`);
}
main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });

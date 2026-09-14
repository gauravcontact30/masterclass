import { DEVOPS_SERVICE_LESSONS } from "@/lib/generation/guides/devops-service-lessons";
test("lengths", () => {
  for (const lesson of DEVOPS_SERVICE_LESSONS) {
    lesson.interview!.forEach((q, i) => { if (q.answer.length > 520) console.log(`OVER ${q.answer.length} :: ${q.answer.slice(0, 55)}`); });
  }
});

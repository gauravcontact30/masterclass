import { WORKFLOWS } from "@/lib/landing-workflows";
import { diagramProblems } from "@/lib/workflow-layout";

describe("workflow diagram layout", () => {
  it.each(WORKFLOWS.map(workflow => [workflow.id, workflow] as const))("%s has no label over a box or a label, and no edge through a box", (_, workflow) => {
    expect(diagramProblems(workflow)).toEqual([]);
  });
});

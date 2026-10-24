import { WORKFLOWS, WORKFLOW_HEIGHT, WORKFLOW_WIDTH, NODE_WIDTH, NODE_HEIGHT } from "@/lib/landing-workflows";

test("the closing slider covers system design and every Lang* tool", () => {
  expect(WORKFLOWS.length).toBeGreaterThanOrEqual(10);
  expect(new Set(WORKFLOWS.map(w => w.group))).toEqual(new Set(["System Design", "LangChain", "LangGraph", "LangFlow", "LangSmith", "Companies"]));
  expect(new Set(WORKFLOWS.map(w => w.id)).size).toBe(WORKFLOWS.length);
});

test.each(WORKFLOWS.map(w => [w.id, w] as const))("%s draws only what it explains", (_, workflow) => {
  const ids = new Set(workflow.nodes.map(node => node.id));
  for (const edge of workflow.edges) { expect(ids).toContain(edge.from); expect(ids).toContain(edge.to); }
  // Every numbered badge on the diagram has its callout pill.
  for (const node of workflow.nodes) if (node.step) expect(node.step).toBeLessThanOrEqual(workflow.steps.length);
  for (const node of workflow.nodes) {
    expect(node.x - NODE_WIDTH / 2).toBeGreaterThanOrEqual(0); expect(node.x + NODE_WIDTH / 2).toBeLessThanOrEqual(WORKFLOW_WIDTH);
    expect(node.y - NODE_HEIGHT / 2).toBeGreaterThanOrEqual(0); expect(node.y + NODE_HEIGHT / 2).toBeLessThanOrEqual(WORKFLOW_HEIGHT);
  }
});

test("every blueprint names its industry, the real problem and the outcome", () => {
  for (const workflow of WORKFLOWS) for (const field of [workflow.industry, workflow.problem, workflow.outcome]) expect(field.length).toBeGreaterThan(5);
  for (const industry of ["E-Commerce", "Healthcare", "Hospitals", "Banking", "Corporate", "Tech industry"]) expect(WORKFLOWS.map(w => w.industry)).toContain(industry);
});

test("cab booking is the second slide and the URL shortener and company slides stay on the dashboard", () => {
  expect(WORKFLOWS.slice(0, 2).map(w => w.id)).toEqual(["food-delivery", "cab-booking"]);
  expect(WORKFLOWS.find(w => w.id === "url-shortener")?.dashboardOnly).toBe(true);
  const companies = WORKFLOWS.filter(w => w.group === "Companies");
  expect(companies.map(w => w.id)).toEqual(["google", "amazon", "microsoft", "meta", "anthropic", "openai", "apple", "salesforce", "flipkart"].map(name => `company-${name}`));
  for (const company of companies) expect(company.dashboardOnly).toBe(true);
  for (const id of ["ecommerce-platform", "school-university", "campus-placement"]) expect(WORKFLOWS.map(w => w.id)).toContain(id);
});

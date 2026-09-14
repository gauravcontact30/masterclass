import { codeExampleSchema } from "@/lib/domain";
import { AWS_PLATFORM_EXAMPLES } from "@/lib/generation/examples/aws-platform-examples";
import { AWS_DATA_EXAMPLES } from "@/lib/generation/examples/aws-data-examples";
import { DEVOPS_DELIVERY_EXAMPLES } from "@/lib/generation/examples/devops-delivery-examples";
import { DEVOPS_RELIABILITY_EXAMPLES } from "@/lib/generation/examples/devops-reliability-examples";

const all = { ...AWS_PLATFORM_EXAMPLES, ...AWS_DATA_EXAMPLES, ...DEVOPS_DELIVERY_EXAMPLES, ...DEVOPS_RELIABILITY_EXAMPLES };
test.each(Object.entries(all))("%s", (_title, examples) => {
  expect(examples.map(e => e.kind)).toEqual(["concept", "application"]);
  for (const example of examples) {
    const parsed = codeExampleSchema.safeParse(example);
    if (!parsed.success) throw new Error(example.title + ": " + JSON.stringify(parsed.error.issues, null, 2));
    expect(example.files.length).toBeGreaterThanOrEqual(2);
    expect(example.setup.length).toBeGreaterThan(0);
    expect(example.expectedOutput).not.toBe("");
    expect(example.apiReference!.length).toBeGreaterThan(0);
    for (const f of example.files) expect({ path: f.path, starts: f.code.startsWith("//") || f.code.startsWith("#") || f.code.startsWith("--") || f.path.endsWith(".json") || f.path.endsWith(".md") }).toEqual({ path: f.path, starts: true });
  }
});

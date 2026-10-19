/** @jest-environment node */
jest.mock("@/lib/tech-docs-official", () => ({ fetchOfficialTechDocs: jest.fn(), slimTechDocs: jest.fn() }));

import { fetchOfficialTechDocs } from "@/lib/tech-docs-official";
import { officialTechDocs } from "@/lib/server/official-tech-docs";
import snapshot from "@/lib/generated/tech-docs-official.json";

const original = process.env.TECH_DOCS_LIVE;
afterEach(() => {
  if (original === undefined) delete process.env.TECH_DOCS_LIVE;
  else process.env.TECH_DOCS_LIVE = original;
  jest.clearAllMocks();
});

test("cold public pages use the snapshot without a remote refresh by default", async () => {
  delete process.env.TECH_DOCS_LIVE;
  expect(await officialTechDocs()).toEqual(snapshot);
  expect(fetchOfficialTechDocs).not.toHaveBeenCalled();
});

test("explicit live refresh still fetches the documentation", async () => {
  process.env.TECH_DOCS_LIVE = "true";
  jest.mocked(fetchOfficialTechDocs).mockResolvedValue(snapshot);
  expect(await officialTechDocs()).toEqual(snapshot);
  expect(fetchOfficialTechDocs).toHaveBeenCalledTimes(1);
});

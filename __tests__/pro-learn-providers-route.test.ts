/** @jest-environment node */
import { GET } from "@/app/api/pro-learn/providers/route";

const ENV = { ...process.env };
const both = { ANTHROPIC_API_KEY: "sk-ant-test", ANTHROPIC_MODEL: "claude-sonnet-5", PERPLEXITY_API_KEY: "pplx-test", PERPLEXITY_MODEL: "sonar" };

beforeEach(() => {
  process.env = { ...ENV, ...both };
  // A real gateway key in .env would make "gateway" a third configured provider.
  delete process.env.AI_GATEWAY_API_KEY; delete process.env.VERCEL_OIDC_TOKEN;
});
afterAll(() => { process.env = ENV; });

async function providers() {
  const response = await GET();
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  return response.json() as Promise<{ providers: { id: string; label: string; grounded: boolean; description: string }[]; default: string | null }>;
}

test("both configured providers are listed with a label, and Perplexity is marked as web-grounded", async () => {
  const body = await providers();
  expect(body.providers.map(item => item.id)).toEqual(["anthropic", "perplexity"]);
  expect(body.providers.map(item => item.label)).toEqual(["Claude", "Perplexity"]);
  expect(body.providers.find(item => item.id === "perplexity")!.grounded).toBe(true);
  expect(body.providers.find(item => item.id === "anthropic")!.grounded).toBe(false);
  expect(body.providers.every(item => item.description.length > 20)).toBe(true);
  // Every surface reading this list generates learning content, so the
  // advertised default must be the one the server would pick for it. Advertising
  // anything else makes the client pin a provider the server did not choose.
  expect(body.default).toBe("perplexity");
});

test("an unconfigured provider is never offered, and a Perplexity-only deployment defaults to it", async () => {
  delete process.env.ANTHROPIC_API_KEY;
  const body = await providers();
  expect(body.providers.map(item => item.id)).toEqual(["perplexity"]);
  expect(body.default).toBe("perplexity");
});

test("no credentials means no providers, and the response never leaks a model or a key", async () => {
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.PERPLEXITY_API_KEY;
  const body = await providers();
  expect(body.providers).toEqual([]);
  expect(body.default).toBeNull();

  process.env = { ...ENV, ...both };
  const serialised = JSON.stringify(await providers());
  for (const secret of ["pplx-test", "sk-ant-test", "claude-sonnet-5", "sonar"]) expect(serialised).not.toContain(secret);
});

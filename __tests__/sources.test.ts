/** @jest-environment node */
import { documentationText, documentationUrl, fetchDocumentation } from "@/lib/generation/sources";
const realFetch = global.fetch;
afterEach(() => { global.fetch = realFetch; });
test("extracts article text and code without navigation or scripts", () => {
  const result = documentationText('<title>Functions &amp; scope</title><nav>Menu</nav><main><h1>Functions</h1><script>secret()</script><pre>const x = 1 &lt; 2;</pre><p>A named task.</p></main>');
  expect(result.title).toBe("Functions & scope");
  expect(result.text).toContain("const x = 1 < 2;");
  expect(result.text).not.toMatch(/Menu|secret/);
});
test.each(["http://react.dev/learn", "https://react.dev.attacker.test/", "https://localhost/", "https://127.0.0.1/", "https://user:pass@react.dev/", "https://react.dev:444/"])("rejects untrusted source %s", url => {
  expect(() => documentationUrl(url)).toThrow();
});
test("fetches documentation text and records provenance", async () => {
  global.fetch = jest.fn().mockResolvedValue(new Response(`<title>React</title><main>${"Components compose UI. ".repeat(30)}</main>`, {headers:{"Content-Type":"text/html"}}));
  const [source] = await fetchDocumentation(["https://react.dev/learn"]);
  expect(source.text).toContain("Components compose UI.");
  expect(source.url).toBe("https://react.dev/learn");
  expect(Number.isNaN(Date.parse(source.retrievedAt))).toBe(false);
});
test("rejects redirects to non-documentation hosts before fetching them", async () => {
  global.fetch = jest.fn().mockResolvedValue(new Response(null, {status:302,headers:{Location:"http://127.0.0.1/admin"}}));
  await expect(fetchDocumentation(["https://react.dev/learn"])).rejects.toThrow();
  expect(global.fetch).toHaveBeenCalledTimes(1);
});
test("fails closed for unavailable or empty sources", async () => {
  global.fetch = jest.fn().mockResolvedValue(new Response("Unavailable", {status:503}));
  await expect(fetchDocumentation(["https://react.dev/learn"])).rejects.toThrow();
  await expect(fetchDocumentation([])).rejects.toThrow();
});

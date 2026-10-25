import { explainLines, extractSymbols, urlAnatomy } from "@/lib/code-explain";

// The snippet from the app's own Next.js navigation lesson.
const SNIPPET = `'use client'
import { useSearchParams } from 'next/navigation'

const searchParams = useSearchParams()
searchParams.get('q')`;

describe("explainLines", () => {
  it("returns one entry per source line", () => {
    expect(explainLines(SNIPPET)).toHaveLength(SNIPPET.split("\n").length);
  });

  it("explains every line of the navigation snippet", () => {
    const notes = explainLines(SNIPPET);
    expect(notes[0]).toMatch(/Client Component entry point/);
    expect(notes[1]).toBe("Imports useSearchParams from next/navigation.");
    expect(notes[2]).toBeNull(); // blank line
    expect(notes[3]).toBe("Calls the useSearchParams hook and keeps its result in searchParams.");
    expect(notes[4]).toBe("Calls searchParams.get('q') for its result or effect.");
  });

  it("stays silent rather than guessing", () => {
    expect(explainLines("  }\n)\n<>")).toEqual([null, null, null]);
  });

  it("skips lines that are already comments", () => {
    expect(explainLines("// already explained\nconst a = 1;")).toEqual([null, "Declares a."]);
  });

  it("describes declarations, destructuring and types", () => {
    expect(explainLines("export default function Page() {")[0]).toBe("Declares Page as this module's default export.");
    expect(explainLines("const { pending } = useLinkStatus()")[0]).toBe(
      "Destructures pending out of the useLinkStatus() result.",
    );
    expect(explainLines("interface User { name: string }")[0]).toMatch(/erased at build time/);
    expect(explainLines("import Link from 'next/link'")[0]).toBe("Imports the default export of next/link as Link.");
  });

  it("reads python with its own rules", () => {
    const notes = explainLines("from decimal import Decimal\ndef total(prices):\n    print(prices)", "python");
    expect(notes[0]).toBe("Imports Decimal from the decimal module.");
    expect(notes[1]).toBe("Defines total, taking prices.");
    expect(notes[2]).toBe("Prints prices to standard output.");
  });
});

describe("extractSymbols", () => {
  const byKind = (code: string, kind: string) =>
    extractSymbols(code).filter(symbol => symbol.kind === kind).map(symbol => symbol.name);

  it("separates the package from the hook it exports", () => {
    expect(byKind(SNIPPET, "package")).toEqual(["next/navigation"]);
    expect(byKind(SNIPPET, "hook")).toContain("useSearchParams");
    expect(byKind(SNIPPET, "method")).toContain("searchParams.get()");
    expect(byKind(SNIPPET, "directive")).toEqual(["'use client'"]);
  });

  it("uses the documented description for known Next.js hooks", () => {
    const hook = extractSymbols(SNIPPET).find(symbol => symbol.name === "useSearchParams");
    expect(hook?.detail).toMatch(/read-only URLSearchParams/);
  });

  it("tells a local module apart from a published package", () => {
    const symbols = extractSymbols('import { total } from "./values.mjs";\nimport React from "react";');
    expect(symbols.find(s => s.name === "./values.mjs")?.kind).toBe("module");
    expect(symbols.find(s => s.name === "react")?.kind).toBe("package");
  });

  it("collects classes, interfaces, types and functions", () => {
    const code = "export interface User { id: string }\ntype Id = string\nclass Store {}\nexport function build() {}";
    expect(byKind(code, "interface")).toEqual(["User"]);
    expect(byKind(code, "type")).toEqual(["Id"]);
    expect(byKind(code, "class")).toEqual(["Store"]);
    expect(byKind(code, "function")).toEqual(["build"]);
  });

  it("never repeats a symbol", () => {
    const names = extractSymbols("useState();\nuseState();").map(s => s.name);
    expect(names).toEqual([...new Set(names)]);
  });
});

describe("urlAnatomy", () => {
  it("decomposes a worked URL for the search-params snippet", () => {
    const anatomy = urlAnatomy(SNIPPET)!;
    expect(anatomy.pathname).toBe("/learning");
    expect(anatomy.searchParams).toEqual([{ key: "q", value: "running-shoes" }]);
    expect(anatomy.params).toEqual([]);
    expect(anatomy.url).toBe("/learning?q=running-shoes");
  });

  it("builds the route from the dynamic params the code names", () => {
    const anatomy = urlAnatomy("const params = useParams<{ tag: string; item: string }>()")!;
    expect(anatomy.route).toBe("/shop/[tag]/[item]");
    expect(anatomy.pathname).toBe("/shop/shoes/nike-air-max-97");
    expect(anatomy.params.map(p => p.key)).toEqual(["tag", "item"]);
  });

  it("combines dynamic params with a query string", () => {
    const anatomy = urlAnatomy("useParams<{ slug: string }>();\nsearchParams.get('page')")!;
    expect(anatomy.url).toBe("/shop/hello-world?page=2");
  });

  it("returns nothing for code that touches no routing surface", () => {
    expect(urlAnatomy("const doubled = [1, 2].map(n => n * 2);")).toBeNull();
  });

  it("recognises usePathname on its own", () => {
    expect(urlAnatomy("const pathname = usePathname()")?.pathname).toBe("/learning");
  });
});

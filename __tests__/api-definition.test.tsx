import { render, screen } from "@testing-library/react";
import ts from "typescript";
import { ApiDefinitionCards } from "@/components/api-definition";
import { API_DETAILS } from "@/lib/api-docs-details";
import { annotateCode, conciseNote, importLines, kindInfo, lineNotes, normalizeCode } from "@/lib/annotate-code";

test("normalizeCode removes shared indentation, tabs and stray blank lines", () => {
  expect(normalizeCode("\n\n    def f():\n\t\treturn 1   \n\n\n\n    f()\n\n", "python")).toBe("def f():\n    return 1\n\nf()");
});

test("short notes describe the line instead of echoing it", () => {
  expect(conciseNote("from langgraph.graph import StateGraph, START", "python")).toBe("Import StateGraph, START from langgraph.graph");
  expect(conciseNote("builder.add_edge(START, \"a\")", "python")).toBe("Connect two nodes");
  expect(conciseNote("graph = builder.compile()", "python")).toBe("Build the runnable graph: graph");
  expect(conciseNote("const pathname = usePathname();", "typescript")).toBe("Call usePathname() and keep pathname");
  expect(conciseNote("}", "typescript")).toBeUndefined();
  for (const note of lineNotes(API_DETAILS["langgraph:StateGraph"].code, "python")) if (note) expect(note.length).toBeLessThanOrEqual(64);
});

test("every authored example stays valid code once annotated", () => {
  for (const [id, detail] of Object.entries(API_DETAILS)) {
    const annotated = annotateCode(normalizeCode(detail.code, detail.language), detail.language);
    if (detail.language === "python") {
      expect(annotated.split("\n").filter(line => line.includes("# ")).length).toBeGreaterThan(0);
      continue;
    }
    const jsx = /<\/?[A-Za-z]/.test(detail.code);
    const file = ts.createSourceFile(`x.${jsx ? "tsx" : "ts"}`, annotated, ts.ScriptTarget.Latest, true, jsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    expect({ id, errors: (file as unknown as { parseDiagnostics: unknown[] }).parseDiagnostics.length }).toEqual({ id, errors: 0 });
  }
});

test("imports come from the example, and kinds are named the way learners say them", () => {
  expect(importLines(API_DETAILS["nextjs:usePathname"].code, "usePathname")).toEqual(["import { usePathname } from 'next/navigation';"]);
  expect(kindInfo("Function", "JavaScript / Array.prototype", "array.map(callbackFn)").label).toBe("Method");
  expect(kindInfo("Hook", "react", "useState()").summary).toMatch(/top level of a component/);
});

test("the definition shows what it is, its import, syntax and the example twice", () => {
  const detail = API_DETAILS["nextjs:usePathname"];
  render(<ApiDefinitionCards name="usePathname" kindLabel="Hook" status="Stable" packageName={detail.packageName} signature={detail.signature} parameters={detail.parameters} returns={detail.returns} code={detail.code} language={detail.language} missingSignature="" missingExample="" />);
  for (const name of ["What it is", "Import", "Syntax", "Example", "Example with line notes"]) expect(screen.getByRole("heading", { name })).toBeInTheDocument();
  expect(screen.getByLabelText("usePathname syntax")).toHaveTextContent("import { usePathname } from 'next/navigation';");
  const clean = screen.getByLabelText("example.tsx").textContent!;
  const explained = screen.getByLabelText("example_explained.tsx").textContent!;
  expect(clean).not.toContain("// ");
  expect(explained).toContain("// Call usePathname() and keep pathname");
  expect(explained).toContain("{/* Render <h1> */}");
});

test("built-in identifiers say no import is needed", () => {
  const detail = API_DETAILS["javascript:map"];
  render(<ApiDefinitionCards name="map" kindLabel="Function" status="Stable" packageName={detail.packageName} signature={detail.signature} parameters={detail.parameters} returns={detail.returns} code={detail.code} language={detail.language} missingSignature="" missingExample="" />);
  expect(screen.getByText(/built into the language/)).toBeInTheDocument();
  expect(screen.getByText("Method")).toBeInTheDocument();
});

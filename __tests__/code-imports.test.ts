/** @jest-environment node */
import { withImports } from "@/lib/code-imports";

const lines = (...parts: string[]) => parts.join("\n");

test("a hook used without its import gets one, above the code that uses it", () => {
  const code = lines(
    "export default function Counter() {",
    "  const [count, setCount] = useState(0);",
    "  return <button onClick={() => setCount(count + 1)}>{count}</button>;",
    "}",
  );
  expect(withImports(code, "/app/counter.tsx")).toBe(lines('import { useState } from "react";', code));
});

test("a missing name joins an existing import from the same package", () => {
  const code = lines(
    'import { useState } from "react";',
    "",
    "export function Search() {",
    "  const [query, setQuery] = useState('');",
    "  const deferred = useDeferredValue(query);",
    "  useEffect(() => {}, [deferred]);",
    "  return null;",
    "}",
  );
  const first = withImports(code, "/components/search.tsx").split("\n")[0];
  // One import from react, holding all three names — never a second react import.
  expect(first).toMatch(/^import \{ useState, (useDeferredValue, useEffect|useEffect, useDeferredValue) \} from "react";$/);
  expect(withImports(code, "/components/search.tsx").match(/from "react"/g)).toHaveLength(1);
});

test('"use client" stays first; new imports go after it and after existing imports', () => {
  const code = lines(
    '"use client";',
    'import { useState } from "react";',
    "",
    "export function Nav() {",
    "  const router = useRouter();",
    '  return <Link href="/">Home</Link>;',
    "}",
  );
  const head = withImports(code, "/components/nav.tsx").split("\n").slice(0, 4);
  expect(head.slice(0, 2)).toEqual(['"use client";', 'import { useState } from "react";']);
  expect(head.slice(2).sort()).toEqual(['import Link from "next/link";', 'import { useRouter } from "next/navigation";']);
});

test("Next.js server helpers, zod and the React namespace each come from their one source", () => {
  const route = lines("export async function GET(request: NextRequest) {", "  return NextResponse.json({ ok: true });", "}");
  expect(withImports(route, "/app/api/route.ts").split("\n")[0]).toMatch(/^import \{ Next(Response, NextRequest|Request, NextResponse) \} from "next\/server";$/);
  expect(withImports("const schema = z.object({ name: z.string() });", "/lib/schema.ts")).toBe(
    lines('import { z } from "zod";', "const schema = z.object({ name: z.string() });"));
  expect(withImports("export const Box = React.forwardRef(() => null);", "/box.tsx")).toContain('import * as React from "react";');
});

test("nothing is added for a name that is already bound, however it was bound", () => {
  const aliased = lines('import { useState as useLocal } from "react";', "import * as Nav from 'next/navigation';", "useLocal(1);");
  expect(withImports(aliased, "/a.ts")).toBe(aliased);
  // A local definition shadows the well-known source.
  const local = lines("function useRouter() { return {}; }", "const router = useRouter();");
  expect(withImports(local, "/b.ts")).toBe(local);
  const complete = lines('import Link from "next/link";', 'export const A = () => <Link href="/">a</Link>;');
  expect(withImports(complete, "/c.tsx")).toBe(complete);
});

test("a mention is not a use: prose, types and property access do not trigger imports", () => {
  const code = lines("// Link and Image are imported elsewhere", "const label = 'useState';", "obj.useEffect();", "type Props = { image: Image };");
  expect(withImports(code, "/d.ts")).toBe(code);
});

test("only JavaScript and TypeScript files are touched", () => {
  const python = "def useState(value):\n    return value\nuseState(1)";
  expect(withImports(python, "/app/main.py")).toBe(python);
  expect(withImports("npm install zod")).toBe("npm install zod");
  expect(withImports("")).toBe("");
});

import { codeLineNotes } from "@/lib/code-line-notes";

test.each(["App.jsx", "App.tsx", "App.js", "App.ts"])("%s hides complete JSX returns and resumes after each component", path => {
  const code = [
    "function App() {",
    "  const count = 1;",
    "  return (",
    "    <>",
    '      <Counter label="Close ); here"',
    "        onClick={() => { console.log(')'); }}",
    "        count={count}",
    "      />",
    "      <p>Don't count (parentheses) in JSX text.</p>",
    "      {items.map(item => <span>{item}</span>)}",
    "    </>",
    "  );",
    "}",
    "function double(value) {",
    "  return (value * 2);",
    "}",
  ].join("\n");
  const notes = codeLineNotes(code, path);
  expect(notes.slice(2, 12)).toEqual(Array(10).fill(null));
  expect(notes[1]).toBeTruthy();
  expect(notes[12]).toBeTruthy();
  expect(notes[14]).toBeTruthy();
});

test.each([
  "return <p>Hello</p>;",
  "return ready ? <Ready /> : <Loading />;",
  "return (\n ready ? <Ready /> : <Loading />\n);",
  "const App = () => (\n <main />\n);",
  "const App = () => <main />;",
])("omits comments for %s", code => {
  expect(codeLineNotes(code, "App.tsx").every(note => note === null)).toBe(true);
});

test("strings and source comments containing JSX returns do not hide logic", () => {
  const code = 'const example = "return (<main />)";\n// return (<main />)\nconst count = 1;\nreturn count;';
  expect(codeLineNotes(code, "App.tsx").every(Boolean)).toBe(true);
});

test("ordinary TypeScript generic calls retain their explanations", () => {
  expect(codeLineNotes("return load<Item>(id);\nconst next = 1;", "example.ts").every(Boolean)).toBe(true);
});

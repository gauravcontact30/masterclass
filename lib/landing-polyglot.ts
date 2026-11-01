/**
 * "Same idea, five languages" on the landing page's Techy section: one everyday task as five complete little projects
 * (JavaScript, Python, Go, Rust and PostgreSQL), shown in the Apple-skin code editor (components/code-files.tsx) with
 * a file tree and tabs. The landing page sends one concept a week (landingProPreview).
 * Every file runs as it stands: Go and Rust have their `main` and project file, SQL creates the table it reads, and
 * each printed result is in a comment. Keep it that way when editing: a wrong output on the home page teaches the wrong thing.
 */
export type PolyglotLanguage = "JavaScript" | "Python" | "Go" | "Rust" | "SQL";
export type PolyglotSnippet = { language: PolyglotLanguage; logo: string; path: string; code: string; note: string };
export type PolyglotFile = { path: string; code: string; note: string };
export type PolyglotConcept = { id: string; title: string; idea: string; snippets: PolyglotSnippet[]; files: PolyglotFile[] };

type Draft = { id: string; title: string; idea: string; slug: string; tokio?: boolean; code: Record<PolyglotLanguage, string>; notes: Record<PolyglotLanguage, string> };

const LOGOS: Record<PolyglotLanguage, string> = { JavaScript: "javascript", Python: "python", Go: "go", Rust: "rust", SQL: "postgresql" };
const PATHS = (slug: string): Record<PolyglotLanguage, string> => ({ JavaScript: `javascript/${slug}.js`, Python: `python/${slug}.py`, Go: "go/main.go", Rust: "rust/src/main.rs", SQL: `sql/${slug}.sql` });
const ORDER: PolyglotLanguage[] = ["JavaScript", "Python", "Go", "Rust", "SQL"];

/** One concept's five sources plus the project files each language needs to run them. */
function concept(draft: Draft): PolyglotConcept {
  const paths = PATHS(draft.slug);
  const snippets = ORDER.map(language => ({ language, logo: LOGOS[language], path: paths[language], code: draft.code[language], note: draft.notes[language] }));
  const project: PolyglotFile[] = [
    { path: "javascript/package.json", code: `{\n  "name": "${draft.slug}-js",\n  "private": true,\n  "type": "module",\n  "scripts": { "start": "node ${draft.slug}.js" }\n}`, note: "ES modules, so top-level await works. Run: npm start" },
    { path: "go/go.mod", code: `module example.com/${draft.slug}\n\ngo 1.22`, note: "Run: go run ." },
    { path: "rust/Cargo.toml", code: `[package]\nname = "${draft.slug}"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]${draft.tokio ? '\ntokio = { version = "1", features = ["full"] }' : ""}`, note: "Run: cargo run" },
  ];
  return { id: draft.id, title: draft.title, idea: draft.idea, snippets, files: [...snippets.map(({ path, code, note }) => ({ path, code, note })), ...project] };
}

export const POLYGLOT: PolyglotConcept[] = [
  concept({
    id: "unique", slug: "unique", title: "Remove duplicates, keep the order", idea: "Each language has a set or a map that remembers what it has already seen.",
    code: {
      JavaScript: "const items = [3, 1, 3, 2, 1];\nconst unique = [...new Set(items)];\n\nconsole.log(unique); // [ 3, 1, 2 ]",
      Python: "items = [3, 1, 3, 2, 1]\nunique = list(dict.fromkeys(items))\n\nprint(unique)  # [3, 1, 2]",
      Go: "package main\n\nimport \"fmt\"\n\nfunc main() {\n\titems := []int{3, 1, 3, 2, 1}\n\tseen := map[int]bool{}\n\tunique := []int{}\n\tfor _, v := range items {\n\t\tif !seen[v] {\n\t\t\tseen[v] = true\n\t\t\tunique = append(unique, v)\n\t\t}\n\t}\n\tfmt.Println(unique) // [3 1 2]\n}",
      Rust: "use std::collections::HashSet;\n\nfn main() {\n    let items = vec![3, 1, 3, 2, 1];\n    let mut seen = HashSet::new();\n    let unique: Vec<i32> = items.into_iter().filter(|v| seen.insert(*v)).collect();\n    println!(\"{:?}\", unique); // [3, 1, 2]\n}",
      SQL: "CREATE TEMP TABLE items (position int, value int);\nINSERT INTO items VALUES (1, 3), (2, 1), (3, 3), (4, 2), (5, 1);\n\nSELECT value\nFROM items\nGROUP BY value\nORDER BY MIN(position);\n-- 3, 1, 2",
    },
    notes: {
      JavaScript: "A Set keeps insertion order, so spreading it back keeps the first occurrences.",
      Python: "Dictionaries keep insertion order (Python 3.7+); set() alone would not.",
      Go: "Go has no built-in set: a map of booleans plays the part.",
      Rust: "HashSet::insert returns false for a value already present, which doubles as the filter.",
      SQL: "Grouping removes duplicates; ordering by each value's first position restores the order.",
    },
  }),
  concept({
    id: "count", slug: "count", title: "Count how often each word appears", idea: "A frequency map: the word is the key, the count is the value.",
    code: {
      JavaScript: "const counts = {};\nfor (const w of \"to be or not to be\".split(\" \")) {\n  counts[w] = (counts[w] ?? 0) + 1;\n}\n\nconsole.log(counts); // { to: 2, be: 2, or: 1, not: 1 }",
      Python: "from collections import Counter\n\nprint(Counter(\"to be or not to be\".split()))\n# Counter({'to': 2, 'be': 2, 'or': 1, 'not': 1})",
      Go: "package main\n\nimport (\n\t\"fmt\"\n\t\"strings\"\n)\n\nfunc main() {\n\tcounts := map[string]int{}\n\tfor _, w := range strings.Fields(\"to be or not to be\") {\n\t\tcounts[w]++\n\t}\n\tfmt.Println(counts) // map[be:2 not:1 or:1 to:2]\n}",
      Rust: "use std::collections::HashMap;\n\nfn main() {\n    let mut counts: HashMap<&str, i32> = HashMap::new();\n    for w in \"to be or not to be\".split_whitespace() {\n        *counts.entry(w).or_insert(0) += 1;\n    }\n    println!(\"{}\", counts[\"to\"]); // 2\n}",
      SQL: "CREATE TEMP TABLE words (word text);\nINSERT INTO words VALUES ('to'), ('be'), ('or'), ('not'), ('to'), ('be');\n\nSELECT word, COUNT(*) AS n\nFROM words\nGROUP BY word\nORDER BY n DESC, word;\n-- be 2, to 2, not 1, or 1",
    },
    notes: {
      JavaScript: "?? 0 starts a word that has not been seen yet at zero.",
      Python: "Counter is a dict subclass made for exactly this.",
      Go: "A missing key reads as 0, so ++ just works; fmt prints maps sorted by key.",
      Rust: "The entry API inserts 0 for a new word and hands back a mutable count.",
      SQL: "GROUP BY does the bucketing; COUNT(*) does the counting.",
    },
  }),
  concept({
    id: "fallback", slug: "fallback", title: "Fall back when a value is missing", idea: "Say what happens when there is nothing there, instead of crashing on it.",
    code: {
      JavaScript: "const user = { name: null };\n\nconsole.log(user.name ?? \"Guest\"); // Guest",
      Python: "user = {\"name\": None}\n\nprint(user.get(\"name\") or \"Guest\")  # Guest",
      Go: "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tvar name *string\n\tdisplay := \"Guest\"\n\tif name != nil {\n\t\tdisplay = *name\n\t}\n\tfmt.Println(display) // Guest\n}",
      Rust: "fn main() {\n    let name: Option<&str> = None;\n    println!(\"{}\", name.unwrap_or(\"Guest\")); // Guest\n}",
      SQL: "CREATE TEMP TABLE users (id int, name text);\nINSERT INTO users VALUES (1, 'Asha'), (2, NULL);\n\nSELECT id, COALESCE(name, 'Guest') AS display_name\nFROM users;\n-- 1 Asha, 2 Guest",
    },
    notes: {
      JavaScript: "?? only falls back on null or undefined, so an empty string would be kept.",
      Python: "or also replaces \"\" and 0; check `is None` when those are valid values.",
      Go: "A nil pointer is Go's \"no value\": check it before dereferencing.",
      Rust: "Option makes the missing case part of the type, so it cannot be forgotten.",
      SQL: "COALESCE returns its first argument that is not NULL.",
    },
  }),
  concept({
    id: "wait", slug: "wait", title: "Wait half a second, then carry on", idea: "Pausing work without freezing everything else is where the languages differ most.", tokio: true,
    code: {
      JavaScript: "const wait = ms => new Promise(resolve => setTimeout(resolve, ms));\n\nawait wait(500);\nconsole.log(\"done\");",
      Python: "import asyncio\n\n\nasync def main():\n    await asyncio.sleep(0.5)\n    print(\"done\")\n\n\nasyncio.run(main())",
      Go: "package main\n\nimport (\n\t\"fmt\"\n\t\"time\"\n)\n\nfunc main() {\n\ttime.Sleep(500 * time.Millisecond)\n\tfmt.Println(\"done\")\n}",
      Rust: "use std::time::Duration;\n\n#[tokio::main]\nasync fn main() {\n    tokio::time::sleep(Duration::from_millis(500)).await;\n    println!(\"done\");\n}",
      SQL: "SELECT pg_sleep(0.5);\nSELECT 'done';",
    },
    notes: {
      JavaScript: "The event loop keeps running other work while this await is pending.",
      Python: "asyncio.sleep yields to other tasks; time.sleep would block the whole thread.",
      Go: "Only this goroutine sleeps: run work concurrently with `go` and it keeps going.",
      Rust: "With Tokio the sleep is a future, so other tasks run meanwhile.",
      SQL: "PostgreSQL's pg_sleep pauses the current session only.",
    },
  }),
];

/**
 * "Same idea, five languages" on the landing page's Techy section: one everyday task written idiomatically in
 * JavaScript, Python, Go, Rust and SQL (PostgreSQL). The landing page sends one concept a week (landingProPreview).
 * Every snippet is standard library only (Rust's async one uses Tokio) and its printed result is in the comment, so
 * keep them runnable when editing: a wrong output on the home page teaches the wrong thing.
 */
export type PolyglotSnippet = { language: "JavaScript" | "Python" | "Go" | "Rust" | "SQL"; logo: string; code: string; note: string };
export type PolyglotConcept = { id: string; title: string; idea: string; snippets: PolyglotSnippet[] };

export const POLYGLOT: PolyglotConcept[] = [
  {
    id: "unique", title: "Remove duplicates, keep the order", idea: "Each language has a set or a map that remembers what it has already seen.",
    snippets: [
      { language: "JavaScript", logo: "javascript", code: "const unique = [...new Set([3, 1, 3, 2, 1])];\nconsole.log(unique); // [3, 1, 2]", note: "A Set keeps insertion order, so spreading it back keeps the first occurrences." },
      { language: "Python", logo: "python", code: "items = [3, 1, 3, 2, 1]\nunique = list(dict.fromkeys(items))\nprint(unique)  # [3, 1, 2]", note: "Dictionaries keep insertion order (Python 3.7+); set() alone would not." },
      { language: "Go", logo: "go", code: "items := []int{3, 1, 3, 2, 1}\nseen := map[int]bool{}\nunique := []int{}\nfor _, v := range items {\n\tif !seen[v] {\n\t\tseen[v] = true\n\t\tunique = append(unique, v)\n\t}\n}\nfmt.Println(unique) // [3 1 2]", note: "Go has no built-in set: a map of booleans plays the part." },
      { language: "Rust", logo: "rust", code: "use std::collections::HashSet;\n\nlet items = vec![3, 1, 3, 2, 1];\nlet mut seen = HashSet::new();\nlet unique: Vec<i32> = items.into_iter().filter(|v| seen.insert(*v)).collect();\nprintln!(\"{:?}\", unique); // [3, 1, 2]", note: "HashSet::insert returns false for a value already present, which doubles as the filter." },
      { language: "SQL", logo: "postgresql", code: "SELECT value\nFROM items\nGROUP BY value\nORDER BY MIN(position);\n-- 3, 1, 2", note: "Grouping removes duplicates; ordering by each value's first position restores the order." },
    ],
  },
  {
    id: "count", title: "Count how often each word appears", idea: "A frequency map: the word is the key, the count is the value.",
    snippets: [
      { language: "JavaScript", logo: "javascript", code: "const counts = {};\nfor (const w of \"to be or not to be\".split(\" \")) {\n  counts[w] = (counts[w] ?? 0) + 1;\n}\nconsole.log(counts); // { to: 2, be: 2, or: 1, not: 1 }", note: "?? 0 starts a word that has not been seen yet at zero." },
      { language: "Python", logo: "python", code: "from collections import Counter\n\nprint(Counter(\"to be or not to be\".split()))\n# Counter({'to': 2, 'be': 2, 'or': 1, 'not': 1})", note: "Counter is a dict subclass made for exactly this." },
      { language: "Go", logo: "go", code: "counts := map[string]int{}\nfor _, w := range strings.Fields(\"to be or not to be\") {\n\tcounts[w]++\n}\nfmt.Println(counts) // map[be:2 not:1 or:1 to:2]", note: "A missing key reads as 0, so ++ just works; fmt prints maps sorted by key." },
      { language: "Rust", logo: "rust", code: "use std::collections::HashMap;\n\nlet mut counts: HashMap<&str, i32> = HashMap::new();\nfor w in \"to be or not to be\".split_whitespace() {\n    *counts.entry(w).or_insert(0) += 1;\n}\nprintln!(\"{}\", counts[\"to\"]); // 2", note: "The entry API inserts 0 for a new word and hands back a mutable count." },
      { language: "SQL", logo: "postgresql", code: "SELECT word, COUNT(*) AS n\nFROM words\nGROUP BY word\nORDER BY n DESC;", note: "GROUP BY does the bucketing; COUNT(*) does the counting." },
    ],
  },
  {
    id: "fallback", title: "Fall back when a value is missing", idea: "Say what happens when there is nothing there, instead of crashing on it.",
    snippets: [
      { language: "JavaScript", logo: "javascript", code: "const user = { name: null };\nconsole.log(user.name ?? \"Guest\"); // Guest", note: "?? only falls back on null or undefined, so an empty string would be kept." },
      { language: "Python", logo: "python", code: "user = {\"name\": None}\nprint(user.get(\"name\") or \"Guest\")  # Guest", note: "or also replaces \"\" and 0; check `is None` when those are valid values." },
      { language: "Go", logo: "go", code: "var name *string\ndisplay := \"Guest\"\nif name != nil {\n\tdisplay = *name\n}\nfmt.Println(display) // Guest", note: "A nil pointer is Go's \"no value\": check it before dereferencing." },
      { language: "Rust", logo: "rust", code: "let name: Option<&str> = None;\nprintln!(\"{}\", name.unwrap_or(\"Guest\")); // Guest", note: "Option makes the missing case part of the type, so it cannot be forgotten." },
      { language: "SQL", logo: "postgresql", code: "SELECT COALESCE(name, 'Guest') AS display_name\nFROM users;", note: "COALESCE returns its first argument that is not NULL." },
    ],
  },
  {
    id: "wait", title: "Wait half a second, then carry on", idea: "Pausing work without freezing everything else is where the languages differ most.",
    snippets: [
      { language: "JavaScript", logo: "javascript", code: "const wait = ms => new Promise(resolve => setTimeout(resolve, ms));\n\nawait wait(500);\nconsole.log(\"done\");", note: "The event loop keeps running other work while this await is pending." },
      { language: "Python", logo: "python", code: "import asyncio\n\nasync def main():\n    await asyncio.sleep(0.5)\n    print(\"done\")\n\nasyncio.run(main())", note: "asyncio.sleep yields to other tasks; time.sleep would block the whole thread." },
      { language: "Go", logo: "go", code: "time.Sleep(500 * time.Millisecond)\nfmt.Println(\"done\")", note: "Only this goroutine sleeps: run work concurrently with `go` and it keeps going." },
      { language: "Rust", logo: "rust", code: "#[tokio::main]\nasync fn main() {\n    tokio::time::sleep(std::time::Duration::from_millis(500)).await;\n    println!(\"done\");\n}", note: "With Tokio the sleep is a future, so other tasks run meanwhile." },
      { language: "SQL", logo: "postgresql", code: "SELECT pg_sleep(0.5);", note: "PostgreSQL's pg_sleep pauses the current session only." },
    ],
  },
];

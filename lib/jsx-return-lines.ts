/** Locate JSX return expressions without adding a compiler to the browser bundle. */
export function jsxReturnLines(code: string): Set<number> {
  const hidden = new Set<number>();
  const pairs: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
  const isJsx = (at: number) => /^<(?:>|[A-Za-z][\w.:-]*(?=[\s/>]))/.test(code.slice(at));

  function skipLiteral(at: number): number {
    const quote = code[at];
    if (quote === '"' || quote === "'" || quote === "`") {
      for (let i = at + 1; i < code.length; i++) {
        if (code[i] === "\\") { i++; continue; }
        if (code[i] === quote) return i + 1;
      }
      return code.length;
    }
    if (code.startsWith("//", at)) {
      const end = code.indexOf("\n", at);
      return end < 0 ? code.length : end;
    }
    if (code.startsWith("/*", at)) {
      const end = code.indexOf("*/", at + 2);
      return end < 0 ? code.length : end + 2;
    }
    return at;
  }

  function expression(at: number, closing = ""): { end: number; jsx: boolean } {
    let jsx = false;
    let i = at;
    for (; i < code.length; i++) {
      if (closing && code[i] === closing) return { end: i + 1, jsx };
      if (!closing && /[;\n\r}]/.test(code[i])) break;
      const skipped = skipLiteral(i);
      if (skipped !== i) { i = skipped - 1; continue; }
      if (isJsx(i)) {
        const end = element(i);
        if (end !== null) { i = end - 1; jsx = true; continue; }
      }
      if (pairs[code[i]]) {
        const nested = expression(i + 1, pairs[code[i]]);
        jsx ||= nested.jsx;
        i = nested.end - 1;
      }
    }
    return { end: i, jsx };
  }

  function element(at: number): number | null {
    let depth = 0;
    let i = at;
    while (i < code.length) {
      if (code[i] === "{") { i = expression(i + 1, "}").end; continue; }
      if (code[i] !== "<") { i++; continue; }
      const closing = code[i + 1] === "/";
      i += closing ? 2 : 1;
      while (i < code.length && code[i] !== ">") {
        const skipped = skipLiteral(i);
        if (skipped !== i) { i = skipped; continue; }
        if (code[i] === "{") { i = expression(i + 1, "}").end; continue; }
        i++;
      }
      const selfClosing = code[i - 1] === "/";
      depth += closing ? -1 : selfClosing ? 0 : 1;
      i++;
      if (depth <= 0) return i;
    }
    return null;
  }

  for (let at = 0; at < code.length; at++) {
    const skipped = skipLiteral(at);
    if (skipped !== at) { at = skipped - 1; continue; }
    const explicit = code.startsWith("return", at) && !/[\w$]/.test(code[at - 1] ?? "") && !/[\w$]/.test(code[at + 6] ?? "");
    const implicit = code.startsWith("=>", at);
    if (!explicit && !implicit) continue;
    let start = at + (explicit ? 6 : 2);
    while (/\s/.test(code[start] ?? "") && start < code.length) start++;
    if (implicit && code[start] === "{") continue;
    const result = expression(start);
    if (!result.jsx) continue;
    const first = code.slice(0, at).split("\n").length - 1;
    const last = code.slice(0, result.end).split("\n").length - 1;
    for (let line = first; line <= last; line++) hidden.add(line);
    at = result.end - 1;
  }
  return hidden;
}

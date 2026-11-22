// Builds lib/interview-digest-bank.json from the Tech Daily Digest PDF (text extracted with pdftotext -layout).
// Usage: node scripts/build-interview-bank.mjs <digest.txt>
import { readFileSync, writeFileSync } from "node:fs";
const raw = readFileSync(process.argv[2], "utf8").replace(/\r/g, "");
const pages = raw.split("\f");
const norm = s => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const clean = s => s.replace(/�/g, "·").replace(/\s*\n\s*/g, " ").replace(/\s{2,}/g, " ").trim();
const HEAD = /^\s*(\S{1,3})\s+(.+?)\s{2,}[A-Z][a-z]{2}, \d+ [A-Z][a-z]{2} \d{4}\s*$/;
const techs = []; let tech = null; const seen = new Set();
const meta = new Map(); // normalised question -> { level, note, askedAt }
const slug = s => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
for (const page of pages) {
  const lines = page.split("\n"); const first = lines.filter(l => l.trim());
  if (!first.length) continue;
  if (/TECHNOLOGY SECTION/.test(first[0])) {
    const name = first[1].trim(); tech = { id: slug(name), name, code: first[0].trim().split(/\s+/)[0], items: [] }; techs.push(tech); continue;
  }
  if (!tech) continue;
  const head = first[0].match(HEAD); const topic = head ? head[2].trim() : "General";
  const body = lines.slice(lines.indexOf(first[0]) + 1).join("\n");
  if (/Interview Questions\s*$/m.test(body.split("\n").filter(l => l.trim())[0] ?? "")) {
    const blocks = body.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean).slice(1);
    let q = null;
    for (const b of blocks) {
      if (/^Sources:/.test(b)) continue;
      const m = b.match(/^(HIGH|MEDIUM|LOW)\s+(.*?)(?:\s+Asked at:\s*(.*))?$/s);
      if (m && q) { meta.set(norm(q), { level: m[1].toLowerCase(), note: clean(m[2]), askedAt: clean(m[3] ?? "") }); q = null; } else q = clean(b);
    }
  } else if (/Answers \(\d+\/\d+\)/.test(body.split("\n").slice(0, 3).join("\n"))) {
    const text = body.replace(/\nSources:.*$/s, "");
    for (const part of text.split(/^Q\. /m).slice(1)) {
      const [qPart, ...rest] = part.split(/^A\. /m); if (!rest.length) continue;
      const q = clean(qPart), a = rest.join("A. ").trim().replace(/[ \t]+\n/g, "\n").replace(/(?<!\n)\n(?!\n)/g, " ").replace(/\n{2,}/g, "\n\n").replace(/ {2,}/g, " ");
      const key = tech.id + "|" + norm(q); if (seen.has(key)) continue; seen.add(key);
      tech.items.push({ q, a, topic });
    }
  }
}
const out = techs.filter(t => t.items.length).map(t => ({ id: t.id, name: t.name, code: t.code, items: t.items.map((it, i) => {
  const m = meta.get(norm(it.q)); return { id: `${t.id}-${i + 1}`, q: it.q, a: it.a, topic: it.topic, level: m?.level ?? "medium", ...(m?.askedAt ? { askedAt: m.askedAt } : {}) };
}) }));
writeFileSync(new URL("../lib/interview-digest-bank.json", import.meta.url), JSON.stringify(out));
for (const t of out) console.log(t.name.padEnd(24), t.items.length, "meta-matched:", t.items.filter(i => meta.has(norm(i.q))).length);
console.log("total", out.reduce((s, t) => s + t.items.length, 0));

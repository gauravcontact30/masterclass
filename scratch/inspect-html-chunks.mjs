const res = await fetch("http://localhost:3000");
const html = await res.text();
const matches = [...html.matchAll(/_next\/static\/chunks\/[^"'\s\\]+/g)].map(m => m[0]);
console.log("Found", matches.length, "chunk references in HTML:");
for (const m of new Set(matches)) {
  const check = await fetch(`http://localhost:3000/${m}`);
  console.log(`${check.status} - http://localhost:3000/${m}`);
}

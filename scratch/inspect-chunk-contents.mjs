const chunks = [
  "/_next/static/chunks/_0qc_kwo._.js",
  "/_next/static/chunks/_0p0kxbf._.js",
  "/_next/static/chunks/components_0e_4zgb._.js",
  "/_next/static/chunks/_04lj5x4._.js",
  "/_next/static/chunks/_0fndwio._.js",
  "/_next/static/chunks/components_14a4e40._.js"
];

for (const c of chunks) {
  const res = await fetch("http://localhost:3000" + c);
  const text = await res.text();
  const firstLines = text.slice(0, 300).replace(/\n/g, " ");
  console.log(`\n=== ${c} ===`);
  console.log(firstLines);
}

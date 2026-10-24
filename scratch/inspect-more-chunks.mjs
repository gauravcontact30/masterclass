const chunks = [
  "/_next/static/chunks/_0ir9685._.js",
  "/_next/static/chunks/_1c7hh-y._.js",
  "/_next/static/chunks/_16b5098._.js",
  "/_next/static/chunks/_0im023j._.js"
];

for (const c of chunks) {
  const res = await fetch("http://localhost:3000" + c);
  const text = await res.text();
  console.log(`\n=== ${c} ===`);
  console.log(text.slice(0, 250).replace(/\n/g, " "));
}

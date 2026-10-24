const res = await fetch("http://localhost:3000");
const html = await res.text();
const regex = /<link rel="preload" href="([^"]+)" as="script"/g;
let match;
while ((match = regex.exec(html)) !== null) {
  const url = match[1];
  const check = await fetch("http://localhost:3000" + url);
  console.log(`${check.status} - ${url}`);
}

import fs from "node:fs";
import path from "node:path";

function searchDir(dir, pattern) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchDir(full, pattern);
    } else if (entry.name.endsWith(".json") || entry.name.endsWith(".js") || entry.name.endsWith(".html")) {
      try {
        const content = fs.readFileSync(full, "utf8");
        if (content.includes(pattern)) {
          console.log(`Found "${pattern}" in: ${full}`);
        }
      } catch {}
    }
  }
}

searchDir(".next", "1embp48");
searchDir(".next", "0yhgqiy");
console.log("Search finished.");

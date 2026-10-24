const fs = require("fs");
const path = require("path");

const logPath = path.join(process.cwd(), ".next", "dev", "logs", "next-development.log");
const content = fs.readFileSync(logPath, "utf8");
const lines = content.split("\n");
const groups = new Map();

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const json = JSON.parse(line);
    if (json.level === "ERROR" || json.level === "WARN") {
      const key = json.message.split("\n")[0];
      if (!groups.has(key)) {
        groups.set(key, { count: 0, sample: json.message, level: json.level, source: json.source });
      }
      groups.get(key).count++;
    }
  } catch {}
}

console.log(`\n================ TOTAL UNIQUE MESSAGES: ${groups.size} ================\n`);
for (const [key, info] of groups.entries()) {
  console.log(`[${info.level}] (${info.count} times) Source: ${info.source}`);
  console.log(info.sample);
  console.log("-".repeat(80));
}

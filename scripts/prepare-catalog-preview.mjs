import { readFile, writeFile, readdir } from "node:fs/promises";

// Public marketing fallback derived from the checked-in catalog, not invented topics.
const visibleIds = ["react","nextjs","tanstack-start","zustand","redux","redux-toolkit","node","nestjs","angular","vue","express","javascript","typescript","python","java","flutter","graphql","jest","rtl","vitest","playwright","claude","claude-code","prompting","ai","langchain","pytorch","tensorflow","redis","elasticsearch","supabase","git","docker","aws","devops","cypress","agentic-ai","platform-engineering","data-engineering","cybersecurity"];
const technologies = new Map(), topics = new Map();
const files = ["supabase/seed.sql", ...(await readdir("supabase/migrations")).filter(name=>name.endsWith(".sql")).sort().map(name=>`supabase/migrations/${name}`)];
const unquote = value => value.replace(/''/g, "'");
for (const file of files) {
  const sql = await readFile(file,"utf8");
  for (const match of sql.matchAll(/\('((?:[^']|'')*)','((?:[^']|'')*)','((?:[^']|'')*)','((?:[^']|'')*)'\)/g)) {
    const [id,title,title_hi,category] = match.slice(1).map(unquote);
    if (visibleIds.includes(id)) technologies.set(id,{id,title,title_hi,category});
  }
  for (const match of sql.matchAll(/\('((?:[^']|'')*)','((?:[^']|'')*)','((?:[^']|'')*)','((?:[^']|'')*)',(true|false),/g)) {
    const [id,technology_id,title,title_hi] = match.slice(1,5).map(unquote);
    if (visibleIds.includes(technology_id)) topics.set(id,{id,technology_id,title,title_hi,full_track:match[5]==="true"});
  }
}
for (const id of visibleIds) {
  if (!technologies.has(id) || ![...topics.values()].some(topic=>topic.technology_id===id)) throw new Error(`Missing marquee preview: ${id}`);
}
await writeFile("lib/catalog-preview.json",JSON.stringify({technologies:visibleIds.map(id=>technologies.get(id)),topics:[...topics.values()]},null,2)+"\n");

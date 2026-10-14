import { API_PACKAGES } from "../../lib/api-docs";
for (const p of API_PACKAGES) if (/lang|agent|integration|deep/i.test(p.id + p.name + ((p as any).group ?? "") + ((p as any).section ?? ""))) console.log(p.id, "|", p.name, "|", (p as any).group ?? (p as any).section ?? (p as any).category ?? "", "|", p.entries.length);
console.log(Object.keys(API_PACKAGES[0]).join(","));

import { API_PACKAGES } from "../../lib/api-docs";
for (const p of API_PACKAGES) {
  const metadata = p as typeof p & { group?: string; section?: string; category?: string };
  if (/lang|agent|integration|deep/i.test(p.id + p.name + (metadata.group ?? "") + (metadata.section ?? ""))) {
    console.log(p.id, "|", p.name, "|", metadata.group ?? metadata.section ?? metadata.category ?? "", "|", p.entries.length);
  }
}
console.log(Object.keys(API_PACKAGES[0]).join(","));

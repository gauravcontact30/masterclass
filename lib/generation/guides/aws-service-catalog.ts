import type { ServiceEntry } from "@/lib/domain";
import directory from "./aws-directory-generated.json";
import categories from "./aws-directory-categories.json";

/** Official AWS service/API references plus curated purpose-first service notes. */
export const AWS_SERVICE_CATALOG: ServiceEntry[] = [...directory as ServiceEntry[]].sort((a, b) =>
  categories.indexOf(a.category) - categories.indexOf(b.category)
  || Number(a.kind === "capability") - Number(b.kind === "capability")
  || a.name.localeCompare(b.name));

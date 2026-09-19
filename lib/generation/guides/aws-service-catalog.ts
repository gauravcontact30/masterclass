import type { ServiceEntry } from "@/lib/domain";
import directory from "./aws-directory-generated.json";
import categories from "./aws-directory-categories.json";
import { popularityRank } from "./aws-popularity";

/**
 * Official AWS service/API references plus curated purpose-first service notes.
 *
 * Within a category the most widely used services come first (see
 * `aws-popularity.ts` for what that ordering means and how it is maintained),
 * then unranked services alphabetically, with API-only capabilities last.
 */
export const AWS_SERVICE_CATALOG: ServiceEntry[] = [...directory as ServiceEntry[]].sort((a, b) =>
  categories.indexOf(a.category) - categories.indexOf(b.category)
  // Popularity outranks `kind`: "capability" marks an entry generated from an
  // API reference, which says nothing about how important the service is.
  || popularityRank(a.name) - popularityRank(b.name)
  || Number(a.kind === "capability") - Number(b.kind === "capability")
  || a.name.localeCompare(b.name));

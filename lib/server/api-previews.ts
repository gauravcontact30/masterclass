import "server-only";
/**
 * What the API Docs pages may send to the browser. Non-members get the five short entries of each technology
 * (FREE_APIS) and the names of the rest; parameters, examples and practice are only ever read for members. The client
 * components receive these as props, so lib/api-docs-details.ts and lib/api-docs-agentic.ts stay out of the bundle.
 */
import { API_PACKAGES, type ApiEntry, type ApiPackage } from "@/lib/api-docs";
import { agenticSection, agenticSections, AGENTIC_PACKAGE_IDS } from "@/lib/api-docs-agentic";
import { API_DETAILS } from "@/lib/api-docs-details";
import { FIELD_GUIDES, FREE_APIS, fieldGuide } from "@/lib/api-field-guides";
import { shortDefinition } from "@/lib/notes-study";
import { officialApiCard } from "./official-content";

export type ApiPreview = ApiEntry & { summary: string; signature: string };
export type ApiGuideCard = { id: string; name: string; logo: string; tagline: string; version?: string; count: number };
export type AgenticIndex = Record<string, { sections: string[]; of: Record<string, string> }>;
export type ApiMapRow = ApiEntry & { summary: string };

const plain = (text: string) => text.replace(/`/g, "");

/** The stored one-line description of an identifier, if its page has been written. */
export function storedSummary(pkg: ApiPackage, name: string) {
  const text = API_DETAILS[`${pkg.id}:${name}`]?.description ?? officialApiCard(pkg.id, name)?.summary ?? "";
  return text ? shortDefinition(plain(text), 150) : "";
}

/** A technology's free entries: its field guide's essentials, else its first written stable identifiers. */
export function apiPreview(pkg: ApiPackage): ApiPreview[] {
  const guide = fieldGuide(pkg.id);
  if (guide) return guide.essentials.flatMap(item => {
    const entry = pkg.entries.find(candidate => candidate.name === item.name);
    return entry ? [{ ...entry, summary: item.summary, signature: item.signature }] : [];
  });
  const rows: ApiPreview[] = [];
  for (const entry of pkg.entries) {
    if (rows.length === FREE_APIS) break;
    if (entry.status !== "s") continue;
    const summary = storedSummary(pkg, entry.name);
    if (summary) rows.push({ ...entry, summary, signature: API_DETAILS[`${pkg.id}:${entry.name}`]?.signature || officialApiCard(pkg.id, entry.name)?.syntax.split("\n")[0] || "" });
  }
  return rows;
}

export const apiPreviews = () => Object.fromEntries(API_PACKAGES.map(pkg => [pkg.id, apiPreview(pkg)]));

export const apiGuideCards = (): ApiGuideCard[] => FIELD_GUIDES.flatMap(({ id, name, logo, tagline, version }) => {
  const pkg = API_PACKAGES.find(item => item.id === id);
  return pkg ? [{ id, name, logo, tagline, version, count: pkg.entries.length }] : [];
});

/** Members' one-liners for the reference rows. */
export const apiRowSummaries = () => Object.fromEntries(Object.entries(API_DETAILS).map(([key, detail]) => [key, shortDefinition(plain(detail.description), 150)]));

/** Section headings for the agentic frameworks, by entry, without their page content. */
export function agenticIndex(): AgenticIndex {
  return Object.fromEntries(AGENTIC_PACKAGE_IDS.flatMap(id => {
    const pkg = API_PACKAGES.find(item => item.id === id);
    const sections = agenticSections(id);
    if (!pkg || !sections) return [];
    const of = Object.fromEntries(pkg.entries.map(entry => [entry.name, agenticSection(id, entry.name, entry.kind)]));
    // The page lists sections from this array, so an entry filed under a section missing from it would never appear.
    return [[id, { sections: [...new Set([...sections, ...Object.values(of)])], of }]];
  }));
}

/** Every identifier for a technology page. Locked rows carry the name only: no summary reaches a non-member. */
export function apiMapRows(pkg: ApiPackage, member: boolean): ApiMapRow[] {
  const free = new Map(apiPreview(pkg).map(item => [item.name, item.summary]));
  return pkg.entries.filter(entry => !free.has(entry.name)).map(entry => ({ ...entry, summary: member ? storedSummary(pkg, entry.name) : "" }));
}

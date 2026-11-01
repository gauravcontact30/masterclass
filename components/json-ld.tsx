import { jsonLd } from "@/lib/seo";

/**
 * Structured data for search engines. Renders nothing visible. An array becomes one script per item, each with its own
 * top-level @type: answer-engine checkers read only the top level of a script, so an array reads as "no schema".
 */
export function JsonLd({ data }: { data: unknown }) {
  return <>{[data].flat().map((item, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(item) }} />)}</>;
}

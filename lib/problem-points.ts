/* Kept apart from lib/landing-ai-pulse.ts so the landing client bundle does not carry that file's card content. */
/** Joining words that start a new point when they follow a comma ("…spikes, and rendering…"). */
const CLAUSE = /,\s+(?:and|while|but|so|with|whereas)\s+/i;
/**
 * An industry problem as short points: split at sentence breaks, semicolons and comma-joined clauses,
 * with the joining word dropped and each point capitalised, so the card reads as a list instead of a sentence.
 */
export function problemPoints(problem: string): string[] {
  return problem.split(/(?<=\.)\s+|;\s+/).flatMap(part => part.split(CLAUSE))
    .map(part => part.trim().replace(/\.$/, ""))
    .filter(Boolean)
    .map(part => part[0].toUpperCase() + part.slice(1));
}

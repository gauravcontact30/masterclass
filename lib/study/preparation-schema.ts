import { z } from "zod";
import { PREPARATIONS } from "./preparations";

/**
 * Validates a learner's saved preparation selections. Kept apart from lib/study/preparations.ts, which the
 * dashboard bundles on the client, so zod loads only where a request is validated (API routes and server code).
 */
const known = new Set(PREPARATIONS.map(option => option.id));
export const preparationSchema = z.array(z.string().refine(id => known.has(id))).min(1).max(PREPARATIONS.length).refine(ids => new Set(ids).size === ids.length);

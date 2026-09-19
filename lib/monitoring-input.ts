import { z } from 'zod';
// Only dashboard paths; strip query strings and never persist search text or fragments.
export const learningPath = z.string().max(300).regex(/^\/dashboard(?:\/[a-zA-Z0-9_/-]*)?$/).refine(path => !path.includes('//') && !path.includes('..'));
export const presenceInput = z.object({ sessionId: z.uuid(), path: learningPath, view: z.boolean(), loadMs: z.number().finite().min(0).max(120000).optional() }).strict();
export const reportInput = z.object({ path: learningPath, reason: z.enum(['incorrect','inappropriate','spam','broken']), description: z.string().trim().min(10).max(2000) }).strict();
export const reviewInput = z.object({ id: z.uuid(), status: z.enum(['reviewing','resolved','dismissed']), resolution: z.string().trim().min(5).max(1000) }).strict();

/**
 * The error every API route turns into a JSON response (lib/server/http.ts `api`). It lives in its own module so the
 * data layer (repository.ts, portal.ts) can throw it without importing http.ts, which imports them back: that cycle
 * left HttpError uninitialised for whichever module loaded first.
 */
export class HttpError extends Error { constructor(public status: number, public code: string) { super(code); } }

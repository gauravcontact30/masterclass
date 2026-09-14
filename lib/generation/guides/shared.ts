/** When the official documentation behind the technology guides was read. */
export const RETRIEVED_AT = "2026-09-11T00:00:00.000Z";

/** A cited official documentation page. */
export const source = (url: string, title: string) => ({ url, title, retrievedAt: RETRIEVED_AT });

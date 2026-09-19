import retiredIds from "./retired-technologies.json";
const retired = new Set(retiredIds);
export function isRetiredTechnology(id: unknown) { return typeof id === "string" && retired.has(id.toLowerCase()); }

/** Delete only saved items owned by retired tracks, preserving all other browser data. */
export function clearRetiredTechnologyStorage(storage: Pick<Storage, "getItem" | "setItem" | "removeItem">) {
  try {
    if (isRetiredTechnology(storage.getItem("masterclass:pro-track"))) storage.removeItem("masterclass:pro-track");
    for (const [key, field] of [["masterclass:lessons-generated", "track"], ["masterclass:quiz-history", "trackId"]] as const) {
      const raw = storage.getItem(key);
      if (!raw) continue;
      const rows: unknown = JSON.parse(raw);
      if (!Array.isArray(rows)) continue;
      const kept = rows.filter(row => !isRetiredTechnology(row?.[field]));
      if (kept.length !== rows.length) storage.setItem(key, JSON.stringify(kept));
    }
    const done = storage.getItem("masterclass:lessons-done");
    if (done) {
      const rows: unknown = JSON.parse(done);
      if (Array.isArray(rows)) {
        const kept = rows.filter(row => typeof row !== "string" || !isRetiredTechnology(row.split(":")[0]));
        if (kept.length !== rows.length) storage.setItem("masterclass:lessons-done", JSON.stringify(kept));
      }
    }
    const cacheKey = "masterclass:api-detail:v1";
    const rawCache = storage.getItem(cacheKey);
    if (rawCache) {
      const cache: unknown = JSON.parse(rawCache);
      if (cache && typeof cache === "object" && !Array.isArray(cache)) {
        const entries = Object.entries(cache);
        const kept = entries.filter(([key]) => !isRetiredTechnology(key.split(":")[0]));
        if (kept.length !== entries.length) storage.setItem(cacheKey, JSON.stringify(Object.fromEntries(kept)));
      }
    }
  } catch { /* Storage may be unavailable or contain malformed legacy data. */ }
}

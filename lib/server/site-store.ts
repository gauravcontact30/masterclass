import "server-only";
import { db } from "./db";

/*
 * Small public JSON sets that every server instance must share and that must outlive a deploy (the landing page's
 * "Fresh in tech" stories and weekly additions). Kept in Supabase Storage: lib/redis.ts falls back to one memory cache
 * per instance when Upstash is not configured, which lost these sets on each new instance. Never put account data here.
 */
const BUCKET = "site-store";
const fileName = (key: string) => `${key.replace(/[^\w.-]+/g, "-")}.json`;
let provision: Promise<void> | undefined;
async function files() {
  const client = db().storage;
  provision ??= (async () => {
    if ((await client.getBucket(BUCKET)).data) return;
    const created = await client.createBucket(BUCKET, { public: false, fileSizeLimit: 2_000_000, allowedMimeTypes: ["application/json"] });
    if (created.error && !(await client.getBucket(BUCKET)).data) throw new Error(`site-store: ${created.error.message}`);
  })().catch(error => { provision = undefined; throw error; });
  await provision;
  return client.from(BUCKET);
}

/** The stored value, or null when nothing has been stored. Throws when Storage cannot answer, so an outage never reads as "empty" and starts paid work. */
export async function readStored<T>(key: string): Promise<T | null> {
  const { data, error } = await (await files()).download(fileName(key));
  if (error) {
    if ("statusCode" in error && ["404", "400"].includes(String(error.statusCode)) && /not found|does not exist/i.test(error.message)) return null;
    throw new Error(`site-store: ${error.message}`);
  }
  return JSON.parse(await data.text()) as T;
}

export async function writeStored(key: string, value: unknown): Promise<void> {
  const { error } = await (await files()).upload(fileName(key), JSON.stringify(value), { upsert: true, contentType: "application/json", cacheControl: "0" });
  if (error) throw new Error(`site-store: ${error.message}`);
}

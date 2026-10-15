import type { LearningModule } from "./module";

export const REDIS_MODULE: LearningModule = {
  technology: "Redis",
  definition: "Redis is an in-memory data structure store used by millions of developers as a cache, vector database, document database, streaming engine and message broker.",
  overview: "Redis keeps data in RAM and exposes it through purpose-built data types, which is why reads and writes typically complete in well under a millisecond. In a modern stack it sits beside the primary database to absorb read traffic, hold sessions and rate-limit counters, coordinate distributed work and, with the Redis Query Engine and vector sets in Redis 8, serve search and AI retrieval workloads.",
  architecture: [
    { title: "Architecture: keys, typed values and a single command thread", detail: "Every key maps to a typed value: strings, hashes, lists, sets, sorted sets, streams, bitmaps, HyperLogLogs, geospatial indexes, JSON documents and vector sets. Commands execute on one main thread through an event loop, so each command is atomic and there are no lock contentions; optional I/O threads handle network reads and writes. The trade-off is that one slow O(N) command, such as `KEYS *` on a large database, blocks every other client." },
    { title: "Under the hood: memory, persistence and replication", detail: "Data lives in memory, bounded by `maxmemory`; when full, the `maxmemory-policy` (for example `allkeys-lru` or `volatile-ttl`) decides what to evict. Durability is optional: RDB writes point-in-time snapshots and AOF logs every write with a configurable fsync. Replication is asynchronous from primary to replicas, Sentinel provides automatic failover, and Redis Cluster shards the keyspace across 16,384 hash slots." },
    { title: "Core building blocks: expiry, atomic composition and messaging", detail: "TTLs (`EX`, `PX`, `EXPIRE`) make keys self-cleaning, which is what makes Redis a natural cache. `MULTI`/`EXEC` transactions, pipelines and server-side Lua scripts or functions compose several operations atomically or cheaply. Pub/Sub delivers fire-and-forget messages, while Streams with consumer groups provide durable, acknowledged queues for event processing." },
  ],
  code: [
    { path: "lib/cache.ts", note: "Cache-aside, invalidation and a leaderboard with node-redis", code: `import { createClient } from "redis";

// One shared client per process; reconnects automatically.
const redis = await createClient({ url: process.env.REDIS_URL })
  .on("error", err => console.error("Redis client error", err))
  .connect();

type Product = { id: string; name: string; price: number };

export async function getProduct(id: string, load: (id: string) => Promise<Product>) {
  const key = \`product:\${id}\`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as Product;     // cache hit

  const product = await load(id);                        // miss: read the source of truth
  // TTL with jitter bounds staleness and avoids mass expiry at the same moment.
  await redis.set(key, JSON.stringify(product), { EX: 300 + Math.floor(Math.random() * 60) });
  return product;
}

export async function invalidateProduct(id: string) {
  await redis.del(\`product:\${id}\`);                    // call after the database write commits
}

// Sorted sets keep a ranking ordered on every write.
export async function addScore(userId: string, points: number) {
  await redis.zIncrBy("leaderboard:weekly", points, \`user:\${userId}\`);
}

export async function topTen() {
  return redis.zRangeWithScores("leaderboard:weekly", 0, 9, { REV: true });
}` },
  ],
  problem: { title: "A primary database that cannot absorb every read", scenario: "Without a cache, every page view hits the primary database: hot rows are re-read thousands of times per second, latency climbs under load, and features such as rate limits, sessions, counters and leaderboards turn into contended row updates. Redis serves that hot data from memory in sub-millisecond time with atomic operations on purpose-built types, so the database handles writes and complex queries while Redis absorbs the repetitive, latency-sensitive traffic." },
  useCases: [
    { title: "Read-through caching for high-traffic APIs", scenario: "A travel site caches fare searches and hotel details with cache-aside and short TTLs, cutting database load by an order of magnitude during sales. Writes delete the affected keys after the database commits, and a lock with `SET NX PX` ensures only one request rebuilds a hot key when it expires." },
    { title: "Sessions, rate limiting and real-time counters", scenario: "An API gateway stores sessions as hashes with idle expiry and enforces per-key limits with `INCR` plus `EXPIRE` in a transaction or a Lua script, so every gateway instance shares one consistent view of each client's usage." },
    { title: "Leaderboards, queues and AI retrieval", scenario: "A gaming platform ranks players in sorted sets updated on every match, processes match events through a stream with consumer groups, and uses vector search in Redis to retrieve similar player profiles for recommendations and semantic caching of LLM responses." },
  ],
  subjective: [
    { rating: "Critical for Senior Roles", question: "Redis executes commands on a single thread. Why is it still fast, and what operational rules follow from that design?", answer: "It is fast because data is in memory, data structures are optimized for their operations, the event loop multiplexes thousands of connections without context switching or locks, and most commands are O(1) or O(log N). Since 6.0, optional I/O threads parallelize socket reads and writes while command execution stays single-threaded, which preserves atomicity. The rules that follow: never run O(N) commands such as `KEYS`, large `SMEMBERS` or `HGETALL` on huge values in production (use `SCAN`, `SSCAN` or `HSCAN`), avoid very large keys, delete big keys with `UNLINK` so memory is freed in the background, keep Lua scripts short because they block the server, and use pipelining to cut round trips. Scale CPU-bound workloads horizontally with Cluster." },
    { rating: "High / Common", question: "How do you keep a Redis cache consistent with the database, and how do you prevent a cache stampede?", answer: "The usual pattern is cache-aside: read from Redis, fall back to the database on a miss and populate with a TTL; on writes, update the database first and then delete (rather than update) the cache key, which avoids racing writers leaving a stale value. TTLs bound how long any inconsistency can last. A stampede happens when a hot key expires and many requests rebuild it at once; prevent it with a short lock (`SET lock:key token NX PX 5000`) so only one request recomputes while others wait or serve stale data, add random jitter to TTLs so keys do not expire together, and refresh very hot keys early in the background before they expire." },
    { rating: "Common in system-design rounds", question: "Compare RDB, AOF, replication, Sentinel and Cluster. What data can you lose, and how do you choose?", answer: "RDB snapshots are compact and fast to restart from but lose everything since the last snapshot. AOF logs every write; with `appendfsync everysec` you can lose about one second, with `always` almost nothing at a throughput cost, and many deployments enable both. Replication is asynchronous, so a failover can lose writes the primary acknowledged but had not yet replicated; `WAIT` reduces but does not eliminate that window. Sentinel monitors a primary and its replicas and promotes one automatically. Cluster shards data across hash slots for capacity and throughput, with replicas per shard, but multi-key operations require all keys in one slot, which you enforce with hash tags such as `{user:42}`. A pure cache may skip persistence; a session or queue store needs AOF and replicas." },
  ],
  objective: [
    { question: "Which single command atomically acquires a simple distributed lock that expires after 30 seconds?", options: ["`SETNX lock:job 1` followed by `EXPIRE lock:job 30`", "`SET lock:job <token> NX PX 30000`", "`INCR lock:job`", "`GETSET lock:job 1`"], answer: 1, explanation: "`SET` with `NX` and `PX` sets the value only if the key is absent and attaches the expiry in one atomic command; the unique token lets the owner release it safely. `SETNX` plus `EXPIRE` is two commands, so a crash between them leaves a lock that never expires. `INCR` and `GETSET` do not express acquire-with-expiry." },
    { question: "You need to iterate over keys matching `session:*` in production. Which command should you use?", options: ["`KEYS session:*`", "`SCAN 0 MATCH session:* COUNT 100`, repeated with the returned cursor", "`FLUSHDB`", "`DUMP session:*`"], answer: 1, explanation: "`SCAN` walks the keyspace incrementally with a cursor, so it never blocks the server for long. `KEYS` is O(N) and blocks all clients on a large database, `FLUSHDB` deletes everything, and `DUMP` serializes a single key." },
    { question: "In Redis Cluster, an `MGET user:42:name user:42:email` fails with a CROSSSLOT error. What is the fix?", options: ["Increase `maxmemory`", "Use hash tags such as `{user:42}:name` and `{user:42}:email` so both keys map to the same slot", "Switch the eviction policy to `allkeys-lru`", "Disable replication"], answer: 1, explanation: "Cluster only allows multi-key commands when all keys hash to one slot, and hash tags make only the part inside braces count toward the slot. Memory limits, eviction policies and replication have no effect on slot placement." },
  ],
  keyPoints: [
    "One command thread makes every command atomic, and a slow one blocks everybody.",
    "Use `SCAN`, never `KEYS`, on production data.",
    "Cache-aside: write the database, then delete the key; add TTL jitter.",
    "Replication is asynchronous, so a failover can lose acknowledged writes.",
  ],
  sources: [
    { title: "Redis documentation", url: "https://redis.io/docs/latest/" },
    { title: "Redis data types", url: "https://redis.io/docs/latest/develop/data-types/" },
    { title: "Redis persistence", url: "https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/" },
    { title: "node-redis guide", url: "https://redis.io/docs/latest/develop/clients/nodejs/" },
  ],
};

/**
 * A fake Supabase client for server unit tests.
 *
 * Every builder method (select, eq, in, insert, …) is recorded and returns the
 * builder, so any chain the code under test writes is accepted. Awaiting the
 * chain, or calling maybeSingle()/single(), resolves with the next scripted
 * result for that table (or the default { data: null, error: null }).
 * `rpc` and `auth.admin` are plain jest mocks.
 */
export type Result = { data?: unknown; error?: { message: string; code?: string } | null; count?: number | null };
export type Call = { table: string; method: string; args: unknown[] };

const CHAIN = ["select", "insert", "update", "upsert", "delete", "eq", "neq", "in", "is", "gt", "gte", "lt", "lte", "like", "ilike", "or", "not", "match", "filter", "contains", "order", "range", "limit", "returns", "throwOnError"] as const;

export function fakeSupabase() {
  const calls: Call[] = [];
  const queues = new Map<string, Result[]>();
  const next = (table: string): Result => {
    const queue = queues.get(table);
    return (queue && queue.length ? queue.shift() : undefined) ?? { data: null, error: null };
  };
  const builder = (table: string) => {
    const self: Record<string, unknown> = {};
    for (const method of CHAIN) self[method] = (...args: unknown[]) => { calls.push({ table, method, args }); return self; };
    const settle = (method: string) => { calls.push({ table, method, args: [] }); const result = next(table); return Promise.resolve({ error: null, ...result }); };
    self.maybeSingle = () => settle("maybeSingle");
    self.single = () => settle("single");
    self.then = (resolve: (value: Result) => unknown, reject?: (reason: unknown) => unknown) => Promise.resolve({ error: null, ...next(table) }).then(resolve, reject);
    return self;
  };
  const storageBucket = { upload: jest.fn(async () => ({ data: {}, error: null })), download: jest.fn(async () => ({ data: new Blob(["file"]), error: null })), remove: jest.fn(async () => ({ data: [], error: null })), createSignedUrl: jest.fn(async () => ({ data: { signedUrl: "https://signed.example/file" }, error: null })) };
  const client = {
    from: jest.fn((table: string) => { calls.push({ table, method: "from", args: [] }); return builder(table); }),
    rpc: jest.fn(async () => ({ data: null, error: null })),
    auth: { admin: { updateUserById: jest.fn(async () => ({ data: {}, error: null })), deleteUser: jest.fn(async () => ({ data: {}, error: null })), getUserById: jest.fn(async () => ({ data: { user: null }, error: null })) } },
    storage: { from: jest.fn(() => storageBucket) },
  };
  return {
    client, calls, storageBucket,
    /** Queue results for a table, consumed in order by awaited chains. */
    respond(table: string, ...results: Result[]) { queues.set(table, [...(queues.get(table) ?? []), ...results]); },
    /** Calls made against one table, as "method" names in order. */
    methods(table: string) { return calls.filter(call => call.table === table).map(call => call.method); },
    argsOf(table: string, method: string) { return calls.filter(call => call.table === table && call.method === method).map(call => call.args); },
  };
}

/** The `check` helper from lib/server/db, reproduced so mocks of that module keep its behaviour. */
export function check<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data;
}

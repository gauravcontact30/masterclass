import { o, s, type WorkflowPrep } from "./types";

/** Full detail and the most-asked interview questions for the System Design blueprints. */
export const SYSTEM_DESIGN_PREP: Record<string, WorkflowPrep> = {
  "food-delivery": {
    stack: ["API gateway (Kong, Envoy or AWS API Gateway)", "Order, payment, restaurant and dispatch microservices", "PostgreSQL with a transactional outbox", "Kafka (or Amazon MSK)", "Redis geo index (GEOADD / GEOSEARCH)", "WebSocket gateway for live tracking", "Payment gateway with webhooks (UPI, cards)", "Push (FCM / APNs) and SMS providers"],
    decisions: [
      "A saga orchestrated by the order service instead of one distributed transaction: each step (pay, accept, assign) has a compensating action such as refund or cancel.",
      "A transactional outbox: the order row and its event are written in one database transaction and relayed to Kafka, so an event is never lost or sent for an order that was rolled back.",
      "Idempotency keys on order creation and payment, so a retry after a timeout never creates two orders or charges twice.",
      "Rider locations live in an in-memory geo index (Redis) with short TTLs, not in the orders database: they change every few seconds and only the latest point matters.",
      "Kafka topics partitioned by order ID: events for one order are processed in sequence, while different orders scale across partitions.",
    ],
    pitfalls: [
      "Calling payment, restaurant and dispatch synchronously in one request, so one slow partner times out the whole checkout.",
      "Publishing to Kafka after the database commit without an outbox, losing events whenever the process crashes in between.",
      "Treating the payment gateway's redirect as proof of payment instead of verifying its signed webhook or querying its status API.",
      "Offering one order to many riders at once without a lock, so two riders arrive for the same food.",
      "Writing every GPS ping to the primary database, which turns the busiest data into the most expensive writes.",
    ],
    metrics: ["Order confirmation p99 latency (target: about a second)", "Time to rider assignment (target: under a minute at peak)", "Payment success rate and duplicate-charge count (target: zero)", "Restaurant acceptance rate and time to accept", "On-time delivery rate: actual vs promised ETA"],
    subjective: [
      s(5, "Design a food delivery platform like Swiggy or Zomato: walk through what happens from 'Place order' to delivery.", "The app sends the order with an idempotency key to the API gateway, which routes it to the order service. That service validates prices and opening hours, writes the order and an outbox event in one transaction, and starts a saga: authorise payment, then publish OrderPaid to Kafka. The restaurant service gets it and the restaurant accepts with a prep time; dispatch queries a Redis geo index for nearby riders, scores them and offers the order with a timeout. Riders' GPS updates the index, and a tracking service pushes live ETA over WebSockets while notifications fire on each status change. Failures run compensations: refund if the restaurant rejects, re-offer if a rider declines."),
      s(5, "How do you make sure a customer is never charged twice for one order?", "Send an idempotency key from the client on order creation and reuse it for the payment request, so retries return the same order and the same payment attempt. Store payment attempts with a unique constraint on that key, treat the gateway's signed webhook as the source of truth, and make the webhook handler idempotent because gateways retry. A daily reconciliation job compares the gateway's settlement report with your records and refunds any duplicates it finds."),
      s(4, "How would you assign the best rider to an order at dinner peak?", "Keep live rider positions in a geo index (Redis GEOADD with short TTLs, or H3 cells). On OrderPaid, query riders within a radius of the restaurant, filter by status and vehicle, then score by pickup ETA, the restaurant's remaining prep time, current load and fairness. Offer to the top rider with a 20–30 second timeout and a lock on the order, re-offering to the next on decline. At peak, batch orders from the same restaurant and assign in short windows to optimise globally rather than greedily."),
    ],
    objective: [
      o(5, "Which pattern guarantees an order's event reaches Kafka exactly when the order row is committed?", ["Transactional outbox", "Two-phase commit across Kafka and the database", "Publishing before the database write", "A cron job that scans all orders"], 0, "The event is written to an outbox table in the same transaction as the order, and a relay publishes it, so the two can never disagree."),
      o(5, "A restaurant rejects an order after the customer has paid. In a saga, what should happen?", ["Run the compensating action: refund the payment and cancel the order", "Roll back a distributed transaction", "Leave the payment and retry the restaurant forever", "Ask the customer to call support"], 0, "Sagas undo completed steps with compensating actions; here that means an automatic refund."),
      o(4, "Which Redis command finds riders within 3 km of a restaurant?", ["GEOSEARCH", "ZRANGE", "HGETALL", "LPUSH"], 0, "GEOSEARCH (the successor to GEORADIUS) queries members of a geo set by radius or box around a point."),
    ],
  },
  "url-shortener": {
    stack: ["Nginx / cloud load balancer", "Stateless app servers", "Redis cache", "Cassandra or DynamoDB", "Snowflake-style ID service", "CDN for redirects"],
    decisions: [
      "Counter-based IDs encoded in Base62 instead of hashing the URL: no collisions to check, and codes stay short.",
      "A key-value store keyed by code: every read is a single lookup by primary key, which scales horizontally.",
      "302 when you need click analytics on every visit; 301 when you want browsers and CDNs to cache the redirect.",
    ],
    pitfalls: [
      "Hashing the long URL and truncating it, then discovering collisions at scale.",
      "Sequential codes that let anyone enumerate every private link.",
      "Writing a click-analytics row synchronously on every redirect, which turns the hot read path into a write path.",
    ],
    metrics: ["Redirect p99 latency (target: tens of milliseconds)", "Cache hit ratio on hot codes", "Read:write ratio, often 100:1 or more"],
    subjective: [
      s(5, "How would you generate unique short codes across many servers?", "Give each server a block of numeric IDs from a central counter (or use a Snowflake-style ID with machine bits), then encode the number in Base62. Seven Base62 characters cover about 3.5 trillion codes. Pre-allocated ranges mean no coordination on each write, and there is never a collision to resolve."),
      s(4, "Estimate the storage for 100 million new links a month kept for 5 years.", "100 M × 12 × 5 = 6 billion links. At roughly 500 bytes per record (code, long URL, owner, timestamps) that is about 3 TB, before replication. With three replicas, plan for around 9–10 TB. The point is to show the method: volume × record size × retention × replicas."),
      s(4, "How do you keep redirects fast when one link goes viral?", "Serve redirects from cache: an in-process LRU plus Redis, with the CDN caching 301 responses at the edge. Hot keys can be replicated across cache nodes. The database is only hit on a miss, and that result fills the cache for everyone after."),
    ],
    objective: [
      o(5, "Which redirect status lets browsers cache the mapping and skip your server next time?", ["301 Moved Permanently", "302 Found", "307 Temporary Redirect", "404 Not Found"], 0, "301 is permanent, so browsers and CDNs may cache it. That saves load but hides later clicks from your analytics."),
      o(4, "How many distinct codes do 7 Base62 characters give?", ["About 78 billion", "About 3.5 trillion", "About 8 million", "About 62 million"], 1, "62⁷ ≈ 3.52 × 10¹², roughly 3.5 trillion."),
      o(3, "Which store fits the code → URL mapping best at very large scale?", ["A graph database", "A key-value / wide-column store", "A full-text search engine", "A single relational table with many joins"], 1, "The access pattern is a lookup by key with no joins, which is exactly what key-value and wide-column stores scale for."),
    ],
  },
  "rate-limiter": {
    stack: ["API gateway (Kong, Envoy, AWS API Gateway)", "Redis with Lua scripts", "Config service for plan limits", "Retry-After and X-RateLimit headers"],
    decisions: [
      "Token bucket: it allows short bursts up to the bucket size while holding the long-run rate steady.",
      "Shared counters in Redis, updated atomically with a Lua script, so every gateway node sees the same count.",
      "Limit per API key or user, not only per IP, so customers behind one office NAT do not block each other.",
    ],
    pitfalls: [
      "Read-then-write counters without atomicity, so concurrent requests slip past the limit.",
      "Fixed one-minute windows that let a client send double the limit across a window boundary.",
      "Failing closed when Redis is down and taking the whole API offline with it.",
    ],
    metrics: ["429 rate per plan and per key", "Limiter overhead per request (should be about a millisecond)", "Top keys by rejected requests"],
    subjective: [
      s(5, "Compare token bucket, leaky bucket, fixed window and sliding window.", "Fixed window counts per clock minute; it is cheap but allows a burst of twice the limit at the boundary. Sliding window (a log or a weighted counter) smooths that edge. Token bucket refills tokens at a fixed rate and allows bursts up to the bucket size. Leaky bucket drains a queue at a constant rate, so output is smooth but requests wait. Token bucket is the usual default for public APIs."),
      s(4, "How do you rate-limit consistently across many gateway servers?", "Keep the counters in a shared store such as Redis and update them atomically: INCR with an expiry, or a Lua script that refills and takes a token in one step. For very high traffic, each node can take a small local allowance and sync it periodically, accepting a little inaccuracy for speed."),
      s(3, "What should happen if the limiter's store goes down?", "Usually fail open, with a conservative local in-memory limit per node, so a cache outage does not become an API outage. Sensitive endpoints such as login or OTP can fail closed instead. Either way, alert on it."),
    ],
    objective: [
      o(5, "Which HTTP status code signals that a client is being rate-limited?", ["403 Forbidden", "429 Too Many Requests", "503 Service Unavailable", "409 Conflict"], 1, "429 is the standard status, ideally with a Retry-After header saying when to try again."),
      o(4, "Which algorithm allows short bursts while keeping a fixed average rate?", ["Fixed window counter", "Token bucket", "Leaky bucket", "Round robin"], 1, "Tokens accumulate up to the bucket size, so a burst can spend them, while the refill rate caps the average."),
      o(3, "Why use a Lua script in Redis for the limiter?", ["Lua is faster than C", "The check and the update run atomically in one step", "It encrypts the counters", "It avoids storing keys"], 1, "Redis runs a script atomically, so no other request can sneak in between reading the count and updating it."),
    ],
  },
  "cache-aside": {
    stack: ["Redis or Memcached", "Relational database", "TTL per key", "Change-data-capture (Debezium) for invalidation"],
    decisions: [
      "The application owns the cache: read the cache, fall back to the database on a miss, then fill the cache.",
      "On a write, update the database and then delete the cache key rather than updating it, which avoids stale overwrites from racing writers.",
      "A TTL on every key, so any missed invalidation heals itself.",
    ],
    pitfalls: [
      "A cache stampede when a hot key expires and thousands of requests hit the database at once.",
      "Updating the cache before the database commits, so readers see data that is later rolled back.",
      "Caching null results without a short TTL, or not caching them at all and letting bad keys hammer the database.",
    ],
    metrics: ["Hit ratio (often 90%+ on read-heavy pages)", "Database QPS saved", "Staleness window after a write"],
    subjective: [
      s(5, "Explain cache-aside, write-through and write-behind.", "Cache-aside: the app reads the cache, loads from the database on a miss and invalidates on write; simple, and the cache holds only what is read. Write-through: every write goes to the cache and the database together, so the cache is always warm but writes are slower. Write-behind: writes go to the cache and are flushed to the database later; fast, but data can be lost if the cache dies."),
      s(5, "How do you prevent a cache stampede on a hot key?", "Let one request rebuild the value while others wait or get the stale value: a mutex or single-flight lock per key, early probabilistic refresh before expiry, and TTL jitter so many keys do not expire together."),
      s(4, "Why delete the cache key on write instead of updating it?", "Two concurrent writers can update the cache in the opposite order to the database and leave it permanently wrong. Deleting means the next read loads the committed value. Some teams delete twice (before and shortly after the write) to cover a read that races the commit."),
    ],
    objective: [
      o(5, "In cache-aside, who loads data into the cache on a miss?", ["The database", "The application", "The cache automatically", "The load balancer"], 1, "The application reads the database and populates the cache itself; the cache knows nothing about the database."),
      o(4, "What does adding random jitter to TTLs prevent?", ["Memory fragmentation", "Many keys expiring at the same moment", "Cache poisoning", "Network partitions"], 1, "Staggered expiry spreads the reload work so the database is not hit by a wave of misses."),
      o(3, "Which eviction policy does Redis commonly use for a cache?", ["FIFO", "allkeys-lru or allkeys-lfu", "noeviction", "Random replacement only"], 1, "For a pure cache, allkeys-lru or allkeys-lfu evicts the least useful keys when memory is full."),
    ],
  },
  "event-driven": {
    stack: ["Apache Kafka, Amazon SQS/SNS or RabbitMQ", "Outbox table + CDC (Debezium)", "Schema registry (Avro / Protobuf)", "Dead-letter queues"],
    decisions: [
      "Publish an OrderPlaced event instead of calling payment, inventory and email directly, so each consumer scales and fails on its own.",
      "The transactional outbox: write the order and the event in one database transaction, then relay it, so an event is never lost or sent for a rolled-back order.",
      "Partition by order ID, so all events for one order are processed in order.",
    ],
    pitfalls: [
      "Consumers that are not idempotent, so a redelivered message charges or ships twice.",
      "Dual writes (save to the database, then publish) that drift apart when the second step fails.",
      "No dead-letter queue, so one bad message blocks a partition forever.",
    ],
    metrics: ["Consumer lag per partition", "End-to-end event latency", "Dead-letter queue depth"],
    subjective: [
      s(5, "How do you get exactly-once processing with a message broker?", "In practice you build effectively-once: the broker delivers at least once, and consumers are idempotent. Store processed message IDs (or use a natural idempotency key) and skip duplicates, ideally in the same transaction as the side effect. Kafka's transactions give exactly-once within Kafka, but external side effects still need idempotency."),
      s(5, "What is the transactional outbox pattern and why is it needed?", "Writing to the database and publishing to a broker are two systems, so one can succeed while the other fails. The outbox writes the event into a table in the same transaction as the business change; a relay (polling or CDC) then publishes it. Events are never lost and never sent for a change that did not commit."),
      s(4, "How would you run a multi-step order flow without distributed transactions?", "Use a saga: each step is a local transaction that emits an event, and each has a compensating action (refund the payment, release the stock) if a later step fails. Choreography lets services react to each other's events; orchestration uses one coordinator that tracks the steps."),
    ],
    objective: [
      o(5, "Which delivery guarantee do most brokers give by default?", ["At-most-once", "At-least-once", "Exactly-once end to end", "No guarantee"], 1, "Messages are redelivered until acknowledged, so duplicates are possible and consumers must be idempotent."),
      o(4, "In Kafka, what preserves ordering for one order's events?", ["Using many topics", "Sending them with the same partition key", "Setting a higher replication factor", "Using consumer groups"], 1, "Ordering is guaranteed only within a partition, and the key decides the partition."),
      o(4, "Where does a message go after repeatedly failing processing?", ["It is deleted silently", "To a dead-letter queue", "Back to the producer", "To the primary database"], 1, "A dead-letter queue parks poison messages so the rest of the stream keeps flowing and someone can inspect them."),
    ],
  },
  "scalable-web": {
    stack: ["Route 53 / Cloudflare DNS", "CDN (CloudFront, Cloudflare)", "Application load balancer", "Auto-scaling app servers or containers", "Redis", "PostgreSQL primary + read replicas"],
    decisions: [
      "Stateless app servers with sessions in Redis or a signed cookie, so any server can take any request and auto-scaling just works.",
      "Static assets and cacheable pages served from a CDN close to users, taking most traffic off the origin.",
      "Writes to one primary and reads spread across replicas, accepting a little replication lag on reads.",
    ],
    pitfalls: [
      "Sticky sessions stored in server memory, so scaling in logs users out.",
      "Reading your own write from a lagging replica and showing the user stale data.",
      "Scaling app servers while the single database becomes the real bottleneck.",
    ],
    metrics: ["p95 / p99 latency per endpoint", "CDN offload percentage", "Replica lag in seconds", "CPU and connection-pool saturation"],
    subjective: [
      s(5, "Walk through what happens when a user types a URL and presses Enter.", "DNS resolves the name (cached at several levels), the browser opens a TCP and TLS connection, and the request may be answered by a CDN edge. Otherwise it reaches the load balancer, which picks a healthy app server. The server checks the cache, queries the database if needed, renders a response, and the browser parses HTML and fetches CSS, JS and images, many of them from the CDN."),
      s(5, "Horizontal or vertical scaling: when would you choose each?", "Vertical (a bigger machine) is simplest and suits databases early on, but it has a ceiling and a single point of failure. Horizontal (more machines) needs stateless services and a load balancer, but scales further and survives a node failing. Most systems scale the app tier horizontally and the database vertically first, then with replicas and sharding."),
      s(4, "How do you handle read-your-own-writes with read replicas?", "Route a user's reads to the primary for a short time after they write, or pin reads that must be fresh (their profile, their order) to the primary. Some systems track the replication position and only read from a replica that has caught up to it."),
    ],
    objective: [
      o(5, "What makes an app server safe to auto-scale behind a load balancer?", ["Storing sessions in local memory", "Being stateless", "Using sticky sessions", "Running on bare metal"], 1, "If no request depends on state held by one machine, servers can be added or removed freely."),
      o(4, "What do read replicas mainly scale?", ["Write throughput", "Read throughput", "Storage encryption", "DNS resolution"], 1, "Replicas copy the primary's data so reads can be spread out; all writes still go to the primary."),
      o(3, "Which layer usually serves images, CSS and JS closest to the user?", ["The database", "The CDN", "The load balancer", "The message queue"], 1, "A CDN caches static files at edge locations near users."),
    ],
  },
  sharding: {
    stack: ["PostgreSQL with Citus, or Vitess for MySQL", "MongoDB / Cassandra (built-in sharding)", "Consistent hashing", "Replica per shard", "Shard-map service"],
    decisions: [
      "Choose a shard key that matches the main access pattern (often user_id), so most queries touch one shard.",
      "Consistent hashing or many small virtual shards, so adding a machine moves only a fraction of the data.",
      "A replica behind every shard for failover and read scaling.",
    ],
    pitfalls: [
      "A low-cardinality or skewed key (country, created_date) that creates hot shards.",
      "Cross-shard joins and transactions that become slow and complex.",
      "Sharding before it is needed, when indexes, caching or a bigger machine would do.",
    ],
    metrics: ["Data size and QPS per shard (skew)", "Share of queries that fan out to all shards", "Rebalancing time and replica lag"],
    subjective: [
      s(5, "How do you choose a good shard key?", "High cardinality, an even spread of data and traffic, and present in most queries so they hit a single shard. user_id or tenant_id are common. Avoid monotonically increasing keys with range sharding (all new writes hit one shard) and keys with a few huge values."),
      s(5, "What is the difference between sharding and replication?", "Sharding splits the data, so each machine holds a different part and write capacity grows. Replication copies the same data to several machines for availability and read scaling. Production systems usually do both: every shard has replicas."),
      s(4, "How does consistent hashing help when adding a node?", "Keys and nodes sit on a hash ring, and each key belongs to the next node clockwise. Adding a node takes over only the keys between it and its neighbour, about 1/N of the data, instead of reshuffling everything as hash mod N would. Virtual nodes even out the load."),
    ],
    objective: [
      o(5, "Why is hash(key) mod N a problem when N changes?", ["It is slow to compute", "Almost every key moves to a different shard", "It cannot handle strings", "It needs a global lock"], 1, "Changing N changes the result for most keys, so nearly all data must move."),
      o(4, "Which query is most expensive in a database sharded by user_id?", ["Fetch one user's orders", "Count orders across all users for yesterday", "Update one user's profile", "Insert a new order for a user"], 1, "A query without the shard key must fan out to every shard and merge the results."),
      o(3, "What does a replica behind each shard provide?", ["More write capacity", "Failover and read scaling for that shard", "Automatic cross-shard joins", "Smaller indexes"], 1, "The replica holds a copy of the shard's data, ready to take over or serve reads."),
    ],
  },
  payments: {
    stack: ["Stripe / Razorpay / Adyen (PSP)", "PostgreSQL ledger", "Idempotency-key table", "Signed webhooks", "Nightly reconciliation job"],
    decisions: [
      "An Idempotency-Key on every payment request, stored with its result, so retries return the first answer.",
      "A double-entry, append-only ledger: every movement is a debit and a credit, and mistakes are fixed with new entries, never edits.",
      "Webhooks treated as the source of truth for the final status, verified by signature.",
    ],
    pitfalls: [
      "Treating a timeout as a failure and retrying with a new key, which charges twice.",
      "Storing money as floating-point numbers instead of integer minor units.",
      "Trusting the success page in the browser instead of the server-side webhook.",
    ],
    metrics: ["Payment success rate by method", "Duplicate-charge count (target: zero)", "Reconciliation mismatches per day", "Webhook processing delay"],
    subjective: [
      s(5, "How do you make a payment API idempotent?", "The client sends a unique key per payment attempt. The server stores the key with the request hash and, once done, the response. A repeat with the same key returns the stored response instead of charging again; a repeat with a different body is rejected. Keys are unique-indexed, so two concurrent requests cannot both win."),
      s(5, "Why use a double-entry ledger?", "Every transaction is recorded as equal debits and credits across accounts, so the books always balance and any error shows up as an imbalance. It is append-only, which gives a full audit trail, and balances can be recomputed from entries at any time."),
      s(4, "What do you do when the provider's response never arrives?", "Mark the payment pending, never failed. Query the provider's status API with the same idempotency key, and wait for the webhook. Reconciliation catches anything still unresolved. Only retry the charge with the same key."),
    ],
    objective: [
      o(5, "How should money amounts be stored?", ["As floats in rupees", "As integers in the smallest unit (paise, cents)", "As strings with a currency symbol", "As doubles rounded on display"], 1, "Integers avoid floating-point rounding errors; 10.10 is stored as 1010 paise."),
      o(4, "Before trusting a webhook, the handler must…", ["Reply with 500 first", "Verify its signature", "Store it in Redis", "Forward it to the browser"], 1, "The signature proves the provider sent it and it was not altered, so attackers cannot fake a payment success."),
      o(3, "What does reconciliation compare?", ["Logs with metrics", "Your ledger with the provider's settlement reports", "Two database replicas", "Frontend and backend versions"], 1, "It finds payments that one side has and the other does not, or with different amounts."),
    ],
  },
  notifications: {
    stack: ["Kafka or SQS", "Priority queues per channel", "APNs / FCM, SES / SendGrid, Twilio / MSG91", "Template service", "Preference store"],
    decisions: [
      "One service owns sending, so preferences, quiet hours, rate limits and deduplication are applied in one place.",
      "Separate queues per priority and per channel, so an OTP never waits behind a marketing blast.",
      "Idempotent sends keyed by event and channel, so a retried event does not notify twice.",
    ],
    pitfalls: [
      "Sending marketing messages through the same queue as OTPs and security alerts.",
      "Ignoring provider rate limits and getting throttled or blocklisted.",
      "No unsubscribe or preference check, which breaks laws such as CAN-SPAM, GDPR and DND/TRAI rules.",
    ],
    metrics: ["Delivery and open rate per channel", "OTP time-to-deliver", "Bounce and complaint rates", "Queue depth per priority"],
    subjective: [
      s(5, "Design a notification system that sends push, email and SMS.", "Product services publish events. The notification service looks up the user's preferences and the template, decides the channels, deduplicates, and puts a job on the right priority queue. Workers per channel call the providers with retries and backoff, and record delivery status in a log that feeds analytics and suppression lists."),
      s(4, "How do you avoid sending the same notification twice?", "Give each notification a deterministic ID (event ID + user + channel) and record it before or atomically with sending; a retry sees the record and skips. Providers that support idempotency keys get the same ID."),
      s(4, "How would you send a campaign to 50 million users without hurting OTP delivery?", "Run it on a separate low-priority queue with its own workers and rate limit, batch the sends, spread them over time, and respect each provider's throughput. Transactional messages keep reserved capacity."),
    ],
    objective: [
      o(5, "Which message should go on the highest-priority queue?", ["A weekly newsletter", "A login OTP", "A product recommendation", "A survey invite"], 1, "An OTP is time-critical; the user is waiting for it right now."),
      o(4, "Which services deliver mobile push notifications?", ["SMTP and IMAP", "APNs and FCM", "S3 and CloudFront", "Kafka and Zookeeper"], 1, "Apple Push Notification service and Firebase Cloud Messaging deliver to iOS and Android devices."),
      o(3, "What should happen to an address that hard-bounces?", ["Retry every hour", "Add it to a suppression list", "Switch to SMS automatically", "Delete the user"], 1, "Repeated sends to bad addresses hurt your sender reputation, so stop sending to them."),
    ],
  },
  "news-feed": {
    stack: ["Post store (Cassandra / MySQL)", "Fan-out workers on a queue", "Redis lists or sorted sets per user", "Ranking model", "Graph store for follows"],
    decisions: [
      "Fan-out on write for most authors: push each post ID into followers' feed caches, so reading is one fast fetch.",
      "Fan-out on read for celebrities, merging their recent posts at read time instead of writing to millions of feeds.",
      "Store only post IDs in feeds and hydrate the posts in a batch, so edits and deletes show everywhere.",
    ],
    pitfalls: [
      "Pushing a celebrity's post to 50 million feeds synchronously.",
      "Storing full post bodies in every feed, so one edit means millions of writes.",
      "Unbounded feed lists that grow forever in memory.",
    ],
    metrics: ["Feed load p99", "Fan-out lag (post to visible)", "Feed cache memory per user", "Engagement per session"],
    subjective: [
      s(5, "Fan-out on write vs. fan-out on read: when do you use each?", "Fan-out on write precomputes feeds when someone posts, so reads are fast; it suits most users with modest follower counts. Fan-out on read assembles the feed when it is opened; it suits accounts with huge followings and users who rarely log in. Large networks use a hybrid of both."),
      s(4, "How do you paginate a feed that changes while the user scrolls?", "Use cursor-based pagination, such as 'items older than this post ID or timestamp', not page offsets. New posts arriving at the top then do not shift or duplicate items on later pages."),
      s(4, "How would you rank the feed instead of showing it in time order?", "Gather candidates from the precomputed feed and other sources, score each with a model using features such as affinity with the author, recency, and predicted likes or comments, then apply rules for diversity and freshness. Ranking runs at read time on a few hundred candidates."),
    ],
    objective: [
      o(5, "Which approach makes opening the feed fastest for typical users?", ["Fan-out on read", "Fan-out on write", "Full table scan", "Client-side filtering"], 1, "The feed is already built when the user opens the app, so reading it is one lookup."),
      o(4, "What is the usual fix for celebrity accounts?", ["Block them from posting", "Pull their posts at read time", "Store their posts in the client", "Shard them by country"], 1, "A hybrid model merges celebrity posts at read time instead of writing them to millions of feeds."),
      o(3, "Which pagination style suits an infinite feed?", ["OFFSET / LIMIT", "Cursor-based", "Random sampling", "Page numbers in the URL only"], 1, "Cursors stay stable as new items are inserted, so the user does not see repeats or gaps."),
    ],
  },
  chat: {
    stack: ["WebSocket gateway", "Redis Pub/Sub or Kafka", "Cassandra / ScyllaDB for messages", "Redis presence with TTL", "APNs / FCM for offline push"],
    decisions: [
      "Persistent WebSocket connections, so the server can push messages instantly instead of being polled.",
      "A sequence number per conversation, so clients order messages and detect gaps after reconnecting.",
      "A write-heavy store partitioned by conversation ID, sorted by time, for fast 'latest 50 messages' reads.",
    ],
    pitfalls: [
      "Ordering by client timestamps, which disagree across devices.",
      "Keeping connection state in a single gateway without a routing layer to find which gateway holds a user.",
      "Presence updates on every heartbeat broadcast to every contact, which floods the system.",
    ],
    metrics: ["Message delivery latency", "Concurrent connections per gateway", "Messages delivered vs. sent", "Reconnect rate"],
    subjective: [
      s(5, "WebSockets, long polling or Server-Sent Events: which would you choose for chat?", "WebSockets give a two-way, low-overhead persistent connection, which suits chat. SSE is one-way, server to client, which suits feeds and notifications. Long polling works everywhere but costs more. Most chat apps use WebSockets, with long polling as a fallback."),
      s(5, "How do you deliver a message when the recipient is connected to a different server?", "Each gateway subscribes to a channel per connected user or conversation (Redis Pub/Sub, Kafka) or registers in a connection map. The sender's gateway publishes the message after storing it, and the recipient's gateway pushes it down the socket. If nobody is connected, a push notification goes out."),
      s(4, "How do you guarantee ordering and no lost messages?", "The server assigns a per-conversation sequence number when it stores the message, and acknowledges the client. Clients send a client message ID so retries are deduplicated, and on reconnect they ask for everything after the last sequence they have."),
    ],
    objective: [
      o(5, "Which protocol gives full-duplex communication over one TCP connection?", ["HTTP/1.0", "WebSocket", "SMTP", "FTP"], 1, "WebSocket upgrades an HTTP connection to a persistent two-way channel."),
      o(4, "How is presence usually tracked?", ["A row per login in SQL", "Heartbeats that refresh a key with a short TTL", "Polling the user's device", "DNS records"], 1, "If the heartbeat stops, the key expires and the user shows as offline."),
      o(3, "What ensures correct message order within a chat?", ["Client clock timestamps", "A server-assigned sequence per conversation", "Message length", "Random IDs"], 1, "One authority assigns the order, so every device sees the same sequence."),
    ],
  },
  video: {
    stack: ["S3 / GCS with multipart or resumable upload", "Queue + FFmpeg transcoders", "HLS / DASH packaging", "CDN", "Metadata DB", "DRM (Widevine, FairPlay) when needed"],
    decisions: [
      "Upload straight to object storage with pre-signed URLs, so large files bypass the app servers.",
      "Split the video into chunks and transcode them in parallel into a ladder of resolutions and bitrates.",
      "Adaptive bitrate streaming (HLS/DASH): the player switches quality per segment as the network changes.",
    ],
    pitfalls: [
      "Uploading through the API server and tying up its memory and bandwidth.",
      "Transcoding a long video as one sequential job.",
      "Serving video from origin storage instead of a CDN, with huge egress costs.",
    ],
    metrics: ["Time from upload to playable", "Rebuffering ratio", "Video start time", "CDN hit ratio and egress cost"],
    subjective: [
      s(5, "Design a video upload and streaming service like YouTube.", "The client uploads in resumable chunks directly to object storage using pre-signed URLs. An event queues transcoding: workers split the file, encode each chunk into several resolutions, and package HLS/DASH segments with a manifest. Metadata and thumbnails go to a database. Playback fetches the manifest and segments from a CDN, and the player adapts the bitrate to the network."),
      s(4, "How does adaptive bitrate streaming work?", "The video is encoded at several quality levels and cut into segments of a few seconds. A manifest lists them. The player measures bandwidth and buffer level and picks the quality for each next segment, dropping to a lower one before the buffer runs dry."),
      s(3, "How would you make uploads resumable on a bad mobile network?", "Split the file into parts and upload each separately (S3 multipart or the tus protocol), recording which parts succeeded. After a drop, the client asks which parts exist and uploads only the missing ones, then completes the upload."),
    ],
    objective: [
      o(5, "What lets a player switch quality mid-stream?", ["Progressive download", "HLS / DASH adaptive bitrate segments", "A larger buffer only", "Lossless encoding"], 1, "Segments at several bitrates let the player pick a different quality for each next segment."),
      o(4, "Why use pre-signed URLs for uploads?", ["They compress the video", "Clients upload directly to storage without passing through app servers", "They transcode automatically", "They remove the need for a CDN"], 1, "A pre-signed URL grants time-limited permission to write one object straight to the bucket."),
      o(3, "Which tool is most commonly used to transcode video?", ["ImageMagick", "FFmpeg", "Pandoc", "Webpack"], 1, "FFmpeg is the standard open-source encoder behind most transcoding pipelines."),
    ],
  },
  autocomplete: {
    stack: ["Trie or finite-state transducer in memory", "Elasticsearch / OpenSearch completion suggester", "Edge cache for hot prefixes", "Spark / batch jobs over query logs"],
    decisions: [
      "Store the top-k completions at every trie node, so a lookup is a walk down the prefix with no search below it.",
      "Rebuild the trie offline from query logs (hourly or daily) and swap it in, keeping the request path read-only.",
      "Debounce keystrokes on the client and cache popular prefixes at the edge.",
    ],
    pitfalls: [
      "Computing top-k by searching the whole subtree on every keystroke.",
      "Updating the trie in place on the live path, causing lock contention.",
      "No filtering, so offensive or out-of-stock suggestions appear.",
    ],
    metrics: ["Suggestion p99 latency (under ~100 ms)", "Suggestion click-through rate", "Keystrokes saved per search"],
    subjective: [
      s(5, "Design search autocomplete for a large e-commerce site.", "Aggregate query logs offline into counts per query, weighted toward recent and converting searches. Build a trie where each node stores its top-k completions, shard it by prefix, and serve it from memory behind an edge cache for short, hot prefixes. The client debounces input. Personal history and trending queries are blended in at request time."),
      s(4, "Why store top-k results at each trie node?", "Without it, each request must traverse the whole subtree under the prefix and sort, which is slow for short prefixes with millions of completions. Precomputing top-k makes every lookup proportional to the prefix length, at the cost of extra memory and a rebuild step."),
      s(3, "How do you show trending queries quickly, before the next rebuild?", "Run a small real-time layer: count recent queries in a sliding window (a stream processor or Redis sorted sets) and merge those with the static trie results at request time."),
    ],
    objective: [
      o(5, "Which data structure is classic for prefix lookups?", ["Hash map", "Trie", "Binary heap", "Bloom filter"], 1, "A trie stores strings by shared prefixes, so all completions of a prefix are under one node."),
      o(4, "Why debounce keystrokes on the client?", ["To encrypt the query", "To avoid sending a request for every single keypress", "To sort results", "To cache the trie locally"], 1, "Waiting briefly after typing cuts request volume a lot with no visible delay."),
      o(3, "Where does the trie's ranking data usually come from?", ["Random sampling", "Aggregated query logs and clicks", "The product catalogue's alphabetical order", "Manual editing only"], 1, "Real searches, clicks and orders show which completions people actually want."),
    ],
  },
  "job-scheduler": {
    stack: ["PostgreSQL jobs table (FOR UPDATE SKIP LOCKED)", "Leader election with etcd, ZooKeeper or Redis", "Kafka / SQS work queue", "Worker pool on Kubernetes", "Dead-letter queue"],
    decisions: [
      "Store next_run_at and index it, so finding due jobs is one cheap range query.",
      "Only one leader schedules at a time, via a lease, so a job is not enqueued twice by two schedulers.",
      "Idempotent jobs with an execution ID, because at-least-once delivery means a job can run twice.",
    ],
    pitfalls: [
      "Running cron on every server, so each job runs once per machine.",
      "Holding a database lock for the whole job instead of just while claiming it.",
      "Retrying instantly in a tight loop and overloading the system that is already failing.",
    ],
    metrics: ["Schedule delay (actual start minus planned start)", "Job success rate and retries", "DLQ size", "Queue depth by priority"],
    subjective: [
      s(5, "How do you make sure a scheduled job runs only once across many servers?", "Elect one leader with a time-limited lease (etcd, ZooKeeper, or a Redis lock with a fencing token) to claim due jobs. Or let every worker claim rows with SELECT … FOR UPDATE SKIP LOCKED, which gives each due job to exactly one claimer. Either way, make the job idempotent, because a crash after the work but before the acknowledgement will cause a retry."),
      s(4, "How would you retry failed jobs safely?", "Retry with exponential backoff and jitter, cap the number of attempts, and move the job to a dead-letter queue after the last one. Separate retryable errors (timeouts) from permanent ones (bad input), which should go straight to the DLQ."),
      s(3, "What is a fencing token and why does it matter for leader election?", "It is a number that increases with every new lease. If an old leader pauses (say, a long GC pause) and wakes up after its lease expired, its writes carry an old token and the storage rejects them, so two leaders cannot both act."),
    ],
    objective: [
      o(5, "What does SELECT … FOR UPDATE SKIP LOCKED let workers do?", ["Read uncommitted data", "Each claim different rows without waiting on each other", "Delete locked rows", "Bypass indexes"], 1, "Rows another transaction has locked are skipped, so workers grab different jobs in parallel."),
      o(4, "Why add jitter to retry backoff?", ["To make retries faster", "To stop many clients retrying at the same instant", "To encrypt payloads", "To reduce log size"], 1, "Randomness spreads retries out, avoiding a thundering herd against the recovering service."),
      o(3, "Running crontab on every app server causes…", ["Faster jobs", "The same job running once per server", "Automatic failover", "Lower memory use"], 1, "Each server's cron fires independently, so a job meant to run once runs N times."),
    ],
  },
  "ride-matching": {
    stack: ["Uber H3 or geohash cells", "Redis GEO or in-memory geo index", "OSRM / Valhalla routing for ETA", "Kafka for location streams", "Trip state machine in a database"],
    decisions: [
      "Bucket driver positions into hexagonal cells, so 'nearby' means this cell and its ring of neighbours.",
      "Rank candidates by road ETA, since the closest driver as the crow flies may be across a river.",
      "Offer to one driver at a time with a short timeout, so two riders never get the same driver.",
    ],
    pitfalls: [
      "Writing every GPS ping to a relational database.",
      "Ranking by straight-line distance only.",
      "Double-booking a driver when two matchers pick them at once, for want of an atomic reservation.",
    ],
    metrics: ["Time to match", "Driver acceptance rate", "Pickup ETA accuracy", "Share of requests with no driver found"],
    subjective: [
      s(5, "How would you find the nearest available drivers quickly?", "Keep live positions in memory, indexed by geo cell (H3 or geohash), updated every few seconds. For a request, read the rider's cell and its neighbouring rings until you have enough candidates, filter by availability and vehicle type, then rank by road ETA from a routing engine."),
      s(4, "Why hexagons (H3) rather than square geohash cells?", "Every hexagon's neighbours are the same distance from its centre, so a ring of cells approximates a circle well. Square cells have corner neighbours that are further away and edges that distort with latitude. Both work; H3 makes radius searches and surge-pricing areas more uniform."),
      s(4, "How do you stop two riders from being matched to the same driver?", "Reserve the driver atomically before sending an offer: a compare-and-set on the driver's state (available → offered) in Redis or the database. If it fails, move to the next candidate. The reservation expires if the driver does not answer."),
    ],
    objective: [
      o(5, "What best ranks candidate drivers for a pickup?", ["Straight-line distance", "Estimated road travel time (ETA)", "Driver's rating only", "Alphabetical order"], 1, "Road networks, one-way streets and traffic make ETA the real measure of how soon a car arrives."),
      o(4, "Where should driver GPS pings, sent every few seconds, be stored for matching?", ["A relational table with an index per ping", "An in-memory geo index", "Object storage", "Email logs"], 1, "Very frequent, short-lived updates fit an in-memory index; history can be streamed elsewhere."),
      o(3, "What does a geohash or H3 cell ID represent?", ["A user account", "A small geographic area", "A payment token", "A road segment's speed"], 1, "Both encode an area on the map, so nearby points share a cell or a prefix."),
    ],
  },
};

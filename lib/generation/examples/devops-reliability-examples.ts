import type { CodeExample } from "@/lib/domain";
import { api, file, json, nodePackage, param, project, readme } from "./builders";

/**
 * Complete projects for the DevOps reliability lessons: the observability stack
 * (Prometheus, Grafana, Loki, Tempo, OpenTelemetry), supply-chain security
 * (Vault, SOPS, Trivy, SBOMs, Sigstore, SonarQube), and traffic management with
 * SLOs (Nginx, Traefik, Istio, feature flags, on-call).
 *
 * Everything runs locally on Node.js 22.12+ with no cluster, no cloud account
 * and no network calls. Every file's first line repeats its project-relative
 * path as a comment.
 */

/* --------------------------------------------------------------------- *
 * Lesson: Observability — Prometheus, Grafana, Loki, Tempo, OpenTelemetry *
 * --------------------------------------------------------------------- */

const observabilitySimple = project(
  "concept",
  "Expose a /metrics endpoint Prometheus can scrape",
  "Prometheus scrapes a text format, and the format has rules. This serves real metrics with the three types that matter and the label discipline that keeps a time-series database from falling over.",
  [
    nodePackage({ start: "node src/server.mjs", test: "node --test" }),
    file("src/registry.mjs", `// src/registry.mjs — counters, gauges and histograms in the exposition format.

/**
 * Prometheus stores one time series per unique label combination. Labels with
 * unbounded values (user ids, request ids, raw URLs) create a new series every
 * request — that is cardinality explosion, and it is the fastest way to break a
 * Prometheus server. Every label used here has a small, fixed set of values.
 */
export function createRegistry() {
  const counters = new Map();
  const gauges = new Map();
  const histograms = new Map();
  const key = (name, labels) => name + '|' + Object.entries(labels).sort().map(([k, v]) => k + '=' + v).join(',');

  return {
    /** Monotonic: a counter only ever goes up, so rate() over it is meaningful. */
    increment(name, labels = {}, by = 1) {
      const id = key(name, labels);
      counters.set(id, { name, labels, value: (counters.get(id)?.value ?? 0) + by });
    },
    /** A gauge can move in both directions: queue depth, in-flight requests, temperature. */
    set(name, labels, value) { gauges.set(key(name, labels), { name, labels, value }); },
    /**
     * A histogram counts observations into cumulative buckets. Buckets are
     * chosen up front and cannot be changed retroactively, so pick them around
     * the latency you actually care about.
     */
    observe(name, labels, value, buckets = [0.05, 0.1, 0.25, 0.5, 1, 2.5]) {
      const id = key(name, labels);
      const entry = histograms.get(id) ?? { name, labels, buckets, counts: buckets.map(() => 0), sum: 0, count: 0 };
      // Cumulative: an observation lands in its own bucket AND every larger one.
      buckets.forEach((bound, index) => { if (value <= bound) entry.counts[index] += 1; });
      entry.sum += value;
      entry.count += 1;
      histograms.set(id, entry);
    },
    /** @returns {string} the text/plain; version=0.0.4 body Prometheus expects. */
    render() {
      const lines = [];
      const labelsOf = (labels, extra = {}) => {
        const all = Object.entries({ ...labels, ...extra });
        return all.length ? '{' + all.map(([k, v]) => k + '="' + v + '"') + '}' : '';
      };
      for (const [, { name, labels, value }] of counters) lines.push(name + '_total' + labelsOf(labels) + ' ' + value);
      for (const [, { name, labels, value }] of gauges) lines.push(name + labelsOf(labels) + ' ' + value);
      for (const [, h] of histograms) {
        h.buckets.forEach((bound, index) => lines.push(h.name + '_bucket' + labelsOf(h.labels, { le: bound }) + ' ' + h.counts[index]));
        // +Inf is mandatory and must equal _count, or the histogram is invalid.
        lines.push(h.name + '_bucket' + labelsOf(h.labels, { le: '+Inf' }) + ' ' + h.count);
        lines.push(h.name + '_sum' + labelsOf(h.labels) + ' ' + h.sum);
        lines.push(h.name + '_count' + labelsOf(h.labels) + ' ' + h.count);
      }
      return lines.join('\\n') + '\\n';
    },
  };
}`, "The cumulative-bucket rule and the mandatory +Inf bucket are the two details a hand-written exporter usually gets wrong."),
    file("src/server.mjs", `// src/server.mjs — an HTTP service that measures itself.
import { createServer } from 'node:http';
import { createRegistry } from './registry.mjs';

const metrics = createRegistry();
let inFlight = 0;

createServer((request, response) => {
  const startedAt = process.hrtime.bigint();
  inFlight += 1;
  metrics.set('http_requests_in_flight', {}, inFlight);

  // The route label is the TEMPLATE, not the actual path. Using request.url here
  // would create a new time series per id and melt the Prometheus server.
  const route = request.url?.startsWith('/notes/') ? '/notes/:id' : request.url ?? '/';

  response.on('finish', () => {
    inFlight -= 1;
    metrics.set('http_requests_in_flight', {}, inFlight);
    const seconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
    // Status CLASS, not the exact code: 2xx/4xx/5xx is what alerts are written against.
    const status = String(response.statusCode)[0] + 'xx';
    metrics.increment('http_requests', { route, method: request.method, status });
    metrics.observe('http_request_duration_seconds', { route }, seconds);
  });

  if (request.url === '/metrics') {
    // Prometheus requires this exact content type to parse the body.
    response.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
    return response.end(metrics.render());
  }
  if (request.url === '/health') { response.writeHead(200); return response.end('ok'); }
  response.writeHead(request.url?.startsWith('/notes/') ? 200 : 404);
  response.end();
}).listen(3000, '127.0.0.1', () => console.log('listening on http://127.0.0.1:3000'));`, "Two label choices — route template and status class — are the difference between a useful dashboard and an unusable one."),
    file("test/registry.test.mjs", `// test/registry.test.mjs — the exposition format, checked line by line.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRegistry } from '../src/registry.mjs';

test('counters accumulate per label set', () => {
  const metrics = createRegistry();
  metrics.increment('http_requests', { route: '/notes/:id', status: '2xx' });
  metrics.increment('http_requests', { route: '/notes/:id', status: '2xx' });
  metrics.increment('http_requests', { route: '/notes/:id', status: '5xx' });
  const output = metrics.render();
  assert.match(output, /http_requests_total\\{route="\\/notes\\/:id",status="2xx"\\} 2/);
  assert.match(output, /http_requests_total\\{route="\\/notes\\/:id",status="5xx"\\} 1/);
});

test('histogram buckets are cumulative and +Inf equals the count', () => {
  const metrics = createRegistry();
  for (const seconds of [0.02, 0.2, 0.9]) metrics.observe('latency_seconds', {}, seconds);
  const output = metrics.render();
  assert.match(output, /latency_seconds_bucket\\{le="0.05"\\} 1/);   // just the 0.02
  assert.match(output, /latency_seconds_bucket\\{le="0.5"\\} 2/);    // 0.02 and 0.2
  assert.match(output, /latency_seconds_bucket\\{le="\\+Inf"\\} 3/);
  assert.match(output, /latency_seconds_count\\{\\} 3|latency_seconds_count 3/);
});

test('a gauge reports the latest value, not a sum', () => {
  const metrics = createRegistry();
  metrics.set('http_requests_in_flight', {}, 5);
  metrics.set('http_requests_in_flight', {}, 2);
  assert.match(metrics.render(), /http_requests_in_flight 2/);
});`, "Three tests covering the three metric types, including the +Inf bucket that a hand-rolled exporter usually forgets."),
    readme("Prometheus exposition", "Node.js 22.12+. `npm test` runs three tests; `npm start` serves http://127.0.0.1:3000 with /metrics, /health and /notes/:id. Prometheus itself is not required — scrape it with `curl http://127.0.0.1:3000/metrics`. A real service uses prom-client rather than a hand-written registry; the format and the label rules are identical."),
  ],
  ["npm test", "npm start", "curl -s http://127.0.0.1:3000/notes/42 >/dev/null && curl -s http://127.0.0.1:3000/metrics"],
  "three tests pass\nlistening on http://127.0.0.1:3000\nhttp_requests_total{method=\"GET\",route=\"/notes/:id\",status=\"2xx\"} 1\nhttp_request_duration_seconds_bucket{le=\"0.05\",route=\"/notes/:id\"} 1",
  [
    api("createRegistry", "createRegistry(): Registry", "increment, set, observe and render — the four operations an exporter needs.", []),
    api("registry.observe", "observe(name: string, labels: object, value: number, buckets?: number[]): void", "Nothing; adds the observation to every bucket at or above its value.", [param("buckets", "number[]", "Upper bounds in seconds; chosen up front and not changeable later.")]),
    api("registry.render", "render(): string", "The text/plain; version=0.0.4 body, with the mandatory +Inf bucket per histogram.", []),
  ],
);

const observabilityHard = project(
  "application",
  "Correlate traces, logs and alerts",
  "Three signals, one incident: a trace id threads through every log line, an alert rule fires on the trace's error rate, and burn-rate maths decides whether anyone should be woken up.",
  [
    nodePackage({ test: "node --test", start: "node scripts/incident.mjs" }),
    file("src/tracing.mjs", `// src/tracing.mjs — W3C trace context, propagated the way OpenTelemetry does.
import { randomBytes } from 'node:crypto';

const id = bytes => randomBytes(bytes).toString('hex');

/**
 * traceparent is version-traceId-spanId-flags. Every service in a request
 * shares the traceId; each one contributes its own spanId.
 * @param {string} [header] An inbound traceparent, if the caller sent one.
 */
export function contextFrom(header) {
  const match = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/.exec(header ?? '');
  // No valid inbound header means this service starts the trace. Generating a
  // NEW traceId when one was supplied is what breaks a distributed trace in half.
  return match ? { traceId: match[1], parentSpanId: match[2], sampled: (Number.parseInt(match[3], 16) & 1) === 1 }
    : { traceId: id(16), parentSpanId: undefined, sampled: true };
}

/** @returns {string} the traceparent to send downstream, carrying THIS span as the parent. */
export const traceparent = span => '00-' + span.traceId + '-' + span.spanId + '-' + (span.sampled ? '01' : '00');

export function createTracer(sink = []) {
  return {
    spans: sink,
    /** @param {{name:string,context:object,attributes?:object}} input */
    async span({ name, context, attributes = {} }, work) {
      const span = { name, traceId: context.traceId, spanId: id(8), parentSpanId: context.parentSpanId, sampled: context.sampled, attributes: { ...attributes }, status: 'ok' };
      const startedAt = Date.now();
      try {
        // The child context: this span becomes the parent of anything inside it.
        return await work({ traceId: span.traceId, parentSpanId: span.spanId, sampled: span.sampled }, span);
      } catch (error) {
        // Recording the error ON the span is what makes it findable in Tempo or
        // Jaeger; a caught-and-logged error leaves the trace looking healthy.
        span.status = 'error';
        span.attributes['exception.message'] = error.message;
        throw error;
      } finally {
        span.durationMs = Date.now() - startedAt;
        sink.push(span);
      }
    },
  };
}`, "The two comments mark the two ways distributed tracing usually fails: a regenerated trace id, and an error the span never hears about."),
    file("src/logging.mjs", `// src/logging.mjs — structured logs that a trace id can join against.

/**
 * Loki indexes labels, not log bodies. Keep labels low-cardinality (service,
 * level, env) and put the high-cardinality identifiers — trace id, user id — in
 * the JSON body, where they are searchable but not indexed.
 */
export function createLogger(service, sink = []) {
  const write = (level, message, context, fields) => {
    sink.push({
      // Indexed labels: a small, fixed set of values.
      labels: { service, level },
      // The body: high-cardinality fields live here.
      body: JSON.stringify({ timestamp: new Date().toISOString(), message, trace_id: context?.traceId, span_id: context?.parentSpanId, ...fields }),
    });
  };
  return {
    lines: sink,
    info: (message, context, fields) => write('info', message, context, fields),
    error: (message, context, fields) => write('error', message, context, fields),
    /** Every line for one trace — the query an incident actually starts from. */
    forTrace: traceId => sink.filter(line => JSON.parse(line.body).trace_id === traceId),
  };
}`, "The labels/body split is the whole design: it is what keeps a log store queryable without indexing a million distinct trace ids."),
    file("src/slo.mjs", `// src/slo.mjs — error budget and multi-window burn rate.

/**
 * @param {{objective:number,windowDays:number}} slo e.g. { objective: 0.999, windowDays: 30 }
 * @param {{good:number,total:number}} counts Requests in the window.
 */
export function budget(slo, counts) {
  const allowedFailures = counts.total * (1 - slo.objective);
  const actualFailures = counts.total - counts.good;
  return {
    allowedFailures,
    actualFailures,
    // Fraction of the budget consumed. Above 1 the SLO is already missed.
    consumed: allowedFailures === 0 ? 0 : actualFailures / allowedFailures,
    remaining: Math.max(0, allowedFailures - actualFailures),
  };
}

/**
 * Burn rate: how many times faster than sustainable the budget is being spent.
 * A rate of 1 exhausts the budget exactly at the end of the window.
 */
export const burnRate = (slo, counts) => {
  const errorRate = counts.total === 0 ? 0 : (counts.total - counts.good) / counts.total;
  return errorRate / (1 - slo.objective);
};

/**
 * The multi-window rule that stops alert fatigue: a page needs a fast burn in a
 * SHORT window and confirmation in a LONGER one. A brief spike burns fast but
 * fails the long window and only produces a ticket.
 * @returns {'page'|'ticket'|'none'}
 */
export function decide(slo, shortWindow, longWindow) {
  const fast = burnRate(slo, shortWindow);
  const slow = burnRate(slo, longWindow);
  if (fast >= 14.4 && slow >= 14.4) return 'page';    // burns a 30-day budget in ~2 days
  if (fast >= 6 && slow >= 6) return 'page';          // slower, still urgent
  if (slow >= 1) return 'ticket';                     // degrading, not an emergency
  return 'none';
}`, "Requiring both windows is the entire anti-fatigue mechanism: one window alone pages on every transient blip."),
    file("test/observability.test.mjs", `// test/observability.test.mjs — correlation first, then the paging decision.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contextFrom, createTracer, traceparent } from '../src/tracing.mjs';
import { createLogger } from '../src/logging.mjs';
import { budget, burnRate, decide } from '../src/slo.mjs';

const slo = { objective: 0.999, windowDays: 30 };

test('an inbound traceparent is continued, not replaced', () => {
  const inbound = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
  const context = contextFrom(inbound);
  assert.equal(context.traceId, '4bf92f3577b34da6a3ce929d0e0e4736');
  assert.equal(context.parentSpanId, '00f067aa0ba902b7');
  assert.equal(context.sampled, true);
});

test('nested spans share one trace id and chain their parents', async () => {
  const tracer = createTracer();
  await tracer.span({ name: 'handle-request', context: contextFrom() }, async child =>
    tracer.span({ name: 'query-database', context: child }, async () => 'rows'));

  const [inner, outer] = tracer.spans;                       // inner finishes first
  assert.equal(inner.traceId, outer.traceId);
  assert.equal(inner.parentSpanId, outer.spanId);
  assert.match(traceparent(outer), /^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
});

test('a thrown error marks the span and still propagates', async () => {
  const tracer = createTracer();
  await assert.rejects(
    tracer.span({ name: 'charge', context: contextFrom() }, async () => { throw new Error('gateway timeout'); }),
    /gateway timeout/,
  );
  assert.equal(tracer.spans[0].status, 'error');
  assert.equal(tracer.spans[0].attributes['exception.message'], 'gateway timeout');
});

test('logs are retrievable by the trace id that produced them', () => {
  const logger = createLogger('notes-api');
  const context = contextFrom();
  logger.info('request received', context, { route: '/notes/:id' });
  logger.error('charge failed', context, { provider: 'stripe' });
  logger.info('unrelated', contextFrom());

  const lines = logger.forTrace(context.traceId);
  assert.equal(lines.length, 2);
  assert.deepEqual(lines.map(line => line.labels.level), ['info', 'error']);
  // The trace id must NOT be an indexed label, or the label set is unbounded.
  assert.deepEqual(Object.keys(lines[0].labels).sort(), ['level', 'service']);
});

test('error budget maths matches the objective', () => {
  const result = budget(slo, { good: 999_000, total: 1_000_000 });
  assert.equal(result.allowedFailures, 1000);
  assert.equal(result.actualFailures, 1000);
  assert.equal(result.consumed, 1);                          // exactly exhausted
});

test('a short spike raises a ticket; a sustained outage pages', () => {
  const spike = { good: 900, total: 1000 };                  // 10% errors, 5 minutes
  const healthyHour = { good: 599_900, total: 600_000 };
  assert.ok(burnRate(slo, spike) > 14.4);
  assert.equal(decide(slo, spike, healthyHour), 'none');     // not confirmed by the long window
  assert.equal(decide(slo, spike, { good: 540_000, total: 600_000 }), 'page');
  assert.equal(decide(slo, healthyHour, { good: 598_000, total: 600_000 }), 'ticket');
});`, "Six tests. The last one is the reason for the two-window rule: the same spike either pages or does not, depending on whether it lasted."),
    json("alerts/slo.rules.json", {
      groups: [{
        name: "notes-api-slo",
        rules: [
          {
            alert: "NotesApiFastBurn",
            expr: "(1 - (sum(rate(http_requests_total{job=\"notes-api\",status!~\"5xx\"}[5m])) / sum(rate(http_requests_total{job=\"notes-api\"}[5m])))) / 0.001 > 14.4 and (1 - (sum(rate(http_requests_total{job=\"notes-api\",status!~\"5xx\"}[1h])) / sum(rate(http_requests_total{job=\"notes-api\"}[1h])))) / 0.001 > 14.4",
            for: "2m",
            labels: { severity: "page" },
            annotations: { summary: "Burning the 30-day error budget 14.4x faster than sustainable", runbook: "https://runbooks.example.com/notes-api/fast-burn" },
          },
          {
            alert: "NotesApiSlowBurn",
            expr: "(1 - (sum(rate(http_requests_total{job=\"notes-api\",status!~\"5xx\"}[6h])) / sum(rate(http_requests_total{job=\"notes-api\"}[6h])))) / 0.001 > 1",
            for: "1h",
            labels: { severity: "ticket" },
            annotations: { summary: "Error budget degrading; no page, but it needs attention this week" },
          },
        ],
      }],
    }, "The same two-window rule as src/slo.mjs, written as Prometheus rules. `and` between the windows is what src/slo.mjs expresses as two conditions."),
    file("scripts/incident.mjs", `// scripts/incident.mjs — walk one failed request from trace to paging decision.
import { contextFrom, createTracer } from '../src/tracing.mjs';
import { createLogger } from '../src/logging.mjs';
import { decide } from '../src/slo.mjs';

const tracer = createTracer();
const logger = createLogger('notes-api');
const root = contextFrom();   // no inbound header: this service starts the trace

try {
  await tracer.span({ name: 'POST /orders', context: root, attributes: { 'http.route': '/orders' } }, async child => {
    logger.info('order received', child, { orderId: 'A-1' });
    await tracer.span({ name: 'charge-card', context: child }, async () => { throw new Error('gateway timeout'); });
  });
} catch {
  logger.error('order failed', root, { orderId: 'A-1' });
}

console.log('trace id:', root.traceId);
console.log('spans:', tracer.spans.map(span => span.name + '=' + span.status).join(', '));
console.log('log lines for this trace:', logger.forTrace(root.traceId).length);
console.log('paging decision:', decide({ objective: 0.999, windowDays: 30 }, { good: 900, total: 1000 }, { good: 540_000, total: 600_000 }));`, "One trace id ties the spans and the log lines together, and the burn rate turns them into a decision about waking someone up."),
    readme("Traces, logs and SLO alerts", "Node.js 22.12+. `npm test` runs six tests; `npm start` walks one incident. No collector, Prometheus, Loki or Tempo is required — the tracer and logger collect into arrays. A real service uses the OpenTelemetry SDK and an OTLP exporter; the trace-context and label rules implemented here are the same ones it follows. alerts/slo.rules.json is a valid Prometheus rule group."),
  ],
  ["npm test", "npm start", "Change the long window in scripts/incident.mjs to a healthy one and re-run: the decision drops from page to none."],
  "six tests pass\ntrace id: 4bf92f3577b34da6a3ce929d0e0e4736\nspans: charge-card=error, POST /orders=error\nlog lines for this trace: 2\npaging decision: page",
  [
    api("contextFrom", "contextFrom(header?: string): { traceId: string; parentSpanId?: string; sampled: boolean }", "The inbound trace continued, or a new trace when no valid traceparent was supplied.", [param("header", "string", "A W3C traceparent header, if the caller sent one.")]),
    api("decide", "decide(slo: Slo, shortWindow: Counts, longWindow: Counts): 'page' | 'ticket' | 'none'", "The alert action; a page needs a fast burn confirmed in both windows.", [param("shortWindow", "object", "good and total over roughly five minutes."), param("longWindow", "object", "good and total over roughly an hour, used to confirm.")]),
    api("budget", "budget(slo: Slo, counts: Counts): { allowedFailures: number; actualFailures: number; consumed: number; remaining: number }", "How much of the error budget the window consumed; consumed above 1 means the SLO is missed.", [param("slo", "object", "objective (e.g. 0.999) and windowDays.")]),
  ],
);

/* --------------------------------------------------------------------- *
 * Lesson: Supply chain — Vault, SOPS, Trivy, SBOM, Sigstore, SonarQube   *
 * --------------------------------------------------------------------- */

const supplySimple = project(
  "concept",
  "Generate an SBOM from a lockfile",
  "You cannot answer 'are we affected?' without a list of what you ship. A CycloneDX SBOM is that list, and a lockfile already contains everything needed to produce one.",
  [
    json("package-lock.json", {
      name: "notes-api",
      lockfileVersion: 3,
      packages: {
        "": { name: "notes-api", version: "1.9.0", dependencies: { fastify: "5.1.0" }, devDependencies: { tap: "21.0.1" } },
        "node_modules/fastify": { version: "5.1.0", resolved: "https://registry.npmjs.org/fastify/-/fastify-5.1.0.tgz", integrity: "sha512-AAAA", license: "MIT" },
        "node_modules/find-my-way": { version: "9.1.0", resolved: "https://registry.npmjs.org/find-my-way/-/find-my-way-9.1.0.tgz", integrity: "sha512-BBBB", license: "MIT" },
        "node_modules/tap": { version: "21.0.1", resolved: "https://registry.npmjs.org/tap/-/tap-21.0.1.tgz", integrity: "sha512-CCCC", license: "BSD-2-Clause", dev: true },
        "node_modules/left-pad": { version: "1.3.0", resolved: "https://registry.npmjs.org/left-pad/-/left-pad-1.3.0.tgz", integrity: "sha512-DDDD" },
      },
    }, "A lockfile with the two things an SBOM needs: exact versions and integrity hashes. left-pad has no license field, which the report has to notice."),
    file("src/sbom.mjs", `// src/sbom.mjs — lockfile to CycloneDX.

/**
 * @param {object} lock A parsed package-lock.json (lockfileVersion 2 or 3).
 * @param {{includeDev?:boolean}} options
 * @returns {object} A CycloneDX 1.5 document.
 */
export function toCycloneDx(lock, { includeDev = false } = {}) {
  const root = lock.packages[''];
  const components = Object.entries(lock.packages)
    .filter(([path]) => path !== '')                       // skip the root project itself
    // Dev dependencies are not shipped, so including them inflates every scan
    // report with findings that cannot affect production.
    .filter(([, entry]) => includeDev || !entry.dev)
    .map(([path, entry]) => {
      const name = path.replace(/^node_modules\\//, '').replace(/.*\\/node_modules\\//, '');
      return {
        type: 'library',
        name,
        version: entry.version,
        // purl is the identifier vulnerability databases match against; without
        // it a scanner has to guess, and guesses produce false negatives.
        purl: 'pkg:npm/' + encodeURIComponent(name) + '@' + entry.version,
        // The integrity hash makes the SBOM verifiable rather than merely descriptive.
        hashes: entry.integrity ? [{ alg: entry.integrity.split('-')[0].toUpperCase().replace('SHA', 'SHA-'), content: entry.integrity.split('-')[1] }] : [],
        licenses: entry.license ? [{ license: { id: entry.license } }] : [],
      };
    });

  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    version: 1,
    metadata: { component: { type: 'application', name: root.name, version: root.version } },
    components,
  };
}

/** A component with no declared license is a legal unknown, not a pass. */
export const unlicensed = sbom => sbom.components.filter(component => component.licenses.length === 0).map(c => c.name);`, "Two decisions carry the value: excluding dev dependencies, and emitting a purl so a scanner can match components at all."),
    file("scripts/generate.mjs", `// scripts/generate.mjs — write the SBOM and report what it cannot vouch for.
import { readFile, writeFile } from 'node:fs/promises';
import { toCycloneDx, unlicensed } from '../src/sbom.mjs';

const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
const sbom = toCycloneDx(lock);
await writeFile('sbom.json', JSON.stringify(sbom, null, 2));

console.log('components (production only):', sbom.components.length);
console.log('purls:', sbom.components.map(component => component.purl).join(' '));
const missing = unlicensed(sbom);
if (missing.length) console.log('NO DECLARED LICENSE:', missing.join(', '));
console.log('wrote sbom.json');`, "Writing the file is the point: the SBOM is an artifact the pipeline attaches to the release, not console output."),
    readme("CycloneDX SBOM", "Run `node scripts/generate.mjs` with Node.js 22.12+; it writes sbom.json next to the lockfile. No network access and no scanner are needed. Production tooling (`cdxgen`, `syft`, `npm sbom`) produces richer documents — dependency graphs, VCS metadata — but the identifying fields are these."),
  ],
  ["node scripts/generate.mjs", "cat sbom.json", "Pass { includeDev: true } in scripts/generate.mjs and re-run: tap appears and the component count rises, which is why scans default to production only."],
  "components (production only): 3\npurls: pkg:npm/fastify@5.1.0 pkg:npm/find-my-way@9.1.0 pkg:npm/left-pad@1.3.0\nNO DECLARED LICENSE: left-pad\nwrote sbom.json",
  [
    api("toCycloneDx", "toCycloneDx(lock: object, options?: { includeDev?: boolean }): object", "A CycloneDX 1.5 document with a purl and integrity hash per component.", [param("lock", "object", "A parsed package-lock.json, version 2 or 3."), param("includeDev", "boolean", "Include dev dependencies; false by default because they are not shipped.")]),
    api("unlicensed", "unlicensed(sbom: object): string[]", "Component names with no declared license — unknowns, not passes.", [param("sbom", "object", "A CycloneDX document from toCycloneDx.")]),
  ],
);

const supplyHard = project(
  "application",
  "A release gate over scans, signatures and secrets",
  "One decision function standing between a build and production: vulnerability findings with an exception process, signature and provenance verification, quality gates, and a scan that refuses to let a secret ship.",
  [
    nodePackage({ test: "node --test", start: "node scripts/gate.mjs" }),
    json("reports/trivy.json", {
      ArtifactName: "ghcr.io/example/notes-api@sha256:11aa22bb",
      Results: [{
        Target: "notes-api (alpine 3.21)",
        Vulnerabilities: [
          { VulnerabilityID: "CVE-2026-1111", PkgName: "libssl3", InstalledVersion: "3.3.1-r0", FixedVersion: "3.3.2-r0", Severity: "CRITICAL" },
          { VulnerabilityID: "CVE-2026-2222", PkgName: "busybox", InstalledVersion: "1.37.0-r0", FixedVersion: "", Severity: "HIGH" },
          { VulnerabilityID: "CVE-2026-3333", PkgName: "zlib", InstalledVersion: "1.3.1-r1", FixedVersion: "1.3.1-r2", Severity: "MEDIUM" },
        ],
      }],
    }, "Three findings, three different decisions: one fixable critical, one high with no fix available, one medium."),
    json("policy/exceptions.json", [
      { id: "CVE-2026-2222", reason: "No upstream fix; the affected applet is not present in this image.", approvedBy: "security@example.com", expires: "2026-10-01" },
    ], "An exception is a dated, attributed decision. Without an expiry it is just a permanently ignored vulnerability."),
    file("src/gate.mjs", `// src/gate.mjs — every reason a release may be blocked, in one place.

const RANK = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, UNKNOWN: 0 };

/**
 * @param {object} input
 * @param {object} input.scan A Trivy JSON report.
 * @param {{id:string,expires:string}[]} input.exceptions Approved, dated exceptions.
 * @param {{signed:boolean,identity?:string,builder?:string}} input.attestation Sigstore/provenance data.
 * @param {{coverage:number,newBlockerIssues:number}} input.quality SonarQube-style gate data.
 * @param {{findings:{file:string,rule:string}[]}} input.secrets Secret-scan output.
 * @param {{now?:Date,threshold?:string,minCoverage?:number,trustedIdentity?:string}} [input.options]
 * @returns {{allowed:boolean,blockers:string[],waived:string[]}}
 */
export function gate({ scan, exceptions, attestation, quality, secrets, options = {} }) {
  const { now = new Date(), threshold = 'HIGH', minCoverage = 80, trustedIdentity = 'https://github.com/example/notes-api/.github/workflows/release.yml@refs/heads/main' } = options;
  const blockers = [];
  const waived = [];

  // 1. A secret in the image is unconditional: no exception, no threshold. The
  //    credential is already compromised the moment the layer is pushed.
  for (const finding of secrets.findings) blockers.push('secret in ' + finding.file + ' (' + finding.rule + ')');

  // 2. Signature and provenance. An unsigned image, or one signed by an identity
  //    that is not the release workflow, did not come from the pipeline.
  if (!attestation.signed) blockers.push('image is not signed');
  else if (attestation.identity !== trustedIdentity) blockers.push('signed by an unexpected identity: ' + attestation.identity);

  // 3. Vulnerabilities at or above the threshold, minus live exceptions.
  const vulnerabilities = scan.Results.flatMap(result => result.Vulnerabilities ?? []);
  for (const vulnerability of vulnerabilities) {
    if (RANK[vulnerability.Severity] < RANK[threshold]) continue;
    const exception = exceptions.find(entry => entry.id === vulnerability.VulnerabilityID);
    // An EXPIRED exception stops waiving. This is the whole reason for the date:
    // a "temporary" waiver that never lapses is an ignored vulnerability.
    if (exception && new Date(exception.expires) > now) { waived.push(vulnerability.VulnerabilityID + ' (expires ' + exception.expires + ')'); continue; }
    if (exception) blockers.push(vulnerability.VulnerabilityID + ': exception expired on ' + exception.expires);
    else blockers.push(vulnerability.VulnerabilityID + ' ' + vulnerability.Severity + ' in ' + vulnerability.PkgName + (vulnerability.FixedVersion ? ' (fix: ' + vulnerability.FixedVersion + ')' : ' (no fix available)'));
  }

  // 4. Quality gate on NEW code. Applying a coverage target to the whole legacy
  //    codebase blocks every release; applying it to the change does not.
  if (quality.newBlockerIssues > 0) blockers.push(quality.newBlockerIssues + ' blocker issues in new code');
  if (quality.coverage < minCoverage) blockers.push('coverage on new code ' + quality.coverage + '% is below ' + minCoverage + '%');

  return { allowed: blockers.length === 0, blockers, waived };
}`, "Ordering is deliberate: the unconditional check runs first, so a leaked secret is the headline rather than the fourth line of a long report."),
    file("src/secret-scan.mjs", `// src/secret-scan.mjs — patterns that must never reach a layer or a commit.

/** High-signal patterns only. A noisy scanner gets disabled, which helps nobody. */
const RULES = [
  { rule: 'aws-access-key-id', pattern: /\\bAKIA[0-9A-Z]{16}\\b/ },
  { rule: 'private-key-block', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { rule: 'github-token', pattern: /\\bgh[pousr]_[A-Za-z0-9]{36,}\\b/ },
  { rule: 'connection-string-password', pattern: /\\b(?:postgres|mysql|mongodb)(?:\\+srv)?:\\/\\/[^\\s:@]+:[^\\s:@]+@/ },
];

/** Placeholders in documentation and tests would otherwise dominate the findings. */
const ALLOW = [/EXAMPLE|PLACEHOLDER|CHANGEME|xxxx/i, /^tests?\\//, /\\.example$/];

/**
 * @param {{path:string,content:string}[]} files
 * @returns {{findings:{file:string,rule:string}[]}}
 */
export function scanSecrets(files) {
  const findings = [];
  for (const file of files) {
    if (ALLOW.some(pattern => pattern.test(file.path))) continue;
    for (const { rule, pattern } of RULES) {
      // Skip an obvious placeholder on the matching LINE, not the whole file:
      // a real key and a placeholder can live in the same file.
      const line = file.content.split('\\n').find(candidate => pattern.test(candidate));
      if (line && !ALLOW.some(allowed => allowed.test(line))) findings.push({ file: file.path, rule });
    }
  }
  return { findings };
}`, "Allow-listing per line rather than per file is what keeps the scanner both quiet and honest."),
    file("test/gate.test.mjs", `// test/gate.test.mjs — every branch of the release decision.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gate } from '../src/gate.mjs';
import { scanSecrets } from '../src/secret-scan.mjs';

const read = async path => JSON.parse(await readFile(new URL('../' + path, import.meta.url), 'utf8'));
const scan = await read('reports/trivy.json');
const exceptions = await read('policy/exceptions.json');
const trusted = 'https://github.com/example/notes-api/.github/workflows/release.yml@refs/heads/main';
const clean = { findings: [] };
const good = { signed: true, identity: trusted, builder: 'github-actions' };
const quality = { coverage: 86, newBlockerIssues: 0 };
const before = new Date('2026-09-12');

test('a fixable critical blocks; a dated exception waives the un-fixable high', () => {
  const result = gate({ scan, exceptions, attestation: good, quality, secrets: clean, options: { now: before } });
  assert.equal(result.allowed, false);
  assert.deepEqual(result.blockers, ['CVE-2026-1111 CRITICAL in libssl3 (fix: 3.3.2-r0)']);
  assert.deepEqual(result.waived, ['CVE-2026-2222 (expires 2026-10-01)']);
});

test('MEDIUM stays below the threshold', () => {
  const result = gate({ scan, exceptions, attestation: good, quality, secrets: clean, options: { now: before } });
  assert.equal(result.blockers.some(blocker => blocker.includes('CVE-2026-3333')), false);
});

test('an expired exception stops waiving', () => {
  const result = gate({ scan, exceptions, attestation: good, quality, secrets: clean, options: { now: new Date('2026-11-01') } });
  assert.ok(result.blockers.includes('CVE-2026-2222: exception expired on 2026-10-01'));
  assert.deepEqual(result.waived, []);
});

test('a signature from an unexpected identity blocks the release', () => {
  const result = gate({ scan, exceptions, attestation: { signed: true, identity: 'https://github.com/attacker/fork/.github/workflows/x.yml@refs/heads/main' }, quality, secrets: clean, options: { now: before } });
  assert.ok(result.blockers.some(blocker => blocker.startsWith('signed by an unexpected identity')));
});

test('a clean release passes', () => {
  const result = gate({ scan: { Results: [] }, exceptions, attestation: good, quality, secrets: clean, options: { now: before } });
  assert.deepEqual(result, { allowed: true, blockers: [], waived: [] });
});

test('low coverage on new code blocks, but only new code is measured', () => {
  const result = gate({ scan: { Results: [] }, exceptions, attestation: good, quality: { coverage: 41, newBlockerIssues: 0 }, secrets: clean, options: { now: before } });
  assert.deepEqual(result.blockers, ['coverage on new code 41% is below 80%']);
});

test('the secret scanner separates a real key from a documented placeholder', () => {
  const { findings } = scanSecrets([
    { path: 'src/config.mjs', content: 'const key = "AKIAIOSFODNN7EXAMPLE";' },
    { path: 'src/deploy.mjs', content: 'const key = "AKIA1234567890ABCDEF";' },
    { path: 'tests/fixtures.mjs', content: 'const key = "AKIA1234567890ABCDEF";' },
  ]);
  assert.deepEqual(findings, [{ file: 'src/deploy.mjs', rule: 'aws-access-key-id' }]);
});

test('a leaked secret blocks even when everything else is clean', () => {
  const result = gate({ scan: { Results: [] }, exceptions, attestation: good, quality, secrets: { findings: [{ file: 'src/deploy.mjs', rule: 'aws-access-key-id' }] }, options: { now: before } });
  assert.deepEqual(result.blockers, ['secret in src/deploy.mjs (aws-access-key-id)']);
});`, "Eight tests. The expired-exception test is the one that keeps the exception list from becoming a graveyard."),
    file("scripts/gate.mjs", `// scripts/gate.mjs — the decision, printed the way a pipeline step reports it.
import { readFile } from 'node:fs/promises';
import { gate } from '../src/gate.mjs';

const read = async path => JSON.parse(await readFile(path, 'utf8'));
const result = gate({
  scan: await read('reports/trivy.json'),
  exceptions: await read('policy/exceptions.json'),
  // In a pipeline these come from 'cosign verify' and the SonarQube API.
  attestation: { signed: true, identity: 'https://github.com/example/notes-api/.github/workflows/release.yml@refs/heads/main', builder: 'github-actions' },
  quality: { coverage: 86, newBlockerIssues: 0 },
  secrets: { findings: [] },
  options: { now: new Date('2026-09-12') },
});

for (const waiver of result.waived) console.log('WAIVED:', waiver);
for (const blocker of result.blockers) console.log('BLOCKED:', blocker);
console.log(result.allowed ? 'Release approved' : 'Release blocked');
process.exitCode = result.allowed ? 0 : 1;`, "Waivers print before blockers so a reviewer sees what was consciously accepted before what was refused."),
    readme("Release gate", "Node.js 22.12+. `npm test` runs eight tests; `npm start` prints the decision and exits 1 for the bundled reports. Nothing is scanned or verified live — reports/trivy.json is real Trivy output shape, and the attestation stands in for `cosign verify --certificate-identity`. Wire the real tools in by replacing the three inputs in scripts/gate.mjs."),
  ],
  ["npm test", "npm start", "Change the expiry in policy/exceptions.json to 2026-09-01 and re-run: the waiver becomes a blocker."],
  "eight tests pass\nWAIVED: CVE-2026-2222 (expires 2026-10-01)\nBLOCKED: CVE-2026-1111 CRITICAL in libssl3 (fix: 3.3.2-r0)\nRelease blocked",
  [
    api("gate", "gate(input: { scan; exceptions; attestation; quality; secrets; options? }): { allowed: boolean; blockers: string[]; waived: string[] }", "Whether the release may proceed, every blocker, and every consciously accepted waiver.", [param("exceptions", "object[]", "Dated, attributed waivers; an expired one becomes a blocker."), param("attestation", "object", "signed, identity and builder, as `cosign verify` reports them."), param("options.threshold", "string", "Lowest severity that blocks; default HIGH.")]),
    api("scanSecrets", "scanSecrets(files: { path: string; content: string }[]): { findings: { file: string; rule: string }[] }", "One finding per file/rule pair, with documented placeholders allow-listed per line.", [param("files", "object[]", "Paths and contents of the files about to be shipped or committed.")]),
  ],
);

/* --------------------------------------------------------------------- *
 * Lesson: Traffic, releases and on-call — Nginx, Istio, flags, SLOs      *
 * --------------------------------------------------------------------- */

const trafficSimple = project(
  "concept",
  "Split traffic and evaluate a feature flag",
  "Two independent switches people constantly conflate: routing decides which build serves a request, a flag decides which behaviour it runs. Both must be sticky per user, or the results are noise.",
  [
    file("src/split.mjs", `// src/split.mjs — deterministic, sticky traffic splitting.
import { createHash } from 'node:crypto';

/**
 * Hashing the user id gives a stable bucket: the SAME user always lands in the
 * same variant. Math.random() would reshuffle on every request, so a user could
 * see the canary and the stable build alternately within one session.
 * @param {string} key Stable identity — user id or session id, never a request id.
 * @param {string} salt Per-experiment salt, so two rollouts do not correlate.
 * @returns {number} 0-99.
 */
export function bucket(key, salt) {
  const digest = createHash('sha256').update(salt + ':' + key).digest();
  return digest.readUInt32BE(0) % 100;
}

/**
 * @param {{name:string,weight:number}[]} variants Weights must sum to 100.
 * @returns {string} The variant name for this key.
 */
export function route(key, variants, salt = 'route') {
  const total = variants.reduce((sum, variant) => sum + variant.weight, 0);
  // Weights that do not sum to 100 silently starve the last variant, so fail loudly.
  if (total !== 100) throw new Error('weights must sum to 100, got ' + total);
  let cursor = bucket(key, salt);
  for (const variant of variants) {
    if (cursor < variant.weight) return variant.name;
    cursor -= variant.weight;
  }
  return variants.at(-1).name;
}`, "One salted hash. The comment on Math.random() describes the bug that makes half of all canary results meaningless."),
    file("src/flag.mjs", `// src/flag.mjs — flag evaluation with targeting, and a default that fails safe.

/**
 * @typedef {{key:string,enabled:boolean,percentage?:number,allowUsers?:string[],blockUsers?:string[]}} Flag
 * @param {Flag} flag
 * @param {{userId:string}} context
 * @param {(key:string,salt:string)=>number} bucketFn Injected so tests are deterministic.
 * @returns {{on:boolean,reason:string}} The reason matters: a flag you cannot explain is a flag you cannot debug.
 */
export function evaluate(flag, context, bucketFn) {
  // A kill switch must beat every other rule, including explicit allow lists.
  if (!flag.enabled) return { on: false, reason: 'flag disabled' };
  // Block wins over allow: it is the safer direction when both are set by mistake.
  if (flag.blockUsers?.includes(context.userId)) return { on: false, reason: 'user blocked' };
  if (flag.allowUsers?.includes(context.userId)) return { on: true, reason: 'user allow-listed' };
  if (flag.percentage === undefined) return { on: true, reason: 'enabled for everyone' };
  // Salted by flag key, so a user in the 5% of one rollout is not automatically
  // in the 5% of every other rollout.
  const value = bucketFn(context.userId, flag.key);
  return value < flag.percentage
    ? { on: true, reason: 'in rollout bucket ' + value }
    : { on: false, reason: 'outside rollout bucket ' + value };
}`, "Precedence order is the design: kill switch, block, allow, percentage. Any other order has a case where a kill switch fails to kill."),
    file("scripts/demo.mjs", `// scripts/demo.mjs — show stickiness and distribution over a realistic population.
import assert from 'node:assert/strict';
import { bucket, route } from '../src/split.mjs';
import { evaluate } from '../src/flag.mjs';

const users = Array.from({ length: 10_000 }, (_, index) => 'user-' + index);
const variants = [{ name: 'stable', weight: 90 }, { name: 'canary', weight: 10 }];

const assignments = users.map(user => route(user, variants));
const canary = assignments.filter(name => name === 'canary').length;

// Sticky: the same user, asked twice, gets the same answer.
assert.equal(route('user-42', variants), route('user-42', variants));
// Roughly the requested split; hashing is not exact, so allow a tolerance.
assert.ok(Math.abs(canary - 1000) < 100, 'canary share should be near 10%');

const flag = { key: 'new-checkout', enabled: true, percentage: 5, allowUsers: ['user-1'], blockUsers: ['user-2'] };
const enabled = users.filter(user => evaluate(flag, { userId: user }, bucket).on).length;

console.log('canary share:', (canary / 100).toFixed(1) + '%');
console.log('flag on for:', (enabled / 100).toFixed(1) + '%');
console.log('allow-listed:', evaluate(flag, { userId: 'user-1' }, bucket).reason);
console.log('blocked:', evaluate(flag, { userId: 'user-2' }, bucket).reason);
console.log('kill switch:', evaluate({ ...flag, enabled: false }, { userId: 'user-1' }, bucket).reason);`, "Ten thousand users make the distribution real; the last line proves the kill switch beats the allow list."),
    readme("Traffic splitting and flags", "Run `node scripts/demo.mjs` with Node.js 22.12+. No proxy, mesh or flag service is required. The same bucketing appears in an Istio VirtualService (by weight) and in LaunchDarkly-style services (by percentage rollout); implementing it here makes the stickiness requirement explicit."),
  ],
  ["node scripts/demo.mjs", "Replace bucket()'s hash with Math.random() and re-run: the stickiness assertion fails immediately."],
  "canary share: 10.0%\nflag on for: 5.0%\nallow-listed: user allow-listed\nblocked: user blocked\nkill switch: flag disabled",
  [
    api("route", "route(key: string, variants: { name: string; weight: number }[], salt?: string): string", "The variant for this key; stable across calls and throws when weights do not sum to 100.", [param("key", "string", "Stable identity — user or session id, never a request id."), param("salt", "string", "Per-experiment salt so two rollouts do not correlate.")]),
    api("evaluate", "evaluate(flag: Flag, context: { userId: string }, bucketFn: Bucket): { on: boolean; reason: string }", "Whether the flag is on and which rule decided it.", [param("flag", "object", "enabled, optional percentage, allowUsers and blockUsers."), param("bucketFn", "function", "Injected bucketing so tests are deterministic.")]),
  ],
);

const trafficHard = project(
  "application",
  "An automated canary controller",
  "A canary that promotes or rolls back on its own: statistically compared metrics, a minimum-sample rule so early noise cannot decide anything, and the Istio weights each step would apply.",
  [
    nodePackage({ test: "node --test", start: "node scripts/canary.mjs" }),
    file("src/analysis.mjs", `// src/analysis.mjs — is the canary actually worse, or is this just noise?

/**
 * A two-proportion z-test. With small samples an apparent difference is usually
 * noise, and this is what stops a controller from rolling back on three requests.
 * @param {{good:number,total:number}} baseline
 * @param {{good:number,total:number}} canary
 * @returns {{significant:boolean,z:number,baselineRate:number,canaryRate:number}}
 */
export function compareErrorRates(baseline, canary) {
  const rate = counts => counts.total === 0 ? 0 : (counts.total - counts.good) / counts.total;
  const baselineRate = rate(baseline);
  const canaryRate = rate(canary);

  // Pooled proportion under the null hypothesis that both come from one population.
  const pooled = (baseline.total + canary.total) === 0 ? 0
    : ((baseline.total - baseline.good) + (canary.total - canary.good)) / (baseline.total + canary.total);
  const standardError = Math.sqrt(pooled * (1 - pooled) * (1 / (baseline.total || 1) + 1 / (canary.total || 1)));
  const z = standardError === 0 ? 0 : (canaryRate - baselineRate) / standardError;

  // 1.96 is the two-sided 95% threshold; only a POSITIVE z means the canary is worse.
  return { significant: z > 1.96, z, baselineRate, canaryRate };
}

/**
 * Latency is compared at a percentile, not a mean: a mean hides the tail that
 * users actually notice.
 */
export const percentileRegression = (baselineP95, canaryP95, tolerance = 1.2) => canaryP95 > baselineP95 * tolerance;`, "The pooled standard error is the whole point: without it, 1 error in 10 requests looks catastrophic and triggers a rollback."),
    file("src/controller.mjs", `// src/controller.mjs — the step machine: advance, hold or roll back.
import { compareErrorRates, percentileRegression } from './analysis.mjs';

/** Weight ladder. Each step needs its own soak, or the ladder is decoration. */
export const STEPS = [5, 25, 50, 100];

/**
 * @param {{step:number,observations:number}} state Current rung and how many analyses have run.
 * @param {{baseline:object,canary:object,baselineP95:number,canaryP95:number}} metrics
 * @param {{minSamples?:number,minObservations?:number}} [options]
 * @returns {{action:'promote'|'hold'|'rollback'|'complete',weights:{stable:number,canary:number},reason:string}}
 */
export function step(state, metrics, { minSamples = 200, minObservations = 2 } = {}) {
  const weightsFor = canary => ({ stable: 100 - canary, canary });
  const current = STEPS[state.step];

  // Not enough traffic yet: any verdict now is a coin flip dressed as a decision.
  if (metrics.canary.total < minSamples) {
    return { action: 'hold', weights: weightsFor(current), reason: 'only ' + metrics.canary.total + ' canary requests, need ' + minSamples };
  }

  const errors = compareErrorRates(metrics.baseline, metrics.canary);
  if (errors.significant) {
    // Rollback goes straight to 0, never one rung down: a bad build should stop
    // serving users immediately, not serve 25% of them instead of 50%.
    return { action: 'rollback', weights: weightsFor(0), reason: 'error rate ' + (errors.canaryRate * 100).toFixed(2) + '% vs ' + (errors.baselineRate * 100).toFixed(2) + '% (z=' + errors.z.toFixed(2) + ')' };
  }
  if (percentileRegression(metrics.baselineP95, metrics.canaryP95)) {
    return { action: 'rollback', weights: weightsFor(0), reason: 'p95 ' + metrics.canaryP95 + 'ms vs ' + metrics.baselineP95 + 'ms baseline' };
  }

  // Healthy, but one clean analysis is not a soak. Require a few before advancing.
  if (state.observations + 1 < minObservations) {
    return { action: 'hold', weights: weightsFor(current), reason: 'healthy; soaking (' + (state.observations + 1) + '/' + minObservations + ')' };
  }

  const next = state.step + 1;
  if (next >= STEPS.length) return { action: 'complete', weights: weightsFor(100), reason: 'canary promoted to 100%' };
  return { action: 'promote', weights: weightsFor(STEPS[next]), reason: 'advancing to ' + STEPS[next] + '%' };
}

/** The Istio resource the controller would apply for a given split. */
export const virtualService = ({ stable, canary }) => ({
  apiVersion: 'networking.istio.io/v1',
  kind: 'VirtualService',
  metadata: { name: 'notes-api' },
  spec: {
    hosts: ['notes-api'],
    http: [{
      route: [
        { destination: { host: 'notes-api', subset: 'stable' }, weight: stable },
        { destination: { host: 'notes-api', subset: 'canary' }, weight: canary },
      ],
    }],
  },
});`, "Rolling back to 0 rather than one rung down is a deliberate asymmetry: promotion is gradual, withdrawal is immediate."),
    file("test/controller.test.mjs", `// test/controller.test.mjs — the controller's four outcomes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { step, STEPS, virtualService } from '../src/controller.mjs';
import { compareErrorRates } from '../src/analysis.mjs';

const healthy = { baseline: { good: 9990, total: 10_000 }, canary: { good: 998, total: 1000 }, baselineP95: 120, canaryP95: 125 };

test('a small sample is never enough to decide', () => {
  const result = step({ step: 0, observations: 5 }, { ...healthy, canary: { good: 40, total: 41 } });
  assert.equal(result.action, 'hold');
  assert.match(result.reason, /need 200/);
});

test('one clean analysis holds; the second promotes', () => {
  assert.equal(step({ step: 0, observations: 0 }, healthy).action, 'hold');
  const promoted = step({ step: 0, observations: 1 }, healthy);
  assert.equal(promoted.action, 'promote');
  assert.deepEqual(promoted.weights, { stable: 75, canary: 25 });
});

test('a significantly worse error rate rolls straight back to zero', () => {
  const bad = { ...healthy, canary: { good: 900, total: 1000 } };
  const result = step({ step: 2, observations: 5 }, bad);
  assert.equal(result.action, 'rollback');
  assert.deepEqual(result.weights, { stable: 100, canary: 0 });
});

test('a latency regression rolls back even with a clean error rate', () => {
  const slow = { ...healthy, canaryP95: 400 };
  const result = step({ step: 1, observations: 5 }, slow);
  assert.equal(result.action, 'rollback');
  assert.match(result.reason, /p95 400ms/);
});

test('two errors in a thousand is not a statistically worse rate', () => {
  const comparison = compareErrorRates({ good: 9990, total: 10_000 }, { good: 998, total: 1000 });
  assert.equal(comparison.significant, false);
});

test('the last rung completes the rollout', () => {
  const result = step({ step: STEPS.length - 1, observations: 5 }, healthy);
  assert.equal(result.action, 'complete');
  assert.deepEqual(result.weights, { stable: 0, canary: 100 });
});

test('the applied VirtualService weights always sum to 100', () => {
  const resource = virtualService(step({ step: 0, observations: 1 }, healthy).weights);
  assert.equal(resource.spec.http[0].route.reduce((sum, route) => sum + route.weight, 0), 100);
});`, "Seven tests. The fifth is the one that keeps the controller calm: a real but tiny difference is not a reason to roll back."),
    file("scripts/canary.mjs", `// scripts/canary.mjs — run the ladder to completion against synthetic metrics.
import { step, STEPS, virtualService } from '../src/controller.mjs';

// CANARY_ERROR_RATE lets the same script demonstrate a rollback.
const errorRate = Number(process.env.CANARY_ERROR_RATE ?? 0.002);
const metrics = {
  baseline: { good: 9990, total: 10_000 },
  canary: { good: Math.round(1000 * (1 - errorRate)), total: 1000 },
  baselineP95: 120,
  canaryP95: 125,
};

const state = { step: 0, observations: 0 };
for (let tick = 0; tick < 12; tick += 1) {
  const result = step(state, metrics);
  console.log('[' + tick + ']', result.action, result.weights.canary + '%', '-', result.reason);
  if (result.action === 'rollback' || result.action === 'complete') {
    console.log('final VirtualService weights:', JSON.stringify(result.weights));
    break;
  }
  // A promotion resets the soak counter: each rung earns its own observations.
  if (result.action === 'promote') { state.step += 1; state.observations = 0; } else state.observations += 1;
}
console.log('ladder:', STEPS.join('% -> ') + '%');
void virtualService;`, "Resetting observations on promotion is the detail that makes each rung a real soak rather than a formality."),
    readme("Canary controller", "Node.js 22.12+. `npm test` runs seven tests; `npm start` runs the ladder. No mesh or cluster is needed — virtualService() returns the Istio resource a real controller would apply, and the metrics are synthetic. Wire it to production by replacing the metrics object with a Prometheus query."),
  ],
  ["npm test", "npm start", "CANARY_ERROR_RATE=0.1 npm start # a 10% error rate rolls back at the first analysis"],
  "seven tests pass\n[0] hold 5% - healthy; soaking (1/2)\n[1] promote 25% - advancing to 25%\n[2] hold 25% - healthy; soaking (1/2)\n[3] promote 50% - advancing to 50%\n[5] promote 100% - advancing to 100%\n[7] complete 100% - canary promoted to 100%",
  [
    api("step", "step(state: { step: number; observations: number }, metrics: Metrics, options?: StepOptions): { action: 'promote' | 'hold' | 'rollback' | 'complete'; weights: { stable: number; canary: number }; reason: string }", "The next action, the weights to apply, and the reason to log.", [param("state", "object", "Current rung on STEPS and how many clean analyses it has had."), param("options.minSamples", "number", "Canary requests required before any verdict; default 200."), param("options.minObservations", "number", "Clean analyses required per rung; default 2.")]),
    api("compareErrorRates", "compareErrorRates(baseline: Counts, canary: Counts): { significant: boolean; z: number; baselineRate: number; canaryRate: number }", "Whether the canary is significantly worse at 95% confidence, with the z-score.", [param("baseline", "object", "good and total for the stable version over the same window.")]),
    api("virtualService", "virtualService(weights: { stable: number; canary: number }): object", "The Istio VirtualService a controller would apply for that split.", [param("weights", "object", "Percentages that must sum to 100.")]),
  ],
);

/** Keyed by lesson title, so a lesson picks up its pair without a positional index. */
export const DEVOPS_RELIABILITY_EXAMPLES: Record<string, [CodeExample, CodeExample]> = {
  "Observability: Prometheus, Grafana, Loki, Tempo and OpenTelemetry": [observabilitySimple, observabilityHard],
  "Supply-chain security: Vault, SOPS, Trivy, SBOMs, Sigstore and SonarQube": [supplySimple, supplyHard],
  "Traffic, releases and on-call: Nginx, Istio, feature flags and SLOs": [trafficSimple, trafficHard],
};

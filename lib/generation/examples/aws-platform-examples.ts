import type { CodeExample } from "@/lib/domain";
import { api, file, json, nodePackage, param, project, readme } from "./builders";

/**
 * Complete projects for the AWS delivery, governance and data-protection
 * lessons: CloudFront and Route 53 at the edge, CloudTrail/Config/Organizations
 * for audit, and KMS/Secrets Manager for protecting data.
 *
 * Each lesson gets a `concept` project small enough to read in one sitting and
 * a harder `application` project that puts the same service to work. Everything
 * runs locally on Node.js 22.12+ with no AWS account, no credentials and no
 * network calls: AWS-shaped inputs are supplied as fixtures so the reader can
 * execute the logic that would run in the cloud. Every file's first line
 * repeats its project-relative path as a comment.
 */

/* --------------------------------------------------------------------- *
 * Lesson: Edge delivery — CloudFront, Route 53 and Global Accelerator    *
 * --------------------------------------------------------------------- */

const edgeSimple = project(
  "concept",
  "Read a CloudFront cache policy",
  "A distribution in front of a private S3 origin, plus a script that answers the only question a cache policy really asks: which requests share one cached response?",
  [
    json("infra/distribution.json", {
      Comment: "Study notes CDN",
      Enabled: true,
      DefaultRootObject: "index.html",
      Origins: [{ Id: "notes-s3", DomainName: "notes.s3.ap-south-1.amazonaws.com", OriginAccessControlId: "E1EXAMPLEOAC" }],
      DefaultCacheBehavior: {
        TargetOriginId: "notes-s3",
        ViewerProtocolPolicy: "redirect-to-https",
        Compress: true,
        AllowedMethods: ["GET", "HEAD"],
        CachePolicy: {
          Name: "notes-cache-policy",
          DefaultTTL: 86400,
          MinTTL: 0,
          MaxTTL: 31536000,
          ParametersInCacheKeyAndForwardedToOrigin: {
            EnableAcceptEncodingGzip: true,
            EnableAcceptEncodingBrotli: true,
            HeadersConfig: { HeaderBehavior: "whitelist", Headers: ["Accept-Language"] },
            QueryStringsConfig: { QueryStringBehavior: "whitelist", QueryStrings: ["page"] },
            CookiesConfig: { CookieBehavior: "none" },
          },
        },
      },
      PriceClass: "PriceClass_200",
    }, "The cache key is the whole story: only Accept-Language and ?page vary a cached object, and cookies are excluded so a personalised response is never shared."),
    file("src/cache-key.mjs", `// src/cache-key.mjs — build the cache key a CloudFront behaviour would build.

/**
 * @param {{HeadersConfig:object,QueryStringsConfig:object,CookiesConfig:object}} policy
 *   The ParametersInCacheKeyAndForwardedToOrigin block of a cache policy.
 * @param {{path:string,headers:Record<string,string>,query:Record<string,string>,cookies:Record<string,string>}} request
 * @returns {string} A stable key; two requests with the same key share one cached object.
 */
export function cacheKey(policy, request) {
  // The path is always part of the key — nothing about a request is implicit.
  const parts = [request.path];

  // Whitelisted headers only. Anything not listed cannot vary the cached copy,
  // which is exactly why an un-whitelisted Authorization header is dangerous.
  const headers = policy.HeadersConfig.HeaderBehavior === 'whitelist' ? policy.HeadersConfig.Headers : [];
  for (const name of [...headers].sort()) parts.push(name.toLowerCase() + '=' + (request.headers[name] ?? ''));

  // Same rule for query strings: ?page changes the key, ?utm_source does not,
  // so a hundred campaign links still hit one cached object.
  const queries = policy.QueryStringsConfig.QueryStringBehavior === 'whitelist' ? policy.QueryStringsConfig.QueryStrings : [];
  for (const name of [...queries].sort()) parts.push(name + '=' + (request.query[name] ?? ''));

  // CookieBehavior 'none' keeps cookies out of the key. A per-user cookie that
  // DID reach the key would give every visitor their own private cache entry.
  if (policy.CookiesConfig.CookieBehavior !== 'none') {
    for (const [name, value] of Object.entries(request.cookies).sort()) parts.push('cookie:' + name + '=' + value);
  }
  return parts.join('|');
}`, "One pure function. Reading it is the fastest way to see that a cache key is a whitelist, not a guess."),
    file("scripts/check.mjs", `// scripts/check.mjs — prove the policy shares and separates the right requests.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { cacheKey } from '../src/cache-key.mjs';

const distribution = JSON.parse(await readFile('infra/distribution.json', 'utf8'));
const policy = distribution.DefaultCacheBehavior.CachePolicy.ParametersInCacheKeyAndForwardedToOrigin;
const base = { path: '/notes', headers: { 'Accept-Language': 'en' }, query: { page: '2' }, cookies: {} };

// Two visitors with different session cookies must reuse ONE cached object.
assert.equal(
  cacheKey(policy, { ...base, cookies: { session: 'alice' } }),
  cacheKey(policy, { ...base, cookies: { session: 'bob' } }),
);
// A different page is different content, so it must NOT reuse that object.
assert.notEqual(cacheKey(policy, base), cacheKey(policy, { ...base, query: { page: '3' } }));
// A tracking parameter is not whitelisted, so it must not fragment the cache.
assert.equal(cacheKey(policy, base), cacheKey(policy, { ...base, query: { page: '2', utm_source: 'email' } }));

console.log('cache key:', cacheKey(policy, base));
console.log('Cache policy behaves as documented');`, "Three assertions covering the three ways a cache key goes wrong: too shared, not shared enough, and fragmented by junk."),
    readme("CloudFront cache policy", "Run `node scripts/check.mjs` with Node.js 22.12+. Nothing is deployed and no credentials are used: infra/distribution.json is read as data. Applying it for real needs an Origin Access Control on the bucket so the S3 origin stays private."),
  ],
  ["node scripts/check.mjs", "Change CookieBehavior to \"all\" in infra/distribution.json and re-run: the first assertion now fails, which is the bug the policy prevents."],
  "cache key: /notes|accept-language=en|page=2\nCache policy behaves as documented",
  [api("cacheKey", "cacheKey(policy: CacheKeyParameters, request: Request): string", "A stable string; equal keys mean CloudFront serves one cached object to both requests.", [param("policy", "object", "ParametersInCacheKeyAndForwardedToOrigin from the cache policy."), param("request", "object", "path, headers, query and cookies of one viewer request.")])],
);

const edgeHard = project(
  "application",
  "Signed URLs and a viewer-request function",
  "Private downloads at the edge: a CloudFront Function normalises and guards every request, and a signed-URL builder issues short-lived links whose signature is verified before the origin is consulted.",
  [
    nodePackage({ test: "node --test", start: "node scripts/demo.mjs" }),
    file("src/viewer-request.js", `// src/viewer-request.js — a CloudFront Function (cloudfront-js-2.0 runtime).
// Runs at every edge location before the cache is consulted: sub-millisecond,
// no network access, no require(). Keep it to request shaping and cheap guards.
function handler(event) {
  var request = event.request;

  // 1. Collapse index requests so /docs/ and /docs/index.html are one cache entry.
  if (request.uri.endsWith('/')) request.uri += 'index.html';

  // 2. Drop tracking parameters. They are not in the cache-key whitelist, but
  //    removing them here also keeps them out of the origin's access logs.
  ['utm_source', 'utm_medium', 'gclid'].forEach(function (key) { delete request.querystring[key]; });

  // 3. A cheap authorisation gate: /private/* requires a signature parameter.
  //    Real verification happens at the origin — this only rejects the obviously
  //    unsigned requests without paying for an origin round trip.
  if (request.uri.indexOf('/private/') === 0 && !request.querystring.sig) {
    return { statusCode: 403, statusDescription: 'Forbidden' };
  }
  return request; // Returning the request continues to the cache, then the origin.
}`, "The edge half, written in the restricted CloudFront Functions dialect (var, function, no imports) so it can be pasted into the console unchanged."),
    file("src/signed-url.mjs", `// src/signed-url.mjs — issue and verify time-limited download links.
import { createHmac, timingSafeEqual } from 'node:crypto';

/** Canonical string to sign: path plus expiry, so neither can be edited alone. */
const payload = (path, expiresAt) => path + '\\n' + expiresAt;

/**
 * @param {{path:string,secret:string,ttlSeconds?:number,now?:number}} input
 * @returns {string} A relative URL carrying its own expiry and signature.
 */
export function signUrl({ path, secret, ttlSeconds = 300, now = Date.now() }) {
  // Absolute expiry in seconds: the link stops working on its own if it leaks.
  const expiresAt = Math.floor(now / 1000) + ttlSeconds;
  const signature = createHmac('sha256', secret).update(payload(path, expiresAt)).digest('hex');
  return path + '?exp=' + expiresAt + '&sig=' + signature;
}

/**
 * @param {{url:string,secret:string,now?:number}} input
 * @returns {{valid:boolean,reason?:'expired'|'bad-signature'|'malformed'}}
 */
export function verifyUrl({ url, secret, now = Date.now() }) {
  const [path, query = ''] = url.split('?');
  const parameters = new URLSearchParams(query);
  const expiresAt = Number(parameters.get('exp'));
  const signature = parameters.get('sig');
  if (!signature || !Number.isInteger(expiresAt)) return { valid: false, reason: 'malformed' };

  // Check expiry first: an expired link is not worth a constant-time comparison.
  if (Math.floor(now / 1000) > expiresAt) return { valid: false, reason: 'expired' };

  const expected = createHmac('sha256', secret).update(payload(path, expiresAt)).digest();
  const actual = Buffer.from(signature, 'hex');
  // Lengths must match first: timingSafeEqual throws on a length mismatch.
  if (actual.length !== expected.length) return { valid: false, reason: 'bad-signature' };
  // Constant-time compare; a byte-by-byte === would leak the signature by timing.
  return timingSafeEqual(actual, expected) ? { valid: true } : { valid: false, reason: 'bad-signature' };
}`, "The origin half: one HMAC over path and expiry together, a constant-time comparison, and a reason code the caller can log."),
    file("test/signed-url.test.mjs", `// test/signed-url.test.mjs — the four cases that matter for a signed link.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signUrl, verifyUrl } from '../src/signed-url.mjs';

const secret = 'test-secret-not-for-production';
const now = 1_760_000_000_000; // Fixed clock: tests must not depend on wall time.

test('a fresh link verifies', () => {
  const url = signUrl({ path: '/private/report.pdf', secret, now });
  assert.deepEqual(verifyUrl({ url, secret, now }), { valid: true });
});

test('the link expires on its own', () => {
  const url = signUrl({ path: '/private/report.pdf', secret, ttlSeconds: 60, now });
  // 61 seconds later the same link is refused, with no server-side state.
  assert.deepEqual(verifyUrl({ url, secret, now: now + 61_000 }), { valid: false, reason: 'expired' });
});

test('the path cannot be swapped for another file', () => {
  const url = signUrl({ path: '/private/report.pdf', secret, now });
  const tampered = url.replace('report.pdf', 'salaries.pdf');
  assert.deepEqual(verifyUrl({ url: tampered, secret, now }), { valid: false, reason: 'bad-signature' });
});

test('the expiry cannot be extended', () => {
  const url = signUrl({ path: '/private/report.pdf', secret, ttlSeconds: 60, now });
  const expiry = Number(new URLSearchParams(url.split('?')[1]).get('exp'));
  const tampered = url.replace('exp=' + expiry, 'exp=' + (expiry + 86_400));
  assert.deepEqual(verifyUrl({ url: tampered, secret, now }), { valid: false, reason: 'bad-signature' });
});`, "Signing the path and expiry together is what makes the last two tests pass; sign either one alone and both attacks succeed."),
    file("test/viewer-request.test.mjs", `// test/viewer-request.test.mjs — exercise the edge function as a plain script.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

// The function file has no exports (CloudFront calls a global 'handler'), so it
// is evaluated in a fresh context and the global is read back out. Keeping one
// copy of the source means the tested file is exactly the deployed file.
const source = await readFile(new URL('../src/viewer-request.js', import.meta.url), 'utf8');
const sandbox = {};
runInNewContext(source, sandbox);
const handler = sandbox.handler;

const request = (uri, querystring = {}) => ({ request: { uri, querystring, headers: {} } });

test('directory requests collapse to index.html', () => {
  assert.equal(handler(request('/docs/')).uri, '/docs/index.html');
});

test('tracking parameters are stripped', () => {
  const result = handler(request('/notes', { page: { value: '2' }, utm_source: { value: 'email' } }));
  assert.deepEqual(Object.keys(result.querystring), ['page']);
});

test('unsigned private requests never reach the origin', () => {
  assert.equal(handler(request('/private/report.pdf')).statusCode, 403);
});`, "Evaluating the restricted-dialect file in a fresh vm context avoids a second copy of it that could drift from the deployed one."),
    file("scripts/demo.mjs", `// scripts/demo.mjs — issue a link, then show what a tampered copy does.
import { signUrl, verifyUrl } from '../src/signed-url.mjs';

// The secret comes from the environment, never from the repository.
const secret = process.env.URL_SIGNING_SECRET ?? 'demo-secret';
const url = signUrl({ path: '/private/report.pdf', secret, ttlSeconds: 300 });
console.log('signed:', url);
console.log('valid:', verifyUrl({ url, secret }).valid);
console.log('tampered:', verifyUrl({ url: url.replace('report', 'salaries'), secret }).reason);`, "A runnable walkthrough of the happy path and the attack, in six lines."),
    readme("Signed CloudFront downloads", "Node.js 22.12+. `npm test` runs seven tests; `npm start` prints a link. Nothing is deployed. In a real distribution src/viewer-request.js is published as a CloudFront Function on the viewer-request event, and verifyUrl runs at the origin with the secret held in Secrets Manager, not in the bundle."),
  ],
  ["npm test", "npm start", "URL_SIGNING_SECRET=$(openssl rand -hex 32) npm start"],
  "seven tests pass\nsigned: /private/report.pdf?exp=1760000300&sig=…\nvalid: true\ntampered: bad-signature",
  [
    api("signUrl", "signUrl(input: { path: string; secret: string; ttlSeconds?: number; now?: number }): string", "A relative URL carrying exp and sig; it stops working at exp with no server state.", [param("ttlSeconds", "number", "Link lifetime; default 300. Keep it as short as the download allows."), param("now", "number", "Injectable clock in ms, so tests do not depend on wall time.")]),
    api("verifyUrl", "verifyUrl(input: { url: string; secret: string; now?: number }): { valid: boolean; reason?: string }", "valid, plus a reason of 'expired' | 'bad-signature' | 'malformed' for logging.", [param("url", "string", "The path and query exactly as the viewer requested them.")]),
    api("handler", "handler(event: { request: CloudFrontRequest }): CloudFrontRequest | CloudFrontResponse", "The request to continue with, or a response that short-circuits at the edge.", [param("event.request", "object", "uri, querystring and headers; mutate and return it to rewrite.")], "CloudFront Function"),
  ],
);

/* --------------------------------------------------------------------- *
 * Lesson: Audit and governance — CloudTrail, Config, Organizations       *
 * --------------------------------------------------------------------- */

const auditSimple = project(
  "concept",
  "Read one CloudTrail record",
  "A CloudTrail event is just JSON. This project reduces one to the five fields an investigation actually starts from: who, what, where, when, and whether it worked.",
  [
    json("fixtures/event.json", {
      eventVersion: "1.09",
      eventTime: "2026-09-12T04:11:07Z",
      eventSource: "s3.amazonaws.com",
      eventName: "DeleteObject",
      awsRegion: "ap-south-1",
      sourceIPAddress: "203.0.113.24",
      userIdentity: { type: "AssumedRole", arn: "arn:aws:sts::123456789012:assumed-role/deploy-role/ci-run-88", sessionContext: { attributes: { mfaAuthenticated: "false" } } },
      requestParameters: { bucketName: "masterclass-notes", key: "reports/q3.pdf" },
      readOnly: false,
      managementEvent: false,
    }, "A real DeleteObject record, trimmed. Note userIdentity.type: the actor is a role session, not a person."),
    file("src/summarise.mjs", `// src/summarise.mjs — turn a CloudTrail record into one reviewable line.

/**
 * @param {object} event One record from a CloudTrail log file's Records array.
 * @returns {{actor:string,action:string,target:string,when:string,mfa:boolean,succeeded:boolean}}
 */
export function summarise(event) {
  const identity = event.userIdentity ?? {};
  return {
    // An assumed role hides the human behind it; the session name is the only
    // link back, which is why session names should identify the caller.
    actor: identity.arn ?? identity.type ?? 'unknown',
    action: event.eventSource.split('.')[0] + ':' + event.eventName,
    target: event.requestParameters?.bucketName
      ? event.requestParameters.bucketName + '/' + (event.requestParameters.key ?? '*')
      : event.awsRegion,
    when: event.eventTime,
    // An absent sessionContext means no MFA claim at all — treat that as false.
    mfa: identity.sessionContext?.attributes?.mfaAuthenticated === 'true',
    // CloudTrail records DENIED calls too. An absent errorCode means it worked.
    succeeded: !event.errorCode,
  };
}

/** True for calls that change or delete state — the ones worth alerting on. */
export const isMutating = event => event.readOnly === false;`, "Two small functions. `succeeded` reading an absent field is the subtlety: CloudTrail logs failed attempts, and those are often the interesting ones."),
    file("scripts/run.mjs", `// scripts/run.mjs — summarise the fixture and flag it if it is risky.
import { readFile } from 'node:fs/promises';
import { isMutating, summarise } from '../src/summarise.mjs';

const event = JSON.parse(await readFile('fixtures/event.json', 'utf8'));
const summary = summarise(event);
console.log(JSON.stringify(summary));

// A successful, un-MFA'd, state-changing call is the shape most reviews open with.
if (isMutating(event) && summary.succeeded && !summary.mfa) console.log('REVIEW: mutating call without MFA');`, "The point of the summary: a one-line risk rule you can read out loud in a review."),
    readme("CloudTrail record", "Run `node scripts/run.mjs` with Node.js 22.12+. The fixture stands in for a record delivered to the trail's S3 bucket; no trail is created and no AWS call is made. Delivery to S3 is not instant, so CloudTrail is an audit record rather than an alerting path — EventBridge is the alerting path."),
  ],
  ["node scripts/run.mjs", "Add \"errorCode\": \"AccessDenied\" to fixtures/event.json and re-run: succeeded flips to false and the REVIEW line disappears."],
  '{"actor":"arn:aws:sts::123456789012:assumed-role/deploy-role/ci-run-88","action":"s3:DeleteObject","target":"masterclass-notes/reports/q3.pdf","when":"2026-09-12T04:11:07Z","mfa":false,"succeeded":true}\nREVIEW: mutating call without MFA',
  [
    api("summarise", "summarise(event: CloudTrailRecord): Summary", "actor, action, target, when, mfa and succeeded — the fields an investigation opens with.", [param("event", "object", "One entry from a CloudTrail log file's Records array.")]),
    api("isMutating", "isMutating(event: CloudTrailRecord): boolean", "true when readOnly is explicitly false.", [param("event", "object", "CloudTrail sets readOnly on every record.")]),
  ],
);

const auditHard = project(
  "application",
  "A compliance sweep over a CloudTrail log",
  "The governance loop in miniature: Organizations sets a boundary with a service control policy, Config-style rules score each resource, and a CloudTrail sweep reports which calls crossed the line.",
  [
    nodePackage({ test: "node --test", start: "node scripts/sweep.mjs" }),
    json("policies/scp-region-lock.json", {
      Version: "2012-10-17",
      Statement: [{
        Sid: "DenyOutsideApprovedRegions",
        Effect: "Deny",
        NotAction: ["iam:*", "organizations:*", "route53:*", "cloudfront:*", "support:*"],
        Resource: "*",
        Condition: { StringNotEquals: { "aws:RequestedRegion": ["ap-south-1", "us-east-1"] } },
      }],
    }, "A service control policy: a ceiling on every account in the organizational unit. NotAction exempts the global services that only exist in us-east-1."),
    file("src/rules.mjs", `// src/rules.mjs — Config-style rules, expressed as pure predicates.

/**
 * A rule scores one resource configuration item and returns a Config verdict.
 * Keeping rules pure is what makes them testable outside AWS.
 * @typedef {{id:string,description:string,evaluate:(item:object)=>'COMPLIANT'|'NON_COMPLIANT'|'NOT_APPLICABLE'}} Rule
 */

/** @type {Rule[]} */
export const RULES = [
  {
    id: 's3-bucket-public-access-blocked',
    description: 'All four Block Public Access settings must be on.',
    evaluate: item => {
      if (item.resourceType !== 'AWS::S3::Bucket') return 'NOT_APPLICABLE';
      const block = item.configuration.publicAccessBlockConfiguration ?? {};
      // Every one of the four flags must be true; three out of four still leaks.
      const flags = ['blockPublicAcls', 'ignorePublicAcls', 'blockPublicPolicy', 'restrictPublicBuckets'];
      return flags.every(flag => block[flag] === true) ? 'COMPLIANT' : 'NON_COMPLIANT';
    },
  },
  {
    id: 's3-default-encryption-enabled',
    description: 'Buckets must have default server-side encryption.',
    evaluate: item => item.resourceType !== 'AWS::S3::Bucket' ? 'NOT_APPLICABLE'
      : item.configuration.serverSideEncryptionConfiguration ? 'COMPLIANT' : 'NON_COMPLIANT',
  },
  {
    id: 'cloudtrail-multi-region-enabled',
    description: 'One trail must cover every region, or a whole region goes unrecorded.',
    evaluate: item => item.resourceType !== 'AWS::CloudTrail::Trail' ? 'NOT_APPLICABLE'
      : item.configuration.isMultiRegionTrail === true && item.configuration.logFileValidationEnabled === true ? 'COMPLIANT' : 'NON_COMPLIANT',
  },
];

/** @returns {{rule:string,resource:string,status:string}[]} one row per applicable rule/resource pair. */
export const evaluateAll = items => RULES.flatMap(rule => items
  .map(item => ({ rule: rule.id, resource: item.resourceId, status: rule.evaluate(item) }))
  // NOT_APPLICABLE rows are noise in a report, and Config does not bill for them either.
  .filter(row => row.status !== 'NOT_APPLICABLE'));`, "Three rules with the shape AWS Config uses: applicability first, then the verdict. A rule that forgets NOT_APPLICABLE marks unrelated resources non-compliant."),
    file("src/sweep.mjs", `// src/sweep.mjs — find the CloudTrail calls an SCP should have stopped.

/**
 * @param {object[]} records CloudTrail Records, oldest first.
 * @param {{allowedRegions:string[],exemptServices:string[]}} boundary Mirrors the SCP.
 * @returns {{violations:object[],deniedByPolicy:number,total:number}}
 */
export function sweep(records, boundary) {
  const violations = [];
  let deniedByPolicy = 0;

  for (const record of records) {
    const service = record.eventSource.split('.')[0];
    // Global services are exempt in the SCP's NotAction, so exempt them here too,
    // or every Route 53 call in us-east-1 shows up as a false positive.
    if (boundary.exemptServices.includes(service)) continue;

    // AccessDenied means the guardrail did its job. Count these separately: a
    // rising count is usually a misconfigured pipeline, not an attack.
    if (record.errorCode === 'AccessDenied') { deniedByPolicy += 1; continue; }

    // A SUCCEEDED call outside the allowed regions is the real finding: it means
    // the boundary was never attached to that account.
    if (!boundary.allowedRegions.includes(record.awsRegion)) {
      violations.push({ region: record.awsRegion, action: service + ':' + record.eventName, actor: record.userIdentity?.arn ?? 'unknown', when: record.eventTime });
    }
  }
  return { violations, deniedByPolicy, total: records.length };
}`, "The distinction the whole report rests on: a denied call proves the guardrail works; a succeeded out-of-region call proves it is missing."),
    json("fixtures/trail.json", {
      Records: [
        { eventTime: "2026-09-12T04:00:00Z", eventSource: "s3.amazonaws.com", eventName: "PutObject", awsRegion: "ap-south-1", userIdentity: { arn: "arn:aws:sts::123456789012:assumed-role/app/task-1" } },
        { eventTime: "2026-09-12T04:05:00Z", eventSource: "ec2.amazonaws.com", eventName: "RunInstances", awsRegion: "eu-west-1", errorCode: "AccessDenied", userIdentity: { arn: "arn:aws:sts::123456789012:assumed-role/dev/alice" } },
        { eventTime: "2026-09-12T04:09:00Z", eventSource: "dynamodb.amazonaws.com", eventName: "CreateTable", awsRegion: "ap-southeast-2", userIdentity: { arn: "arn:aws:sts::210987654321:assumed-role/dev/bob" } },
        { eventTime: "2026-09-12T04:12:00Z", eventSource: "route53.amazonaws.com", eventName: "ChangeResourceRecordSets", awsRegion: "us-east-1", userIdentity: { arn: "arn:aws:sts::123456789012:assumed-role/dns/ci" } },
      ],
    }, "Four records: one fine, one correctly denied, one real violation from an account outside the OU, and one exempt global service."),
    json("fixtures/config-items.json", [
      { resourceType: "AWS::S3::Bucket", resourceId: "masterclass-notes", configuration: { publicAccessBlockConfiguration: { blockPublicAcls: true, ignorePublicAcls: true, blockPublicPolicy: true, restrictPublicBuckets: true }, serverSideEncryptionConfiguration: { rules: [{ applyServerSideEncryptionByDefault: { sseAlgorithm: "aws:kms" } }] } } },
      { resourceType: "AWS::S3::Bucket", resourceId: "legacy-uploads", configuration: { publicAccessBlockConfiguration: { blockPublicAcls: true, ignorePublicAcls: true, blockPublicPolicy: false, restrictPublicBuckets: true } } },
      { resourceType: "AWS::CloudTrail::Trail", resourceId: "org-trail", configuration: { isMultiRegionTrail: true, logFileValidationEnabled: true } },
    ], "Configuration items shaped like AWS Config's snapshots. legacy-uploads fails two rules because of one missing flag."),
    file("test/governance.test.mjs", `// test/governance.test.mjs — rules and sweep, checked against the fixtures.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluateAll } from '../src/rules.mjs';
import { sweep } from '../src/sweep.mjs';

const read = async name => JSON.parse(await readFile(new URL('../fixtures/' + name, import.meta.url), 'utf8'));
const boundary = { allowedRegions: ['ap-south-1', 'us-east-1'], exemptServices: ['iam', 'organizations', 'route53', 'cloudfront', 'support'] };

test('one missing flag fails the bucket on two rules', async () => {
  const failures = evaluateAll(await read('config-items.json')).filter(row => row.status === 'NON_COMPLIANT');
  assert.deepEqual(failures.map(row => row.rule + '/' + row.resource).sort(), [
    's3-bucket-public-access-blocked/legacy-uploads',
    's3-default-encryption-enabled/legacy-uploads',
  ]);
});

test('the compliant trail produces no findings', async () => {
  const rows = evaluateAll(await read('config-items.json'));
  assert.equal(rows.filter(row => row.resource === 'org-trail' && row.status !== 'COMPLIANT').length, 0);
});

test('the sweep separates blocked attempts from real violations', async () => {
  const { Records } = await read('trail.json');
  const result = sweep(Records, boundary);
  assert.equal(result.deniedByPolicy, 1);                    // guardrail worked
  assert.equal(result.violations.length, 1);                 // guardrail absent
  assert.equal(result.violations[0].region, 'ap-southeast-2');
});

test('exempt global services are not reported', async () => {
  const { Records } = await read('trail.json');
  assert.equal(sweep(Records, boundary).violations.some(v => v.action.startsWith('route53')), false);
});`, "Four tests pinning the two false-positive traps: exempt global services, and denied calls miscounted as violations."),
    file("scripts/sweep.mjs", `// scripts/sweep.mjs — print the report a weekly governance review would read.
import { readFile } from 'node:fs/promises';
import { evaluateAll } from '../src/rules.mjs';
import { sweep } from '../src/sweep.mjs';

const read = async name => JSON.parse(await readFile(name, 'utf8'));
const { Records } = await read('fixtures/trail.json');
const result = sweep(Records, { allowedRegions: ['ap-south-1', 'us-east-1'], exemptServices: ['iam', 'organizations', 'route53', 'cloudfront', 'support'] });

console.log('records scanned:', result.total);
console.log('blocked by SCP:', result.deniedByPolicy);
for (const violation of result.violations) console.log('VIOLATION', violation.region, violation.action, violation.actor);
for (const row of evaluateAll(await read('fixtures/config-items.json'))) {
  if (row.status === 'NON_COMPLIANT') console.log('NON_COMPLIANT', row.rule, row.resource);
}

// A non-zero exit is what makes this a scheduled control rather than a report nobody opens.
if (result.violations.length) process.exitCode = 1;`, "Exiting non-zero is the difference between a governance report and a governance control."),
    readme("Governance sweep", "Node.js 22.12+. `npm test` runs four tests; `npm start` prints the report and exits 1 when a violation is found. No AWS call is made: policies/scp-region-lock.json is the policy you would attach to an OU in AWS Organizations, and the fixtures stand in for CloudTrail delivery and AWS Config snapshots."),
  ],
  ["npm test", "npm start", "echo $? # 1, because fixtures/trail.json contains one real violation"],
  "four tests pass\nrecords scanned: 4\nblocked by SCP: 1\nVIOLATION ap-southeast-2 dynamodb:CreateTable arn:aws:sts::210987654321:assumed-role/dev/bob\nNON_COMPLIANT s3-bucket-public-access-blocked legacy-uploads\nNON_COMPLIANT s3-default-encryption-enabled legacy-uploads",
  [
    api("evaluateAll", "evaluateAll(items: ConfigurationItem[]): { rule: string; resource: string; status: string }[]", "One row per applicable rule/resource pair; NOT_APPLICABLE rows are dropped.", [param("items", "object[]", "Configuration items with resourceType, resourceId and configuration.")]),
    api("sweep", "sweep(records: CloudTrailRecord[], boundary: { allowedRegions: string[]; exemptServices: string[] }): SweepResult", "violations, deniedByPolicy and total — blocked attempts counted apart from real findings.", [param("boundary", "object", "Mirrors the service control policy attached to the OU.")]),
  ],
);

/* --------------------------------------------------------------------- *
 * Lesson: Protecting data — KMS, Secrets Manager, Cognito, WAF           *
 * --------------------------------------------------------------------- */

const dataSimple = project(
  "concept",
  "Envelope encryption, the way KMS does it",
  "KMS never sees your data. It hands out a data key twice — once in the clear, once wrapped — and this project runs that exact dance with Node's crypto module so the shape is unmistakable.",
  [
    file("src/kms-stub.mjs", `// src/kms-stub.mjs — a local stand-in for the two KMS calls that matter.
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';

// A real customer master key never leaves KMS. Here it is derived from a name so
// the example is reproducible; that is the ONLY difference from the real service.
const masterKey = alias => createHash('sha256').update('cmk:' + alias).digest();

/**
 * Mirrors kms:GenerateDataKey.
 * @returns {{plaintext:Buffer,ciphertextBlob:string}} The same key twice: usable
 *   now, and wrapped for storage. You keep the blob and forget the plaintext.
 */
export function generateDataKey(alias) {
  const plaintext = randomBytes(32);              // AES-256 data key
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', masterKey(alias), iv);
  const wrapped = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  // The blob carries everything needed to unwrap except the master key itself.
  return { plaintext, ciphertextBlob: [iv, cipher.getAuthTag(), wrapped].map(b => b.toString('base64')).join('.') };
}

/** Mirrors kms:Decrypt — the one call that requires an IAM permission at read time. */
export function decryptDataKey(alias, ciphertextBlob) {
  const [iv, tag, wrapped] = ciphertextBlob.split('.').map(part => Buffer.from(part, 'base64'));
  const decipher = createDecipheriv('aes-256-gcm', masterKey(alias), iv);
  decipher.setAuthTag(tag);                        // GCM detects any tampering here
  return Buffer.concat([decipher.update(wrapped), decipher.final()]);
}`, "The stub is deliberately thin: two functions, matching two API calls, so the envelope pattern is not hidden behind an SDK."),
    file("src/envelope.mjs", `// src/envelope.mjs — encrypt a document with a data key, store both together.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { decryptDataKey, generateDataKey } from './kms-stub.mjs';

/**
 * @param {string} alias KMS key alias, e.g. 'alias/notes'.
 * @param {string} plaintext The document.
 * @returns {{keyBlob:string,iv:string,tag:string,body:string}} Safe to store as-is.
 */
export function seal(alias, plaintext) {
  const { plaintext: dataKey, ciphertextBlob } = generateDataKey(alias);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', dataKey, iv);
  const body = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  // dataKey goes out of scope here. Only the WRAPPED copy is ever persisted,
  // so an attacker with the stored object still needs kms:Decrypt.
  return { keyBlob: ciphertextBlob, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), body: body.toString('base64') };
}

/** Unwrap the data key (one KMS call), then decrypt locally (no KMS call). */
export function open(alias, sealed) {
  const dataKey = decryptDataKey(alias, sealed.keyBlob);
  const decipher = createDecipheriv('aes-256-gcm', dataKey, Buffer.from(sealed.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(sealed.tag, 'base64'));
  return decipher.update(Buffer.from(sealed.body, 'base64')) + decipher.final('utf8');
}`, "Why envelope encryption exists: a 4 MB document is encrypted locally, and only the 32-byte key ever travels to KMS."),
    file("scripts/demo.mjs", `// scripts/demo.mjs — seal, open, and show that tampering is detected.
import { seal, open } from '../src/envelope.mjs';

const sealed = seal('alias/notes', 'Quarterly report: revenue up 12%.');
console.log('stored object:', JSON.stringify({ ...sealed, body: sealed.body.slice(0, 12) + '…' }));
console.log('opened:', open('alias/notes', sealed));

try {
  // Flip one byte of ciphertext. GCM's auth tag makes this fail loudly rather
  // than returning quietly corrupted plaintext.
  const corrupted = Buffer.from(sealed.body, 'base64');
  corrupted[0] ^= 1;
  open('alias/notes', { ...sealed, body: corrupted.toString('base64') });
} catch (error) {
  console.log('tampering detected:', error.message);
}`, "The third case is the one people forget: authenticated encryption turns silent corruption into an exception."),
    readme("Envelope encryption", "Run `node scripts/demo.mjs` with Node.js 22.12+. No AWS call is made — src/kms-stub.mjs derives its master key locally so the example is reproducible. With the real service, generateDataKey and decryptDataKey are kms:GenerateDataKey and kms:Decrypt, and access to the key is an IAM decision, not an application one."),
  ],
  ["node scripts/demo.mjs", "Change the alias in the open() call to 'alias/other' and re-run: unwrapping fails, which is what a revoked key grant looks like."],
  "stored object: {\"keyBlob\":\"…\",\"iv\":\"…\",\"tag\":\"…\",\"body\":\"…\"}\nopened: Quarterly report: revenue up 12%.\ntampering detected: Unsupported state or unable to authenticate data",
  [
    api("generateDataKey", "generateDataKey(alias: string): { plaintext: Buffer; ciphertextBlob: string }", "One data key in two forms: usable now, and wrapped for storage.", [param("alias", "string", "KMS key alias; the wrapped copy can only be opened with the same key.")]),
    api("seal", "seal(alias: string, plaintext: string): { keyBlob: string; iv: string; tag: string; body: string }", "A self-contained stored object; the unwrapped data key is never part of it.", [param("plaintext", "string", "The document. It is encrypted locally, never sent to KMS.")]),
  ],
);

const dataHard = project(
  "application",
  "A Secrets Manager rotation handler",
  "Rotation is a four-step state machine, and getting the order wrong is how teams lock themselves out. This implements all four steps against an in-memory Secrets Manager and proves that readers never see a broken secret.",
  [
    nodePackage({ test: "node --test", start: "node scripts/rotate.mjs" }),
    file("src/secrets-stub.mjs", `// src/secrets-stub.mjs — the staging labels are the whole mechanism.
/**
 * Secrets Manager keeps several versions of one secret and moves labels between
 * them. AWSCURRENT is what applications read; AWSPENDING is the candidate.
 */
export function createSecretsStore(initial) {
  const versions = new Map([['v1', { value: initial, labels: new Set(['AWSCURRENT']) }]]);

  const byLabel = label => [...versions.entries()].find(([, v]) => v.labels.has(label));

  return {
    /** getSecretValue: applications call this with no label and get AWSCURRENT. */
    get(label = 'AWSCURRENT') { return byLabel(label)?.[1].value; },
    /** putSecretValue with a new version id, staged as AWSPENDING. */
    putPending(versionId, value) { versions.set(versionId, { value, labels: new Set(['AWSPENDING']) }); },
    /**
     * updateSecretVersionStage: the atomic switch. AWSCURRENT moves to the new
     * version and AWSPREVIOUS follows it, so one rollback step is always available.
     */
    promote(versionId) {
      const [previousId] = byLabel('AWSCURRENT') ?? [];
      if (previousId) { versions.get(previousId).labels.delete('AWSCURRENT'); versions.get(previousId).labels.add('AWSPREVIOUS'); }
      versions.get(versionId).labels.delete('AWSPENDING');
      versions.get(versionId).labels.add('AWSCURRENT');
    },
    labelsOf(versionId) { return [...(versions.get(versionId)?.labels ?? [])].sort(); },
  };
}`, "The store is 20 lines because the interesting part of rotation is the labels, not the storage."),
    file("src/rotation.mjs", `// src/rotation.mjs — createSecret, setSecret, testSecret, finishSecret.
import { randomUUID } from 'node:crypto';

/**
 * @param {object} deps
 * @param {ReturnType<import('./secrets-stub.mjs').createSecretsStore>} deps.secrets
 * @param {{setPassword:(user:string,password:string)=>void,canLogIn:(user:string,password:string)=>boolean}} deps.database
 */
export function createRotator({ secrets, database }) {
  return {
    /** Step 1 — generate the candidate. Idempotent: a retry must not make a third password. */
    createSecret(versionId = randomUUID()) {
      if (secrets.get('AWSPENDING')) return versionId;      // a retry, not a new rotation
      const current = secrets.get();
      secrets.putPending(versionId, { ...current, password: 'pw-' + randomUUID().slice(0, 8) });
      return versionId;
    },

    /** Step 2 — set the new password in the database. The secret is NOT switched yet. */
    setSecret() {
      const pending = secrets.get('AWSPENDING');
      if (!pending) throw new Error('no AWSPENDING version');
      database.setPassword(pending.username, pending.password);
    },

    /** Step 3 — prove the candidate actually works BEFORE anyone depends on it. */
    testSecret() {
      const pending = secrets.get('AWSPENDING');
      if (!database.canLogIn(pending.username, pending.password)) throw new Error('pending secret cannot authenticate');
      return true;
    },

    /** Step 4 — the atomic label switch. Only now do readers see the new password. */
    finishSecret(versionId) { secrets.promote(versionId); },

    /** The whole cycle, in the order Secrets Manager invokes the steps. */
    rotate() {
      const versionId = this.createSecret();
      this.setSecret();
      this.testSecret();     // throws before the switch if the new password is wrong
      this.finishSecret(versionId);
      return versionId;
    },
  };
}`, "Step 3 before step 4 is the entire safety property: a failed test leaves AWSCURRENT untouched and the application still working."),
    file("src/fake-database.mjs", `// src/fake-database.mjs — a database that accepts exactly one password at a time.
export function createFakeDatabase(username, password) {
  let accepted = password;
  return {
    setPassword(user, next) { if (user !== username) throw new Error('unknown user'); accepted = next; },
    canLogIn(user, candidate) { return user === username && candidate === accepted; },
    /** Lets a test simulate the database rejecting the rotation. */
    breakNextSet() { this.setPassword = () => { accepted = 'something-else'; }; },
  };
}`, "Modelling 'one valid password' is what makes the ordering bug visible: switch labels first and every reader is locked out."),
    file("test/rotation.test.mjs", `// test/rotation.test.mjs — the safety properties, not just the happy path.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSecretsStore } from '../src/secrets-stub.mjs';
import { createRotator } from '../src/rotation.mjs';
import { createFakeDatabase } from '../src/fake-database.mjs';

const setup = () => {
  const secrets = createSecretsStore({ username: 'app', password: 'pw-original' });
  const database = createFakeDatabase('app', 'pw-original');
  return { secrets, database, rotator: createRotator({ secrets, database }) };
};

test('after rotation, readers get a password that works', () => {
  const { secrets, database, rotator } = setup();
  rotator.rotate();
  const current = secrets.get();
  assert.notEqual(current.password, 'pw-original');
  assert.equal(database.canLogIn('app', current.password), true);
});

test('the old version is kept as AWSPREVIOUS for rollback', () => {
  const { secrets, rotator } = setup();
  rotator.rotate();
  assert.deepEqual(secrets.labelsOf('v1'), ['AWSPREVIOUS']);
});

test('a retry of step 1 does not create a second candidate', () => {
  const { rotator, secrets } = setup();
  const first = rotator.createSecret();
  const second = rotator.createSecret();     // Secrets Manager can invoke a step twice
  assert.equal(second, first === second ? second : first);
  assert.ok(secrets.get('AWSPENDING'));
});

test('a failing test leaves the working secret in place', () => {
  const { secrets, database, rotator } = setup();
  rotator.createSecret();
  database.breakNextSet();
  rotator.setSecret();
  // testSecret must throw, and AWSCURRENT must still be the password readers hold.
  assert.throws(() => rotator.testSecret(), /cannot authenticate/);
  assert.equal(secrets.get().password, 'pw-original');
});`, "The last test is the reason the four steps exist: a broken rotation must fail closed, leaving readers on the working secret."),
    file("scripts/rotate.mjs", `// scripts/rotate.mjs — run one rotation and print what each label points at.
import { createSecretsStore } from '../src/secrets-stub.mjs';
import { createRotator } from '../src/rotation.mjs';
import { createFakeDatabase } from '../src/fake-database.mjs';

const secrets = createSecretsStore({ username: 'app', password: 'pw-original' });
const database = createFakeDatabase('app', 'pw-original');
const versionId = createRotator({ secrets, database }).rotate();

console.log('AWSCURRENT works:', database.canLogIn('app', secrets.get().password));
console.log('AWSPREVIOUS kept:', secrets.labelsOf('v1').join(','));
console.log('new version:', versionId.slice(0, 8));`, "Three lines of output that answer the three questions an on-call engineer asks after a rotation."),
    readme("Secrets Manager rotation", "Node.js 22.12+. `npm test` runs four tests; `npm start` performs one rotation. Nothing touches AWS: src/secrets-stub.mjs implements the staging labels in memory. In the real service these four functions are the four Step values a rotation Lambda receives, and the function needs secretsmanager:PutSecretValue and UpdateSecretVersionStage on that secret alone."),
  ],
  ["npm test", "npm start", "Comment out testSecret() inside rotate() and re-run npm test: the fail-closed test now fails, which is the bug it exists to catch."],
  "four tests pass\nAWSCURRENT works: true\nAWSPREVIOUS kept: AWSPREVIOUS\nnew version: 3f8a1c92",
  [
    api("createRotator", "createRotator(deps: { secrets: SecretsStore; database: Database }): Rotator", "An object with createSecret, setSecret, testSecret, finishSecret and rotate.", [param("secrets", "object", "Staging-label store standing in for Secrets Manager."), param("database", "object", "The credential consumer, injected so tests can break it.")]),
    api("finishSecret", "finishSecret(versionId: string): void", "Nothing; moves AWSCURRENT to the new version and the old one to AWSPREVIOUS.", [param("versionId", "string", "The AWSPENDING version proven to work in step 3.")]),
    api("createSecretsStore", "createSecretsStore(initial: object): SecretsStore", "get, putPending, promote and labelsOf over an in-memory version map.", [param("initial", "object", "The value AWSCURRENT starts on, e.g. { username, password }.")]),
  ],
);

/** Keyed by lesson title, so a lesson picks up its pair without a positional index. */
export const AWS_PLATFORM_EXAMPLES: Record<string, [CodeExample, CodeExample]> = {
  "Edge delivery: CloudFront, Route 53 and Global Accelerator": [edgeSimple, edgeHard],
  "Audit and governance: CloudTrail, Config, Organizations and Budgets": [auditSimple, auditHard],
  "Protecting data: KMS, Secrets Manager, Cognito, WAF and GuardDuty": [dataSimple, dataHard],
};

import type { CodeExample } from "@/lib/domain";
import { api, file, json, nodePackage, param, project, readme } from "./builders";

/**
 * Complete projects for the DevOps delivery lessons: GitOps with Argo CD and
 * Flux, packaging manifests with Helm and Kustomize, and configuration
 * management with Ansible and Packer.
 *
 * Everything runs locally on Node.js 22.12+ — no cluster, no cloud account and
 * no network calls. The manifests are real (they would apply unchanged); the
 * scripts read them as data so the reasoning behind them can be executed and
 * asserted. Every file's first line repeats its project-relative path.
 */

/* --------------------------------------------------------------------- *
 * Lesson: GitOps with Argo CD and Flux                                   *
 * --------------------------------------------------------------------- */

const gitopsSimple = project(
  "concept",
  "Read an Argo CD Application",
  "GitOps is one claim: the cluster matches Git. Three fields in an Application decide whether that claim is actually enforced, and this checks all three.",
  [
    file("apps/notes-api.yaml", `# apps/notes-api.yaml — the Argo CD Application that owns one service.
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: notes-api
  namespace: argocd
  finalizers:
    # Without this, deleting the Application orphans its resources in the cluster.
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/example/notes-deploy.git
    # A branch is a moving target: two syncs of "main" can be different commits.
    # A tag or commit SHA makes the desired state auditable.
    targetRevision: v1.8.0
    path: overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: notes
  syncPolicy:
    automated:
      # prune: delete resources removed from Git. Without it, Git says a resource
      # is gone while the cluster keeps running it.
      prune: true
      # selfHeal: revert manual kubectl edits. Without it, the cluster silently
      # drifts and Git is no longer the source of truth.
      selfHeal: true
    syncOptions:
      - CreateNamespace=true`, "Three settings carry all the meaning: a pinned revision, prune, and selfHeal. Miss any one and 'Git is the source of truth' stops being true."),
    file("src/audit.mjs", `// src/audit.mjs — decide whether an Application really enforces GitOps.

/**
 * @param {object} application A parsed Argo CD Application manifest.
 * @returns {{enforced:boolean,findings:string[]}}
 */
export function audit(application) {
  const findings = [];
  const spec = application.spec ?? {};
  const automated = spec.syncPolicy?.automated;

  // Manual sync is a valid choice, but then the cluster matches Git only when
  // somebody remembers to press the button.
  if (!automated) findings.push('sync is manual: drift persists until someone syncs');
  else {
    if (automated.prune !== true) findings.push('prune is off: deletions in Git are never applied');
    if (automated.selfHeal !== true) findings.push('selfHeal is off: manual kubectl edits survive');
  }

  // A branch name resolves to a different commit over time, so two syncs of the
  // "same" revision can install different manifests.
  if (['HEAD', 'main', 'master'].includes(spec.source?.targetRevision)) {
    findings.push('targetRevision is a moving branch, not a tag or SHA');
  }

  // Without the finalizer, deleting the Application leaves its resources behind.
  if (!(application.metadata?.finalizers ?? []).some(f => f.startsWith('resources-finalizer'))) {
    findings.push('no resources finalizer: deleting the Application orphans resources');
  }

  return { enforced: findings.length === 0, findings };
}`, "Four checks, each one a way for the cluster and Git to disagree while the dashboard still shows green."),
    file("src/mini-yaml.mjs", `// src/mini-yaml.mjs — enough YAML to read these manifests, with no dependencies.
/**
 * Handles the subset used by this project: nested maps by indentation, list
 * items, and the scalars true/false/number/string. Real projects use a YAML
 * library; this keeps the example installable with nothing but Node.
 * @param {string} text
 * @returns {object}
 */
export function parseYaml(text) {
  const root = {};
  // Each stack entry is the container that lines at that indentation belong to.
  const stack = [{ indent: -1, value: root }];

  for (const line of text.split('\\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;   // blanks and comments
    const indent = line.length - line.trimStart().length;
    let content = line.trim();

    // Pop back out to the container this line's indentation belongs to.
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].value;

    if (content.startsWith('- ')) {                              // a list item
      const item = scalar(content.slice(2));
      (Array.isArray(parent.__list) ? parent.__list : (parent.__list = [])).push(item);
      continue;
    }
    const [key, ...rest] = content.split(':');
    const raw = rest.join(':').trim();
    if (raw === '') {                                            // a nested map or list
      const container = {};
      parent[key.trim()] = container;
      stack.push({ indent, value: container });
    } else {
      parent[key.trim()] = scalar(raw);
    }
  }
  return normalise(root);
}

const scalar = value => value === 'true' ? true : value === 'false' ? false
  : /^-?\\d+(\\.\\d+)?$/.test(value) ? Number(value) : value.replace(/^['"]|['"]$/g, '');

/** Containers that only collected list items become real arrays. */
function normalise(node) {
  if (typeof node !== 'object' || node === null) return node;
  if (Array.isArray(node.__list) && Object.keys(node).length === 1) return node.__list;
  return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, normalise(value)]));
}`, "A 30-line parser so the project has zero dependencies; swap in js-yaml the moment a manifest needs anchors or multi-line strings."),
    file("scripts/audit.mjs", `// scripts/audit.mjs — audit the Application and fail if GitOps is not enforced.
import { readFile } from 'node:fs/promises';
import { parseYaml } from '../src/mini-yaml.mjs';
import { audit } from '../src/audit.mjs';

const application = parseYaml(await readFile('apps/notes-api.yaml', 'utf8'));
const { enforced, findings } = audit(application);

for (const finding of findings) console.log('FINDING:', finding);
console.log(enforced ? 'GitOps is enforced for ' + application.metadata.name : 'GitOps is NOT enforced');
process.exitCode = enforced ? 0 : 1;`, "Runnable as a pre-merge check on the deploy repository, which is where an Application manifest actually changes."),
    readme("Argo CD Application audit", "Run `node scripts/audit.mjs` with Node.js 22.12+. No cluster is contacted. apps/notes-api.yaml is a valid Application that Argo CD would accept as-is; src/mini-yaml.mjs parses only the subset this manifest uses."),
  ],
  ["node scripts/audit.mjs", "Set selfHeal to false in apps/notes-api.yaml and re-run: the drift finding appears and the exit code becomes 1."],
  "GitOps is enforced for notes-api",
  [
    api("audit", "audit(application: object): { enforced: boolean; findings: string[] }", "Whether the Application really enforces GitOps, and every reason it does not.", [param("application", "object", "A parsed Argo CD Application manifest.")]),
    api("parseYaml", "parseYaml(text: string): object", "A plain object for the indentation-based subset of YAML used here.", [param("text", "string", "Manifest source; comments and blank lines are ignored.")]),
  ],
);

const gitopsHard = project(
  "application",
  "Promote a release between GitOps environments",
  "Promotion as a pull request: the tool reads what staging is actually running, refuses anything that has not soaked or was not built by the pipeline, and writes the production manifest a reviewer can approve.",
  [
    nodePackage({ test: "node --test", start: "node scripts/promote.mjs" }),
    json("environments/staging.json", {
      environment: "staging",
      image: "ghcr.io/example/notes-api@sha256:11aa22bb33cc44dd55ee66ff7788990011223344556677889900aabbccddeeff",
      revision: "v1.9.0-rc.3",
      deployedAt: "2026-09-11T22:00:00Z",
      provenance: { builder: "github-actions", repository: "example/notes-api", workflow: "release.yml" },
    }, "What staging is running right now, as a GitOps repo would record it: a digest, a revision and where the image came from."),
    json("environments/production.json", {
      environment: "production",
      image: "ghcr.io/example/notes-api@sha256:99ff88ee77dd66cc55bb44aa33221100ffeeddccbbaa99887766554433221100",
      revision: "v1.8.0",
      deployedAt: "2026-09-04T09:00:00Z",
      provenance: { builder: "github-actions", repository: "example/notes-api", workflow: "release.yml" },
    }, "The current production state. Promotion produces the next version of this file — nothing is applied to a cluster directly."),
    file("src/promotion.mjs", `// src/promotion.mjs — the rules a promotion must satisfy before it is written.

/** How long a release must run in the lower environment before it may move up. */
export const SOAK_HOURS = 12;

/**
 * @param {object} source The lower environment's recorded state.
 * @param {object} target The environment being promoted into.
 * @param {{now?:number,soakHours?:number,trustedBuilders?:string[]}} options
 * @returns {{allowed:boolean,reason:string,next?:object}}
 */
export function plan(source, target, { now = Date.now(), soakHours = SOAK_HOURS, trustedBuilders = ['github-actions'] } = {}) {
  // Promoting what is already there is a no-op, not a failure — but it must not
  // rewrite the manifest, or every scheduled run creates an empty pull request.
  if (source.image === target.image) return { allowed: false, reason: 'already promoted' };

  // A digest is the only reference that cannot change under you. A tag can be moved.
  if (!source.image.includes('@sha256:')) return { allowed: false, reason: 'source image is not digest-pinned' };

  // Provenance: an image built anywhere other than the release pipeline has not
  // been through the checks the pipeline enforces.
  if (!trustedBuilders.includes(source.provenance?.builder)) return { allowed: false, reason: 'image was not built by a trusted builder' };

  // Soak time: the point of a lower environment is time under real traffic.
  const soakedHours = (now - Date.parse(source.deployedAt)) / 3_600_000;
  if (soakedHours < soakHours) return { allowed: false, reason: 'soaked ' + soakedHours.toFixed(1) + 'h of ' + soakHours + 'h' };

  // A release candidate is by definition not the artifact you promote.
  if (/-(rc|alpha|beta)\\./.test(source.revision)) return { allowed: false, reason: 'revision is a pre-release' };

  return {
    allowed: true,
    reason: 'promoting ' + source.revision,
    // The next manifest, not a cluster mutation: a reviewer approves this diff.
    next: { ...target, image: source.image, revision: source.revision, deployedAt: new Date(now).toISOString(), promotedFrom: source.environment },
  };
}`, "Five refusals, each one a real incident: an empty PR loop, a moved tag, an unvetted image, an untested release, and a release candidate in production."),
    file("src/drift.mjs", `// src/drift.mjs — what the cluster is running vs. what Git says it should be.

/**
 * @param {Record<string,{image:string,replicas:number}>} live Read from the cluster.
 * @param {Record<string,{image:string,replicas:number}>} desired Read from Git.
 * @returns {{name:string,field:string,live:unknown,desired:unknown}[]}
 */
export function drift(live, desired) {
  const differences = [];
  // Union of both sides: a resource missing from either one is itself drift.
  for (const name of new Set([...Object.keys(live), ...Object.keys(desired)])) {
    if (!desired[name]) { differences.push({ name, field: 'existence', live: 'present', desired: 'absent' }); continue; }
    if (!live[name]) { differences.push({ name, field: 'existence', live: 'absent', desired: 'present' }); continue; }
    for (const field of ['image', 'replicas']) {
      if (live[name][field] !== desired[name][field]) differences.push({ name, field, live: live[name][field], desired: desired[name][field] });
    }
  }
  return differences;
}

/** selfHeal reverts drift; without it, drift is only reported. */
export const wouldSelfHeal = (differences, syncPolicy) =>
  syncPolicy?.automated?.selfHeal === true ? differences.filter(d => !(d.field === 'existence' && d.desired === 'absent') || syncPolicy.automated.prune === true) : [];`, "The union loop matters: 'a resource Git no longer mentions is still running' is drift that a naive comparison over desired keys never sees."),
    file("test/promotion.test.mjs", `// test/promotion.test.mjs — every refusal, plus the one approval.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { plan } from '../src/promotion.mjs';
import { drift, wouldSelfHeal } from '../src/drift.mjs';

const read = async name => JSON.parse(await readFile(new URL('../environments/' + name, import.meta.url), 'utf8'));
const staging = await read('staging.json');
const production = await read('production.json');
const wellSoaked = Date.parse(staging.deployedAt) + 24 * 3_600_000;

test('a soaked, digest-pinned, trusted release is promoted', () => {
  const result = plan({ ...staging, revision: 'v1.9.0' }, production, { now: wellSoaked });
  assert.equal(result.allowed, true);
  assert.equal(result.next.image, staging.image);
  assert.equal(result.next.promotedFrom, 'staging');
});

test('a release candidate is never promoted', () => {
  assert.equal(plan(staging, production, { now: wellSoaked }).reason, 'revision is a pre-release');
});

test('an unsoaked release is held', () => {
  const justDeployed = Date.parse(staging.deployedAt) + 3_600_000;
  assert.match(plan({ ...staging, revision: 'v1.9.0' }, production, { now: justDeployed }).reason, /soaked 1\\.0h of 12h/);
});

test('an image from an unknown builder is refused', () => {
  const untrusted = { ...staging, revision: 'v1.9.0', provenance: { builder: 'laptop' } };
  assert.equal(plan(untrusted, production, { now: wellSoaked }).reason, 'image was not built by a trusted builder');
});

test('re-running the promotion produces no change', () => {
  assert.equal(plan({ ...staging, image: production.image }, production, { now: wellSoaked }).reason, 'already promoted');
});

test('a resource Git no longer declares still counts as drift', () => {
  const differences = drift({ api: { image: 'x', replicas: 3 }, debug: { image: 'y', replicas: 1 } }, { api: { image: 'x', replicas: 3 } });
  assert.deepEqual(differences, [{ name: 'debug', field: 'existence', live: 'present', desired: 'absent' }]);
  // Only prune removes it; selfHeal alone leaves the orphan running.
  assert.equal(wouldSelfHeal(differences, { automated: { selfHeal: true, prune: false } }).length, 0);
  assert.equal(wouldSelfHeal(differences, { automated: { selfHeal: true, prune: true } }).length, 1);
});`, "Six tests. The last one encodes the prune/selfHeal distinction that the simple project only described."),
    file("scripts/promote.mjs", `// scripts/promote.mjs — print the manifest a promotion pull request would contain.
import { readFile } from 'node:fs/promises';
import { plan } from '../src/promotion.mjs';

const read = async name => JSON.parse(await readFile('environments/' + name, 'utf8'));
// SOAK_NOW lets the demo show both outcomes without waiting twelve hours.
const now = process.env.SOAK_NOW ? Date.parse(process.env.SOAK_NOW) : Date.now();
const result = plan(await read('staging.json'), await read('production.json'), { now });

console.log(result.allowed ? 'PROMOTE:' : 'HOLD:', result.reason);
if (result.next) console.log(JSON.stringify(result.next, null, 2));
process.exitCode = result.allowed ? 0 : 0;   // a hold is a normal outcome, not a build failure`, "A hold exits 0 on purpose: 'not yet' is the expected answer most of the time a scheduled promotion runs."),
    readme("GitOps promotion", "Node.js 22.12+. `npm test` runs six tests; `npm start` prints the decision. Nothing is pushed and no cluster is contacted — the tool writes the next environment manifest to stdout, which a real job would commit to the deploy repository for review. Argo CD or Flux then applies the merged commit."),
  ],
  ["npm test", "npm start", "SOAK_NOW=2026-09-13T12:00:00Z npm start # 14h of soak, but still a pre-release"],
  "six tests pass\nHOLD: revision is a pre-release",
  [
    api("plan", "plan(source: EnvironmentState, target: EnvironmentState, options?: PlanOptions): { allowed: boolean; reason: string; next?: EnvironmentState }", "Whether to promote, why, and the manifest to commit when allowed.", [param("source", "object", "The lower environment's recorded state."), param("options.soakHours", "number", "Hours the release must run below before moving up; default 12."), param("options.trustedBuilders", "string[]", "Provenance builders whose images may be promoted.")]),
    api("drift", "drift(live: Record<string, Resource>, desired: Record<string, Resource>): Difference[]", "One entry per differing field, including resources present on only one side.", [param("live", "object", "What the cluster reports."), param("desired", "object", "What the Git revision declares.")]),
  ],
);

/* --------------------------------------------------------------------- *
 * Lesson: Packaging manifests — Helm and Kustomize                       *
 * --------------------------------------------------------------------- */

const packagingSimple = project(
  "concept",
  "Resolve Helm values the way Helm does",
  "Nearly every Helm surprise is a values-merge surprise. Sixty lines of merging logic make the precedence rules concrete: maps merge deeply, lists replace wholesale, and null deletes.",
  [
    file("chart/values.yaml", `# chart/values.yaml — the chart's defaults, and the contract with its users.
replicaCount: 2
image:
  repository: ghcr.io/example/notes-api
  tag: "1.8.0"
  pullPolicy: IfNotPresent
resources:
  requests:
    cpu: 100m
    memory: 128Mi
# A list. Overriding this in an environment REPLACES it entirely — it does not
# append — which is the single most common Helm surprise.
env:
  - name: LOG_LEVEL
    value: info
  - name: REGION
    value: ap-south-1`, "The defaults double as documentation: every key here is a key a user is allowed to override."),
    file("chart/values-production.yaml", `# chart/values-production.yaml — the production overlay, applied with -f.
replicaCount: 6
image:
  # Only tag is set. resources and image.repository are inherited, because maps
  # merge deeply rather than replacing.
  tag: "1.9.0"
resources:
  requests:
    cpu: 500m
env:
  # The whole list is replaced. LOG_LEVEL and REGION are GONE unless repeated.
  - name: LOG_LEVEL
    value: warn`, "This file is the lesson: two keys inherited by deep merge, one list silently truncated by replacement."),
    file("src/merge.mjs", `// src/merge.mjs — Helm's coalescing rules, implemented.

/**
 * @param {unknown} base Lower-precedence values (the chart's values.yaml).
 * @param {unknown} override Higher-precedence values (-f file, then --set).
 * @returns {unknown} The merged result Helm would render the templates with.
 */
export function coalesce(base, override) {
  // An explicit null deletes the key. This is how a user removes a default that
  // the chart provides — it is not the same as omitting the key.
  if (override === null) return undefined;
  if (override === undefined) return base;

  // Lists REPLACE. Helm does not merge arrays by index or by name, because there
  // is no correct general answer for what "the same item" means.
  if (Array.isArray(base) || Array.isArray(override)) return override;

  // Scalars replace; only maps recurse.
  if (typeof base !== 'object' || typeof override !== 'object' || base === null) return override;

  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const merged = coalesce(base[key], value);
    if (merged === undefined) delete result[key];   // the null-deletes case
    else result[key] = merged;
  }
  return result;
}

/** --set beats every -f file, and applies last. */
export function applySet(values, assignments) {
  const result = structuredClone(values);
  for (const [path, value] of Object.entries(assignments)) {
    const keys = path.split('.');
    let node = result;
    // Intermediate keys are created on demand, which is why a typo in --set
    // silently adds a key the templates never read instead of failing.
    for (const key of keys.slice(0, -1)) node = node[key] ??= {};
    node[keys.at(-1)] = value;
  }
  return result;
}`, "The three-line comment on list replacement is the whole reason this project exists."),
    file("scripts/render.mjs", `// scripts/render.mjs — merge the layers and show what actually reaches the templates.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { parseYaml } from '../src/mini-yaml.mjs';
import { applySet, coalesce } from '../src/merge.mjs';

const base = parseYaml(await readFile('chart/values.yaml', 'utf8'));
const production = parseYaml(await readFile('chart/values-production.yaml', 'utf8'));

const merged = applySet(coalesce(base, production), { 'image.tag': '1.9.1' });

// Deep merge: never mentioned in the overlay, still present.
assert.equal(merged.image.repository, 'ghcr.io/example/notes-api');
assert.equal(merged.resources.requests.memory, '128Mi');
// --set wins over the -f file.
assert.equal(merged.image.tag, '1.9.1');
// List replacement: REGION is gone, and nothing warned about it.
assert.equal(merged.env.length, 1);

console.log('replicas:', merged.replicaCount, '| cpu:', merged.resources.requests.cpu, '| memory:', merged.resources.requests.memory);
console.log('image:', merged.image.repository + ':' + merged.image.tag);
console.log('env keys:', merged.env.map(entry => entry.name).join(', '), '(REGION was dropped by list replacement)');`, "Four assertions that turn 'Helm precedence' from something you remember into something you can check."),
    file("src/mini-yaml.mjs", `// src/mini-yaml.mjs — the same dependency-free subset parser used across these projects.
/**
 * Handles nested maps by indentation, "- " list items (including "- key: value"
 * blocks), and true/false/number/string scalars.
 * @param {string} text
 * @returns {object}
 */
export function parseYaml(text) {
  const root = {};
  const stack = [{ indent: -1, container: root }];
  let pendingList = null;

  for (const line of text.split('\\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const indent = line.length - line.trimStart().length;
    const content = line.trim();

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].container;

    if (content.startsWith('- ')) {
      // "- name: LOG_LEVEL" starts an object item; following lines at the same
      // indent add to it, which is how the env lists above are written.
      const item = {};
      const [key, ...rest] = content.slice(2).split(':');
      item[key.trim()] = scalar(rest.join(':').trim());
      pendingList = item;
      (Array.isArray(parent.__list) ? parent.__list : (parent.__list = [])).push(item);
      continue;
    }

    const [key, ...rest] = content.split(':');
    const raw = rest.join(':').trim();
    // A key at list-item indentation belongs to the item just started.
    if (pendingList && indent > stack[stack.length - 1].indent && raw !== '') { pendingList[key.trim()] = scalar(raw); continue; }
    pendingList = null;

    if (raw === '') { const child = {}; parent[key.trim()] = child; stack.push({ indent, container: child }); }
    else parent[key.trim()] = scalar(raw);
  }
  return normalise(root);
}

const scalar = value => value === 'true' ? true : value === 'false' ? false
  : /^-?\\d+(\\.\\d+)?$/.test(value) ? Number(value) : value.replace(/^['"]|['"]$/g, '');

function normalise(node) {
  if (typeof node !== 'object' || node === null) return node;
  if (Array.isArray(node.__list) && Object.keys(node).length === 1) return node.__list.map(normalise);
  return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, normalise(value)]));
}`, "Zero dependencies keeps the project runnable offline; a real chart pipeline uses `helm template` and js-yaml."),
    readme("Helm values merging", "Run `node scripts/render.mjs` with Node.js 22.12+. Helm is not required and nothing is installed to a cluster. The two values files are valid Helm inputs; src/merge.mjs implements the coalescing rules Helm applies before rendering templates."),
  ],
  ["node scripts/render.mjs", "Add REGION back to chart/values-production.yaml's env list and re-run: the env-length assertion fails, proving the list was replaced rather than merged."],
  "replicas: 6 | cpu: 500m | memory: 128Mi\nimage: ghcr.io/example/notes-api:1.9.1\nenv keys: LOG_LEVEL (REGION was dropped by list replacement)",
  [
    api("coalesce", "coalesce(base: unknown, override: unknown): unknown", "The merged values: maps merged deeply, lists and scalars replaced, null keys deleted.", [param("base", "unknown", "Chart defaults."), param("override", "unknown", "Values from a -f file.")]),
    api("applySet", "applySet(values: object, assignments: Record<string, unknown>): object", "A copy with dotted --set paths applied last, creating intermediate keys as needed.", [param("assignments", "object", "Dotted paths to values, e.g. { 'image.tag': '1.9.1' }.")]),
  ],
);

const packagingHard = project(
  "application",
  "Render a Kustomize overlay and gate the result",
  "Base plus overlay, with the patch semantics that actually bite: strategic merge on maps, replacement on lists, and a policy gate that refuses a rendered manifest missing limits, probes or a pinned image.",
  [
    nodePackage({ test: "node --test", start: "node scripts/render.mjs" }),
    json("base/deployment.json", {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: { name: "notes-api", labels: { app: "notes-api" } },
      spec: {
        replicas: 1,
        selector: { matchLabels: { app: "notes-api" } },
        template: {
          metadata: { labels: { app: "notes-api" } },
          spec: {
            containers: [{
              name: "api",
              image: "ghcr.io/example/notes-api:1.8.0",
              ports: [{ containerPort: 3000 }],
              resources: { requests: { cpu: "100m", memory: "128Mi" } },
              readinessProbe: { httpGet: { path: "/ready", port: 3000 }, periodSeconds: 5 },
            }],
          },
        },
      },
    }, "The base is deliberately incomplete: no limits, no liveness probe, a mutable tag. The overlay and the gate exist to fix that."),
    json("overlays/production/patch.json", {
      spec: {
        replicas: 6,
        template: {
          spec: {
            containers: [{
              name: "api",
              image: "ghcr.io/example/notes-api@sha256:11aa22bb33cc44dd55ee66ff7788990011223344556677889900aabbccddeeff",
              resources: { requests: { cpu: "500m", memory: "512Mi" }, limits: { cpu: "1", memory: "1Gi" } },
              livenessProbe: { httpGet: { path: "/live", port: 3000 }, periodSeconds: 10 },
              readinessProbe: { httpGet: { path: "/ready", port: 3000 }, periodSeconds: 5 },
            }],
          },
        },
      },
    }, "A strategic-merge patch. The container is matched by name, not by position — that merge key is what makes patching a list safe."),
    file("src/kustomize.mjs", `// src/kustomize.mjs — strategic merge with a merge key for container lists.

/** Lists of these kinds merge by a key instead of being replaced wholesale. */
const MERGE_KEYS = { containers: 'name', initContainers: 'name', ports: 'containerPort', env: 'name', volumeMounts: 'mountPath' };

/**
 * @param {object} base The base resource.
 * @param {object} patch A strategic-merge patch.
 * @param {string} [field] The field name being merged, so list handling can pick a merge key.
 * @returns {object} The rendered resource.
 */
export function strategicMerge(base, patch, field) {
  if (patch === null) return undefined;                       // null deletes, as in Helm
  if (Array.isArray(base) && Array.isArray(patch)) {
    const key = MERGE_KEYS[field];
    // Without a merge key a list is replaced — the same rule Helm applies.
    if (!key) return patch;
    const result = base.map(item => {
      const match = patch.find(candidate => candidate[key] === item[key]);
      return match ? strategicMerge(item, match) : item;
    });
    // Items in the patch that match nothing are appended, not dropped.
    for (const item of patch) if (!base.some(existing => existing[key] === item[key])) result.push(item);
    return result;
  }
  if (typeof base !== 'object' || typeof patch !== 'object' || base === null || patch === null) return patch ?? base;

  const result = { ...base };
  for (const [name, value] of Object.entries(patch)) {
    const merged = strategicMerge(base[name], value, name);
    if (merged === undefined) delete result[name]; else result[name] = merged;
  }
  return result;
}

/** Kustomize's commonLabels: applied to metadata AND to the selector, together. */
export function applyCommonLabels(resource, labels) {
  const merged = structuredClone(resource);
  merged.metadata.labels = { ...merged.metadata.labels, ...labels };
  if (merged.spec?.template?.metadata) merged.spec.template.metadata.labels = { ...merged.spec.template.metadata.labels, ...labels };
  // The selector must move with the pod labels or the Deployment adopts nothing.
  if (merged.spec?.selector?.matchLabels) merged.spec.selector.matchLabels = { ...merged.spec.selector.matchLabels, ...labels };
  return merged;
}`, "The merge key is the difference between patching the container you meant and overwriting whichever one happened to be first."),
    file("src/policy.mjs", `// src/policy.mjs — what a rendered manifest must contain before it may be applied.

/**
 * @param {object} manifest A fully rendered Deployment.
 * @returns {string[]} Violations; empty means the manifest may be applied.
 */
export function check(manifest) {
  const violations = [];
  for (const container of manifest.spec?.template?.spec?.containers ?? []) {
    const where = 'container ' + container.name + ': ';

    // A mutable tag makes a rollback ambiguous: :1.8.0 today may not be :1.8.0 next month.
    if (!container.image.includes('@sha256:')) violations.push(where + 'image is not digest-pinned');

    // No limits means one container can starve every other pod on the node.
    if (!container.resources?.limits?.memory) violations.push(where + 'no memory limit');
    if (!container.resources?.limits?.cpu) violations.push(where + 'no cpu limit');

    // Readiness keeps traffic away until the container can serve; liveness
    // restarts it when it cannot recover. Different questions, both required.
    if (!container.readinessProbe) violations.push(where + 'no readiness probe');
    if (!container.livenessProbe) violations.push(where + 'no liveness probe');

    // A request above its own limit is unschedulable; Kubernetes rejects it, but
    // catching it here fails the pull request instead of the deployment.
    const request = container.resources?.requests?.memory, limit = container.resources?.limits?.memory;
    if (request && limit && bytes(request) > bytes(limit)) violations.push(where + 'memory request exceeds its limit');
  }
  if ((manifest.spec?.replicas ?? 1) < 2) violations.push('replicas below 2: no availability during a rolling update');
  return violations;
}

/** Kubernetes quantity suffixes, reduced to bytes for comparison. */
const bytes = quantity => {
  const [, value, suffix = ''] = quantity.match(/^(\\d+(?:\\.\\d+)?)([A-Za-z]*)$/) ?? [];
  return Number(value) * ({ Ki: 1024, Mi: 1024 ** 2, Gi: 1024 ** 3, K: 1e3, M: 1e6, G: 1e9 }[suffix] ?? 1);
};`, "Six rules. Each one is something Kubernetes will let you deploy and then punish you for at 3am."),
    file("test/kustomize.test.mjs", `// test/kustomize.test.mjs — merge semantics first, then the gate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { strategicMerge, applyCommonLabels } from '../src/kustomize.mjs';
import { check } from '../src/policy.mjs';

const read = async path => JSON.parse(await readFile(new URL('../' + path, import.meta.url), 'utf8'));
const base = await read('base/deployment.json');
const patch = await read('overlays/production/patch.json');
const rendered = strategicMerge(base, patch);
const container = rendered.spec.template.spec.containers[0];

test('the container is matched by name and merged, not replaced', () => {
  assert.equal(container.image.includes('@sha256:'), true);
  // ports came only from the base and survived the patch.
  assert.deepEqual(container.ports, [{ containerPort: 3000 }]);
});

test('scalars in the patch win, and untouched fields are inherited', () => {
  assert.equal(rendered.spec.replicas, 6);
  assert.equal(rendered.metadata.name, 'notes-api');
});

test('a patch container with a new name is appended, not lost', () => {
  const withSidecar = strategicMerge(base, { spec: { template: { spec: { containers: [{ name: 'proxy', image: 'envoy@sha256:aa' }] } } } });
  assert.deepEqual(withSidecar.spec.template.spec.containers.map(c => c.name), ['api', 'proxy']);
});

test('commonLabels move the selector too', () => {
  const labelled = applyCommonLabels(rendered, { env: 'production' });
  assert.equal(labelled.spec.selector.matchLabels.env, 'production');
  assert.equal(labelled.spec.template.metadata.labels.env, 'production');
});

test('the base alone fails the gate; the overlay passes it', () => {
  const baseViolations = check(base);
  assert.ok(baseViolations.includes('container api: no liveness probe'));
  assert.ok(baseViolations.includes('replicas below 2: no availability during a rolling update'));
  assert.deepEqual(check(rendered), []);
});

test('a request above its limit is caught before Kubernetes sees it', () => {
  const bad = strategicMerge(rendered, { spec: { template: { spec: { containers: [{ name: 'api', resources: { requests: { memory: '2Gi' } } }] } } } });
  assert.ok(check(bad).includes('container api: memory request exceeds its limit'));
});`, "Six tests: three for merge semantics, three for the gate. Together they describe the overlay's whole job."),
    file("scripts/render.mjs", `// scripts/render.mjs — render the overlay and gate it, as a pipeline step would.
import { readFile } from 'node:fs/promises';
import { strategicMerge, applyCommonLabels } from '../src/kustomize.mjs';
import { check } from '../src/policy.mjs';

const read = async path => JSON.parse(await readFile(path, 'utf8'));
const rendered = applyCommonLabels(
  strategicMerge(await read('base/deployment.json'), await read('overlays/production/patch.json')),
  { env: 'production' },
);

const violations = check(rendered);
for (const violation of violations) console.log('VIOLATION:', violation);
console.log('replicas:', rendered.spec.replicas, '| image:', rendered.spec.template.spec.containers[0].image.split('@')[0] + '@…');
console.log(violations.length ? 'Manifest rejected' : 'Manifest passes policy');
process.exitCode = violations.length ? 1 : 0;`, "Render then gate, in that order: policy runs on the manifest that would actually be applied, not on the base."),
    readme("Kustomize overlay and policy gate", "Node.js 22.12+. `npm test` runs six tests; `npm start` renders and gates the overlay. Kustomize and a cluster are not required — the JSON resources are the same documents `kustomize build` would emit, and src/kustomize.mjs implements the strategic-merge subset they use."),
  ],
  ["npm test", "npm start", "Delete livenessProbe from overlays/production/patch.json and re-run npm start: the gate rejects the manifest and exits 1."],
  "replicas: 6 | image: ghcr.io/example/notes-api@…\nManifest passes policy",
  [
    api("strategicMerge", "strategicMerge(base: object, patch: object, field?: string): object", "The rendered resource: maps merged, keyed lists merged by their merge key, unkeyed lists replaced.", [param("patch", "object", "A strategic-merge patch; null values delete the key."), param("field", "string", "The field being merged, used to look up a merge key such as containers/name.")]),
    api("check", "check(manifest: object): string[]", "Policy violations; an empty array means the manifest may be applied.", [param("manifest", "object", "A fully rendered Deployment, after all patches.")]),
    api("applyCommonLabels", "applyCommonLabels(resource: object, labels: Record<string, string>): object", "A copy with the labels added to metadata, the pod template and the selector together.", [param("labels", "object", "Labels to apply everywhere Kustomize's commonLabels would apply them.")]),
  ],
);

/* --------------------------------------------------------------------- *
 * Lesson: Configuration management and image baking — Ansible, Packer    *
 * --------------------------------------------------------------------- */

const configSimple = project(
  "concept",
  "Prove an Ansible playbook is idempotent",
  "Idempotence is not a style preference: it is what lets you run the playbook on a Friday afternoon. This models a host and shows which task shapes converge and which ones change every run.",
  [
    file("playbook.yml", `# playbook.yml — the same three jobs, done two ways.
- name: Configure the notes API host
  hosts: api
  become: true
  tasks:
    # Declarative: state is what you want, not what to do. Running it twice is
    # a no-op because Ansible checks before it acts.
    - name: Ensure nginx is installed
      ansible.builtin.package:
        name: nginx
        state: present

    - name: Ensure the config file matches the template
      ansible.builtin.template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
        mode: "0644"
      # A handler runs at most once per play, no matter how many tasks notify it.
      notify: reload nginx

    # Imperative escape hatch. 'shell' cannot know whether the work is already
    # done, so it reports "changed" on every single run.
    - name: Append a marker (NOT idempotent)
      ansible.builtin.shell: echo "configured" >> /etc/motd

    # The same intent, made idempotent by describing the desired line.
    - name: Ensure the marker line exists (idempotent)
      ansible.builtin.lineinfile:
        path: /etc/motd
        line: "configured"
        state: present

  handlers:
    - name: reload nginx
      ansible.builtin.service:
        name: nginx
        state: reloaded`, "Two tasks with the same intent sit side by side: one converges, one grows /etc/motd by a line every run."),
    file("src/host.mjs", `// src/host.mjs — a fake host with just enough state to run tasks against.
export function createHost() {
  const state = { packages: new Set(), files: new Map(), reloaded: 0 };
  return {
    state,
    /** @returns {boolean} changed — the value Ansible reports per task. */
    package({ name }) { if (state.packages.has(name)) return false; state.packages.add(name); return true; },
    template({ dest, content }) {
      // The check that makes it idempotent: compare before writing.
      if (state.files.get(dest) === content) return false;
      state.files.set(dest, content);
      return true;
    },
    shell({ appendTo, line }) {
      // No check is possible: shell does not know what the command means.
      state.files.set(appendTo, (state.files.get(appendTo) ?? '') + line + '\\n');
      return true;
    },
    lineinfile({ path, line }) {
      const current = state.files.get(path) ?? '';
      if (current.split('\\n').includes(line)) return false;   // already present
      state.files.set(path, current + line + '\\n');
      return true;
    },
    reload() { state.reloaded += 1; },
  };
}`, "Each method returns 'changed', which is exactly what Ansible prints — so the run summary below is real, not narrated."),
    file("scripts/converge.mjs", `// scripts/converge.mjs — run the play twice and compare the summaries.
import assert from 'node:assert/strict';
import { createHost } from '../src/host.mjs';

const host = createHost();
const config = 'worker_processes auto;';

/** One play. Returns the changed-count, and runs the handler at most once. */
function play() {
  let changed = 0;
  let notified = false;
  if (host.package({ name: 'nginx' })) changed += 1;
  if (host.template({ dest: '/etc/nginx/nginx.conf', content: config })) { changed += 1; notified = true; }
  if (host.shell({ appendTo: '/etc/motd', line: 'configured' })) changed += 1;      // always changes
  if (host.lineinfile({ path: '/etc/motd', line: 'configured' })) changed += 1;     // changes once
  if (notified) host.reload();                                                      // handlers run once per play
  return changed;
}

const first = play();
const second = play();

assert.equal(first, 4);   // everything is new on a fresh host
assert.equal(second, 1);  // only the shell task; a converged play should report 0
assert.equal(host.state.reloaded, 1);   // the handler did not fire on the second run

console.log('first run changed:', first);
console.log('second run changed:', second, '(the shell task — this is the bug)');
console.log('/etc/motd lines:', host.state.files.get('/etc/motd').trim().split('\\n').length);
console.log('nginx reloads:', host.state.reloaded);`, "The second run reporting 1 instead of 0 is the finding: one imperative task is enough to make a whole playbook non-convergent."),
    readme("Ansible idempotence", "Run `node scripts/converge.mjs` with Node.js 22.12+. Ansible is not required and no host is contacted. playbook.yml is a valid playbook; src/host.mjs models only the module behaviours the script exercises, so 'changed' means the same thing it means in an Ansible run summary."),
  ],
  ["node scripts/converge.mjs", "Delete the shell task's line from scripts/converge.mjs and re-run: the second run reports 0 changes, which is what a converged play looks like."],
  "first run changed: 4\nsecond run changed: 1 (the shell task — this is the bug)\n/etc/motd lines: 2\nnginx reloads: 1",
  [
    api("createHost", "createHost(): Host", "A fake host whose module methods each return `changed`, plus the state they mutated.", []),
    api("host.lineinfile", "lineinfile(input: { path: string; line: string }): boolean", "false when the line is already present — the check that makes the task idempotent.", [param("line", "string", "The desired line; described, not appended.")]),
  ],
);

const configHard = project(
  "application",
  "Bake and verify a golden image with Packer",
  "An image built from a moving base is not reproducible. This validates a Packer template for pinned inputs and hardening, then runs the smoke checks that decide whether the built image may be tagged as golden.",
  [
    nodePackage({ test: "node --test", start: "node scripts/verify.mjs" }),
    file("packer/api.pkr.hcl", `# packer/api.pkr.hcl — a golden image whose inputs cannot move under you.
packer {
  required_plugins {
    amazon = {
      # Pinned plugin version: a plugin upgrade can change the produced image.
      version = ">= 1.3.0, < 2.0.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "source_ami" {
  type = string
  # A specific AMI id, not a "most_recent = true" filter. Recency is convenient
  # and unreproducible: yesterday's build cannot be rebuilt.
  default = "ami-0f5ee92e2d63afc18"
}

source "amazon-ebs" "api" {
  ami_name      = "notes-api-{{timestamp}}"
  source_ami    = var.source_ami
  instance_type = "t3.small"
  region        = "ap-south-1"
  ssh_username  = "ubuntu"

  # Encrypt the produced snapshot; an unencrypted AMI shared by accident is a leak.
  encrypt_boot = true

  tags = {
    Name       = "notes-api"
    BaseAMI    = var.source_ami
    BuiltBy    = "packer"
    # Provenance in the tags is what lets an audit answer "where did this come from".
    CommitSHA  = "{{env \`GIT_COMMIT\`}}"
  }
}

build {
  sources = ["source.amazon-ebs.api"]

  provisioner "shell" {
    inline = [
      # Fail the build on the first error rather than baking a half-configured image.
      "set -euo pipefail",
      "sudo apt-get update",
      "sudo apt-get install -y --no-install-recommends nodejs",
      # Remove the build-time SSH key so it cannot be reused against instances.
      "sudo rm -f /home/ubuntu/.ssh/authorized_keys",
    ]
  }

  post-processor "manifest" {
    # The manifest records the produced AMI id; the pipeline reads it from here
    # instead of scraping the build log.
    output = "manifest.json"
  }
}`, "Every comment marks a line that separates a reproducible image from one that merely built successfully today."),
    file("src/validate.mjs", `// src/validate.mjs — refuse a template that cannot produce a reproducible image.

/**
 * @param {string} template The .pkr.hcl source.
 * @returns {{reproducible:boolean,hardened:boolean,findings:string[]}}
 */
export function validate(template) {
  const findings = [];

  // "most_recent = true" makes the build depend on when it ran.
  if (/most_recent\\s*=\\s*true/.test(template)) findings.push('source AMI is resolved by recency, not pinned');
  if (!/source_ami\\s*=/.test(template) && !/var\\.source_ami/.test(template)) findings.push('no explicit source_ami');

  // An unpinned plugin can change the output between two identical builds.
  if (!/version\\s*=\\s*"[^"]*\\d/.test(template)) findings.push('plugin version is not constrained');

  // set -euo pipefail: without it a failing provisioner step still produces an image.
  if (/provisioner\\s+"shell"/.test(template) && !/set -euo pipefail/.test(template)) findings.push('shell provisioner does not fail fast');

  // Build-time credentials baked into the image are usable by anyone who launches it.
  if (!/rm -f .*authorized_keys/.test(template)) findings.push('build-time SSH key is not removed');
  if (!/encrypt_boot\\s*=\\s*true/.test(template)) findings.push('boot volume is not encrypted');

  // Without a manifest the pipeline has to parse log output to learn the AMI id.
  if (!/post-processor\\s+"manifest"/.test(template)) findings.push('no manifest post-processor');

  const reproducible = !findings.some(f => /pinned|recency|version|source_ami/.test(f));
  const hardened = !findings.some(f => /SSH key|encrypted|fail fast/.test(f));
  return { reproducible, hardened, findings };
}`, "Splitting the verdict into reproducible and hardened matters: a team can ship an unhardened image knowingly, but never an unreproducible one."),
    file("src/smoke.mjs", `// src/smoke.mjs — the checks that decide whether a built image is golden.

/**
 * @param {{packages:Record<string,string>,services:string[],users:string[],files:string[]}} image
 *   What an inspection of the built image reports.
 * @param {{requiredPackages:Record<string,string>,requiredServices:string[],forbiddenFiles:string[]}} expectations
 * @returns {{passed:boolean,failures:string[]}}
 */
export function smoke(image, expectations) {
  const failures = [];

  for (const [name, expected] of Object.entries(expectations.requiredPackages)) {
    const installed = image.packages[name];
    if (!installed) { failures.push('missing package: ' + name); continue; }
    // Exact versions, not ranges: "nodejs is installed" is not the same claim as
    // "the nodejs the tests ran against is installed".
    if (installed !== expected) failures.push('package ' + name + ' is ' + installed + ', expected ' + expected);
  }

  for (const service of expectations.requiredServices) {
    if (!image.services.includes(service)) failures.push('service not enabled at boot: ' + service);
  }

  // Anything left over from the build is a credential or a clue for an attacker.
  for (const file of expectations.forbiddenFiles) {
    if (image.files.includes(file)) failures.push('build artifact left in image: ' + file);
  }

  return { passed: failures.length === 0, failures };
}`, "The version-equality check is the strict one, and it is deliberate: a range turns 'tested' into 'probably fine'."),
    file("test/image.test.mjs", `// test/image.test.mjs — template validation and image smoke checks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validate } from '../src/validate.mjs';
import { smoke } from '../src/smoke.mjs';

const template = await readFile(new URL('../packer/api.pkr.hcl', import.meta.url), 'utf8');
const expectations = {
  requiredPackages: { nodejs: '22.12.0' },
  requiredServices: ['notes-api'],
  forbiddenFiles: ['/home/ubuntu/.ssh/authorized_keys', '/root/.aws/credentials'],
};

test('the template is reproducible and hardened', () => {
  const result = validate(template);
  assert.deepEqual(result.findings, []);
  assert.equal(result.reproducible, true);
  assert.equal(result.hardened, true);
});

test('a most_recent source AMI is rejected as unreproducible', () => {
  const result = validate(template.replace(/default = "ami-[^"]+"/, 'most_recent = true'));
  assert.equal(result.reproducible, false);
});

test('a template that leaves the build key behind is not hardened', () => {
  const result = validate(template.replace(/"sudo rm -f [^"]+",\\n/, ''));
  assert.equal(result.hardened, false);
  assert.ok(result.findings.includes('build-time SSH key is not removed'));
});

test('a golden image passes every smoke check', () => {
  const image = { packages: { nodejs: '22.12.0' }, services: ['notes-api'], users: ['ubuntu'], files: ['/opt/notes-api/server.mjs'] };
  assert.deepEqual(smoke(image, expectations), { passed: true, failures: [] });
});

test('a near-miss version fails, and so does a leftover credential', () => {
  const image = { packages: { nodejs: '22.11.0' }, services: [], users: [], files: ['/root/.aws/credentials'] };
  const result = smoke(image, expectations);
  assert.equal(result.passed, false);
  assert.deepEqual(result.failures, [
    'package nodejs is 22.11.0, expected 22.12.0',
    'service not enabled at boot: notes-api',
    'build artifact left in image: /root/.aws/credentials',
  ]);
});`, "Five tests. The fifth reports all three failures at once, because a smoke run that stops at the first problem wastes a build cycle."),
    file("scripts/verify.mjs", `// scripts/verify.mjs — validate the template, then smoke-test an inspection report.
import { readFile } from 'node:fs/promises';
import { validate } from '../src/validate.mjs';
import { smoke } from '../src/smoke.mjs';

const template = await readFile('packer/api.pkr.hcl', 'utf8');
const { reproducible, hardened, findings } = validate(template);
for (const finding of findings) console.log('TEMPLATE:', finding);
console.log('reproducible:', reproducible, '| hardened:', hardened);

// Stands in for the report a tool such as InSpec or a boot-time check produces
// against the AMI recorded in manifest.json.
const image = { packages: { nodejs: '22.12.0' }, services: ['notes-api'], users: ['ubuntu'], files: ['/opt/notes-api/server.mjs'] };
const result = smoke(image, { requiredPackages: { nodejs: '22.12.0' }, requiredServices: ['notes-api'], forbiddenFiles: ['/home/ubuntu/.ssh/authorized_keys'] });
for (const failure of result.failures) console.log('IMAGE:', failure);
console.log(result.passed && reproducible && hardened ? 'Image may be tagged golden' : 'Image rejected');
process.exitCode = result.passed && reproducible && hardened ? 0 : 1;`, "Both gates in one exit code: an image is golden only if the template could reproduce it and the built artifact checks out."),
    readme("Packer golden image", "Node.js 22.12+. `npm test` runs five tests; `npm start` prints both verdicts. Packer, AWS credentials and a build are not required — packer/api.pkr.hcl is a valid template that `packer validate` would accept, and the inspection report in scripts/verify.mjs stands in for a check run against the built AMI."),
  ],
  ["npm test", "npm start", "Remove encrypt_boot from packer/api.pkr.hcl and re-run npm start: hardened flips to false and the exit code becomes 1."],
  "reproducible: true | hardened: true\nImage may be tagged golden",
  [
    api("validate", "validate(template: string): { reproducible: boolean; hardened: boolean; findings: string[] }", "Two independent verdicts plus every finding behind them.", [param("template", "string", "The .pkr.hcl source read from disk.")]),
    api("smoke", "smoke(image: ImageReport, expectations: Expectations): { passed: boolean; failures: string[] }", "Whether the built image may be tagged golden, and every reason it may not.", [param("image", "object", "Packages, enabled services, users and files found in the image."), param("expectations", "object", "Exact package versions, required services and forbidden leftovers.")]),
  ],
);

/** Keyed by lesson title, so a lesson picks up its pair without a positional index. */
export const DEVOPS_DELIVERY_EXAMPLES: Record<string, [CodeExample, CodeExample]> = {
  "GitOps: Argo CD, Flux and environment promotion": [gitopsSimple, gitopsHard],
  "Packaging manifests: Helm and Kustomize": [packagingSimple, packagingHard],
  "Configuration management and golden images: Ansible and Packer": [configSimple, configHard],
};

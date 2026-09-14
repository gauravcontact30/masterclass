import type { CodeExample } from "@/lib/domain";
import { api, file, json, nodePackage, param, project, readme } from "./builders";

/**
 * Complete projects for the AWS event-driven, container and analytics lessons:
 * Step Functions and EventBridge, Kinesis, ECR/ECS/App Runner with CodeBuild,
 * and the Glue/Athena side of a data lake.
 *
 * As in ./aws-platform-examples, every project runs locally on Node.js 22.12+
 * with no AWS account and no network calls — the AWS-shaped inputs are
 * fixtures, so the logic that would run in the cloud can actually be executed.
 * Every file's first line repeats its project-relative path as a comment.
 */

/* --------------------------------------------------------------------- *
 * Lesson: Event-driven AWS — EventBridge, Step Functions, Kinesis, SNS   *
 * --------------------------------------------------------------------- */

const eventsSimple = project(
  "concept",
  "Match an EventBridge rule by hand",
  "An EventBridge rule is a JSON pattern, and routing is just: does this event match? Implementing the matcher is the quickest way to stop guessing why a rule never fires.",
  [
    json("rules/order-cancelled.json", {
      source: ["masterclass.orders"],
      "detail-type": ["OrderStateChanged"],
      detail: { status: ["cancelled", "refunded"], total: [{ numeric: [">", 500] }] },
    }, "The rule: an array is an OR of allowed values, and nesting must mirror the event exactly."),
    file("src/match.mjs", `// src/match.mjs — the EventBridge pattern-matching rules, in one function.

/**
 * @param {object} pattern An EventBridge event pattern.
 * @param {object} event The event to test.
 * @returns {boolean} true when EventBridge would deliver this event to the target.
 */
export function matches(pattern, event) {
  return Object.entries(pattern).every(([key, expected]) => {
    const actual = event[key];

    // A nested object means "descend": the event must have the same shape.
    if (!Array.isArray(expected)) return typeof actual === 'object' && actual !== null && matches(expected, actual);

    // An array is a list of alternatives. ONE match is enough — this is an OR,
    // which is the rule most people get backwards when a filter is too broad.
    return expected.some(candidate => {
      // A plain value is compared exactly; no coercion, so 500 never equals '500'.
      if (typeof candidate !== 'object' || candidate === null) return candidate === actual;
      // Content filters: numeric is the common one, prefix and exists follow the same shape.
      if (candidate.numeric) return numericMatch(candidate.numeric, actual);
      if (candidate.prefix !== undefined) return typeof actual === 'string' && actual.startsWith(candidate.prefix);
      if (candidate.exists !== undefined) return candidate.exists === (actual !== undefined);
      return false;
    });
  });
}

/** numeric is a flat list of operator/value pairs, ALL of which must hold. */
function numericMatch(conditions, value) {
  if (typeof value !== 'number') return false;
  for (let index = 0; index < conditions.length; index += 2) {
    const [operator, bound] = [conditions[index], conditions[index + 1]];
    const satisfied = { '>': value > bound, '>=': value >= bound, '<': value < bound, '<=': value <= bound, '=': value === bound }[operator];
    if (!satisfied) return false;
  }
  return true;
}`, "Three rules do all the work: objects descend, arrays are OR, and content filters are objects inside those arrays."),
    file("scripts/check.mjs", `// scripts/check.mjs — the same event with one field changed, four times.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { matches } from '../src/match.mjs';

const pattern = JSON.parse(await readFile('rules/order-cancelled.json', 'utf8'));
const event = { source: 'masterclass.orders', 'detail-type': 'OrderStateChanged', detail: { status: 'cancelled', total: 900 } };

assert.equal(matches(pattern, event), true);
// 'refunded' is the second alternative — arrays are OR, so this still matches.
assert.equal(matches(pattern, { ...event, detail: { ...event.detail, status: 'refunded' } }), true);
// Below the numeric threshold: the rule is doing its job.
assert.equal(matches(pattern, { ...event, detail: { ...event.detail, total: 100 } }), false);
// A string total silently never matches — the classic "my rule never fires" bug.
assert.equal(matches(pattern, { ...event, detail: { ...event.detail, total: '900' } }), false);

console.log('matched:', matches(pattern, event));
console.log('Pattern semantics confirmed');`, "The fourth assertion is worth the whole project: a numeric filter against a stringified number matches nothing, with no error anywhere."),
    readme("EventBridge rule matching", "Run `node scripts/check.mjs` with Node.js 22.12+. No bus, rule or target is created. src/match.mjs covers the subset of the pattern language used here (exact values, numeric, prefix, exists); the real service supports more operators, but the object/array semantics are the same."),
  ],
  ["node scripts/check.mjs", "Change the rule's total filter to [{ \"numeric\": [\">\", 500, \"<\", 800] }] and re-run: conditions are ANDed, so the 900 event stops matching."],
  "matched: true\nPattern semantics confirmed",
  [api("matches", "matches(pattern: object, event: object): boolean", "true when EventBridge would deliver the event to that rule's targets.", [param("pattern", "object", "An event pattern; nested objects descend, arrays are alternatives."), param("event", "object", "The event envelope, including source, detail-type and detail.")])],
);

const eventsHard = project(
  "application",
  "A Step Functions workflow with a Kinesis consumer",
  "Two failure modes that only show up in production: a workflow that must retry a flaky step without repeating a paid one, and a stream consumer that must report partial batch failures instead of replaying the whole batch.",
  [
    nodePackage({ test: "node --test", start: "node scripts/run.mjs" }),
    json("workflow/order.asl.json", {
      Comment: "Charge, then notify. Retries are per-state, not per-workflow.",
      StartAt: "ReserveStock",
      States: {
        ReserveStock: {
          Type: "Task", Resource: "arn:aws:states:::lambda:invoke", Next: "ChargeCard",
          Retry: [{ ErrorEquals: ["States.TaskFailed"], IntervalSeconds: 1, MaxAttempts: 3, BackoffRate: 2 }],
        },
        ChargeCard: {
          Type: "Task", Resource: "arn:aws:states:::lambda:invoke", Next: "Notify",
          Retry: [{ ErrorEquals: ["ServiceUnavailable"], IntervalSeconds: 2, MaxAttempts: 2, BackoffRate: 2 }],
          Catch: [{ ErrorEquals: ["States.ALL"], Next: "ReleaseStock" }],
        },
        Notify: { Type: "Task", Resource: "arn:aws:states:::sns:publish", End: true },
        ReleaseStock: { Type: "Task", Resource: "arn:aws:states:::lambda:invoke", Next: "Failed" },
        Failed: { Type: "Fail", Error: "OrderFailed", Cause: "Payment could not be completed" },
      },
    }, "Amazon States Language. The Catch on ChargeCard is the compensating path: a failed charge releases the stock the first step reserved."),
    file("src/interpreter.mjs", `// src/interpreter.mjs — execute an ASL document against local task handlers.

/**
 * @param {object} definition A parsed .asl.json document.
 * @param {Record<string,(input:object)=>Promise<object>>} handlers One per state name.
 * @returns {(input:object)=>Promise<{output:object,trail:string[],failed?:string}>}
 */
export function interpret(definition, handlers) {
  return async function execute(input) {
    let state = definition.StartAt;
    let payload = input;
    const trail = [];               // Every state entered, for assertions and debugging.

    while (state) {
      const node = definition.States[state];
      trail.push(state);

      if (node.Type === 'Fail') return { output: payload, trail, failed: node.Error };

      try {
        payload = await runWithRetry(node, handlers[state], payload, trail);
      } catch (error) {
        // Catch routes to a compensating state instead of failing the execution.
        const rule = (node.Catch ?? []).find(c => c.ErrorEquals.includes('States.ALL') || c.ErrorEquals.includes(error.name));
        if (!rule) throw error;
        payload = { ...payload, error: error.message };
        state = rule.Next;
        continue;
      }
      state = node.End ? undefined : node.Next;
    }
    return { output: payload, trail };
  };
}

/** Retry is per-state: attempts here never re-run the states that already succeeded. */
async function runWithRetry(node, handler, payload, trail) {
  const rules = node.Retry ?? [];
  const maxAttempts = Math.max(1, ...rules.map(rule => rule.MaxAttempts ?? 1));
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try { return await handler(payload); }
    catch (error) {
      lastError = error;
      const rule = rules.find(r => r.ErrorEquals.includes('States.TaskFailed') || r.ErrorEquals.includes(error.name));
      // No matching Retry rule, or attempts exhausted: hand the error to Catch.
      if (!rule || attempt >= (rule.MaxAttempts ?? 1)) throw error;
      trail.push(node.Type + ':retry');
      // A real execution waits IntervalSeconds * BackoffRate ** (attempt - 1);
      // the wait is skipped here so the test suite stays fast.
    }
  }
  throw lastError;
}`, "Retry sits inside a state, Catch sits around it. That nesting is why a flaky reservation does not re-charge a card."),
    file("src/kinesis-consumer.mjs", `// src/kinesis-consumer.mjs — report partial batch failures, not whole-batch ones.

/**
 * @param {(record:object)=>Promise<void>} process One record at a time.
 * @returns {(event:{Records:object[]})=>Promise<{batchItemFailures:{itemIdentifier:string}[]}>}
 */
export function createConsumer(process) {
  return async function handler(event) {
    const batchItemFailures = [];
    // Kinesis is ordered per shard, so records are processed in sequence, not
    // with Promise.all — parallelism here would silently reorder a shard.
    for (const record of event.Records) {
      try {
        // Payloads arrive base64-encoded; decoding is the consumer's job.
        await process(JSON.parse(Buffer.from(record.kinesis.data, 'base64').toString('utf8')));
      } catch {
        // Returning the sequence number tells Lambda to redeliver only from here.
        // Throwing instead would replay every record in the batch, including the
        // ones that already succeeded.
        batchItemFailures.push({ itemIdentifier: record.kinesis.sequenceNumber });
      }
    }
    return { batchItemFailures };
  };
}`, "Eleven lines that decide whether a poison-pill record costs you one retry or an infinite loop over the whole batch."),
    file("test/workflow.test.mjs", `// test/workflow.test.mjs — retry, compensation and partial batch failure.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { interpret } from '../src/interpreter.mjs';
import { createConsumer } from '../src/kinesis-consumer.mjs';

const definition = JSON.parse(await readFile(new URL('../workflow/order.asl.json', import.meta.url), 'utf8'));

/** Fails the first n calls, then succeeds — a flaky dependency in three lines. */
const flaky = (n, result) => { let calls = 0; return async input => { if (calls++ < n) throw new Error('transient'); return { ...input, ...result }; }; };

test('a flaky first step is retried without re-running later steps', async () => {
  let charges = 0;
  const execute = interpret(definition, {
    ReserveStock: flaky(2, { reserved: true }),
    ChargeCard: async input => { charges += 1; return { ...input, charged: true }; },
    Notify: async input => input,
  });
  const { output, trail } = await execute({ orderId: 'A-1' });
  assert.equal(output.charged, true);
  assert.equal(charges, 1);                       // retried the reservation, charged once
  assert.equal(trail.filter(s => s === 'ReserveStock').length, 1);
});

test('a failed charge releases the stock and ends in Fail', async () => {
  let released = false;
  const execute = interpret(definition, {
    ReserveStock: async input => ({ ...input, reserved: true }),
    ChargeCard: async () => { throw new Error('card declined'); },
    ReleaseStock: async input => { released = true; return input; },
    Notify: async input => input,
  });
  const { failed, trail } = await execute({ orderId: 'A-2' });
  assert.equal(released, true);
  assert.equal(failed, 'OrderFailed');
  assert.equal(trail.includes('Notify'), false);  // never notify a customer of a failed charge
});

test('one bad record does not replay the whole batch', async () => {
  const seen = [];
  const handler = createConsumer(async record => { seen.push(record.id); if (record.id === 'r2') throw new Error('poison'); });
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64');
  const result = await handler({ Records: ['r1', 'r2', 'r3'].map((id, index) => ({ kinesis: { sequenceNumber: 'seq-' + index, data: encode({ id }) } })) });

  assert.deepEqual(seen, ['r1', 'r2', 'r3']);                              // ordering preserved
  assert.deepEqual(result.batchItemFailures, [{ itemIdentifier: 'seq-1' }]); // only the bad one
});`, "Three tests, three production incidents avoided: a double charge, a customer told their failed order shipped, and an endlessly replayed batch."),
    file("scripts/run.mjs", `// scripts/run.mjs — run the happy path and print the states it visited.
import { readFile } from 'node:fs/promises';
import { interpret } from '../src/interpreter.mjs';

const definition = JSON.parse(await readFile('workflow/order.asl.json', 'utf8'));
const execute = interpret(definition, {
  ReserveStock: async input => ({ ...input, reserved: true }),
  ChargeCard: async input => ({ ...input, charged: true }),
  Notify: async input => ({ ...input, notified: true }),
});

const { output, trail } = await execute({ orderId: 'A-1', total: 900 });
console.log('trail:', trail.join(' -> '));
console.log('output:', JSON.stringify(output));`, "The trail is the artifact worth printing: it is what the Step Functions console shows you after an execution."),
    readme("Step Functions and Kinesis", "Node.js 22.12+. `npm test` runs three tests; `npm start` executes the workflow. Nothing is deployed. workflow/order.asl.json is a real Amazon States Language document; src/interpreter.mjs implements only the subset it uses (Task, Fail, Retry, Catch) and skips the backoff waits so tests stay fast."),
  ],
  ["npm test", "npm start", "Remove the Catch block from ChargeCard and re-run npm test: the compensation test fails, showing what an un-caught task error costs."],
  "three tests pass\ntrail: ReserveStock -> ChargeCard -> Notify\noutput: {\"orderId\":\"A-1\",\"total\":900,\"reserved\":true,\"charged\":true,\"notified\":true}",
  [
    api("interpret", "interpret(definition: AslDocument, handlers: Record<string, Handler>): (input: object) => Promise<Result>", "An execute function returning output, the trail of states entered, and failed when it ended in a Fail state.", [param("definition", "object", "A parsed Amazon States Language document."), param("handlers", "object", "One async function per Task state name.")]),
    api("createConsumer", "createConsumer(process: (record: object) => Promise<void>): (event: KinesisEvent) => Promise<Response>", "{ batchItemFailures }, the shape Lambda needs to redeliver only the failed records.", [param("process", "function", "Handles one decoded record; throwing marks just that record failed.")]),
  ],
);

/* --------------------------------------------------------------------- *
 * Lesson: Containers and pipelines — ECR, ECS, App Runner, CodeBuild     *
 * --------------------------------------------------------------------- */

const containersSimple = project(
  "concept",
  "Validate an ECS task definition",
  "A task definition is the contract between your image and the platform. Four settings decide whether a deploy is safe, and this checks all four before a deployment can accept it.",
  [
    json("infra/task-definition.json", {
      family: "notes-api",
      networkMode: "awsvpc",
      requiresCompatibilities: ["FARGATE"],
      cpu: "512",
      memory: "1024",
      executionRoleArn: "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
      taskRoleArn: "arn:aws:iam::123456789012:role/notes-api-task",
      containerDefinitions: [{
        name: "api",
        image: "123456789012.dkr.ecr.ap-south-1.amazonaws.com/notes-api@sha256:2c1f8e5b9a7d4c3e6f0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60",
        essential: true,
        portMappings: [{ containerPort: 3000, protocol: "tcp" }],
        healthCheck: { command: ["CMD-SHELL", "node -e \"fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1))\""], interval: 15, retries: 3, startPeriod: 20 },
        secrets: [{ name: "DATABASE_URL", valueFrom: "arn:aws:secretsmanager:ap-south-1:123456789012:secret:notes/db" }],
        logConfiguration: { logDriver: "awslogs", options: { "awslogs-group": "/ecs/notes-api", "awslogs-region": "ap-south-1", "awslogs-stream-prefix": "api" } },
      }],
    }, "Note the two distinct roles and the digest-pinned image — those are the two settings reviewers most often miss."),
    file("src/validate.mjs", `// src/validate.mjs — the four checks worth failing a deploy over.

/**
 * @param {object} definition A parsed ECS task definition.
 * @returns {string[]} Problems found; an empty array means the definition is safe to deploy.
 */
export function validate(definition) {
  const problems = [];
  const container = definition.containerDefinitions?.[0];
  if (!container) return ['no container definitions'];

  // 1. A mutable tag like :latest means two deploys of "the same" definition can
  //    run different code. A digest is the only immutable reference.
  if (!container.image.includes('@sha256:')) problems.push('image is not pinned to a digest');

  // 2. The execution role pulls the image and writes logs; the task role is what
  //    YOUR code gets. Sharing one role hands application code the pull permissions.
  if (definition.executionRoleArn === definition.taskRoleArn) problems.push('execution and task roles must differ');

  // 3. Secrets are fetched by the agent at start; environment entries with the
  //    same names sit in plain text in the definition and in the console.
  const plaintext = (container.environment ?? []).map(entry => entry.name).filter(name => /SECRET|PASSWORD|TOKEN|_URL$/.test(name));
  if (plaintext.length) problems.push('plaintext environment secrets: ' + plaintext.join(', '));

  // 4. Without a health check the scheduler only knows the process is running,
  //    which is not the same as the service being able to answer.
  if (!container.healthCheck) problems.push('no container health check');

  return problems;
}`, "Each check maps to an outage: an ambiguous rollback, an over-permissioned container, a secret in a console screenshot, and a dead task kept in the load balancer."),
    file("scripts/check.mjs", `// scripts/check.mjs — validate the definition and fail the build if it is unsafe.
import { readFile } from 'node:fs/promises';
import { validate } from '../src/validate.mjs';

const definition = JSON.parse(await readFile('infra/task-definition.json', 'utf8'));
const problems = validate(definition);

for (const problem of problems) console.log('PROBLEM:', problem);
console.log(problems.length ? 'Task definition rejected' : 'Task definition looks deployable');
// Non-zero exit is what lets a pipeline stop here rather than deploy anyway.
process.exitCode = problems.length ? 1 : 0;`, "The exit code turns the check into a gate; printing alone would let the pipeline continue."),
    readme("ECS task definition", "Run `node scripts/check.mjs` with Node.js 22.12+. Nothing is registered with ECS and no credentials are used. The digest in infra/task-definition.json is illustrative; a real pipeline substitutes the digest CodeBuild pushed to ECR in the same run."),
  ],
  ["node scripts/check.mjs", "Replace the image digest with :latest and re-run: the first check fires and the exit code becomes 1."],
  "Task definition looks deployable",
  [api("validate", "validate(definition: TaskDefinition): string[]", "A list of problems; empty means deployable.", [param("definition", "object", "A parsed ECS task definition, as registered with RegisterTaskDefinition.")])],
);

const containersHard = project(
  "application",
  "Build, pin and promote a container image",
  "The promotion rule that prevents 'it worked in staging': a CodeBuild spec produces one digest, and the deployment tool refuses any image the tests did not actually run against.",
  [
    nodePackage({ test: "node --test", start: "node scripts/promote.mjs" }),
    file("Dockerfile", `# Dockerfile — multi-stage, non-root, and reproducible enough to trust a digest.
FROM node:22-alpine AS build
WORKDIR /app
# Copy manifests first: this layer is cached until dependencies actually change.
COPY package*.json ./
RUN npm ci
COPY src ./src

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Only production dependencies and built output cross the stage boundary; the
# build toolchain, caches and any credentials used during build stay behind.
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build --chown=node:node /app/src ./src
# Run as a non-root user that already exists in the base image.
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s \\
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/server.mjs"]`, "The health check here and the one in the task definition answer different questions: Docker restarts the container, ECS removes it from the load balancer."),
    file("buildspec.yml", `# buildspec.yml — CodeBuild. The digest is the output that matters.
version: 0.2
env:
  variables:
    IMAGE_REPO: 123456789012.dkr.ecr.ap-south-1.amazonaws.com/notes-api
phases:
  pre_build:
    commands:
      # Short-lived registry credentials from the build role; no stored password.
      - aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin $IMAGE_REPO
  build:
    commands:
      # Tag with the commit so a human can find it; the digest is what deploys.
      - docker build -t $IMAGE_REPO:$CODEBUILD_RESOLVED_SOURCE_VERSION .
      - docker push $IMAGE_REPO:$CODEBUILD_RESOLVED_SOURCE_VERSION
  post_build:
    commands:
      # Read the digest BACK from the registry: it is the identity of the bytes
      # that were actually pushed, not of the bytes we hoped to push.
      - DIGEST=$(aws ecr describe-images --repository-name notes-api --image-ids imageTag=$CODEBUILD_RESOLVED_SOURCE_VERSION --query 'imageDetails[0].imageDigest' --output text)
      - printf '{"digest":"%s","commit":"%s"}' "$DIGEST" "$CODEBUILD_RESOLVED_SOURCE_VERSION" > build.json
artifacts:
  files: [build.json]`, "Reading the digest back from ECR instead of computing it locally is what makes the promotion check meaningful."),
    file("src/promote.mjs", `// src/promote.mjs — refuse to deploy an image the tests never saw.

/**
 * @param {{digest:string,commit:string}} build Output of the build stage.
 * @param {{digest:string,passed:boolean}} testRun Which image the test stage ran.
 * @param {{stage:string,digest:string}[]} history Previous successful promotions.
 * @returns {{decision:'promote'|'block',reason:string,digest?:string}}
 */
export function decide(build, testRun, history) {
  // The core rule: tested bytes and deployed bytes must be the same bytes.
  if (testRun.digest !== build.digest) return { decision: 'block', reason: 'tests ran against a different image' };
  if (!testRun.passed) return { decision: 'block', reason: 'tests did not pass' };

  // A tag is not an identity: two builds of one commit can differ, so a matching
  // commit with a different digest is still a different artifact.
  const duplicate = history.find(entry => entry.digest === build.digest && entry.stage === 'production');
  if (duplicate) return { decision: 'block', reason: 'already promoted to production' };

  return { decision: 'promote', reason: 'tested digest matches', digest: build.digest };
}

/** The deployable reference: always digest, never tag. */
export const imageReference = (repository, digest) => repository + '@' + digest;`, "Three refusals and one approval. Every 'it worked in staging' incident is one of these three cases going unchecked."),
    file("test/promote.test.mjs", `// test/promote.test.mjs — the promotion gate, case by case.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decide, imageReference } from '../src/promote.mjs';

const digest = 'sha256:2c1f8e5b9a7d4c3e6f0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60';
const build = { digest, commit: 'a1b2c3d' };

test('a tested, passing digest is promoted', () => {
  assert.deepEqual(decide(build, { digest, passed: true }, []), { decision: 'promote', reason: 'tested digest matches', digest });
});

test('a rebuilt image is blocked even when the commit matches', () => {
  const rebuilt = { digest: 'sha256:ffff', passed: true };
  assert.equal(decide(build, rebuilt, []).decision, 'block');
});

test('failing tests block the promotion', () => {
  assert.equal(decide(build, { digest, passed: false }, []).reason, 'tests did not pass');
});

test('a digest already in production is not promoted twice', () => {
  assert.equal(decide(build, { digest, passed: true }, [{ stage: 'production', digest }]).decision, 'block');
});

test('the deployable reference uses the digest, never a tag', () => {
  assert.equal(imageReference('repo/notes-api', digest), 'repo/notes-api@' + digest);
});`, "Five tests. The second is the one that pays for itself: same commit, different bytes, blocked."),
    file("scripts/promote.mjs", `// scripts/promote.mjs — the decision a pipeline stage would make.
import { decide, imageReference } from '../src/promote.mjs';

const digest = process.env.IMAGE_DIGEST ?? 'sha256:2c1f8e5b9a7d4c3e6f0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60';
const result = decide({ digest, commit: 'a1b2c3d' }, { digest, passed: true }, []);

console.log(result.decision + ':', result.reason);
if (result.decision === 'promote') console.log('deploying', imageReference('123456789012.dkr.ecr.ap-south-1.amazonaws.com/notes-api', result.digest));
process.exitCode = result.decision === 'promote' ? 0 : 1;`, "The digest comes from the build stage's artifact, so the gate reads real data rather than a hardcoded value."),
    readme("Image promotion gate", "Node.js 22.12+. `npm test` runs five tests; `npm start` prints the decision. No image is built, pushed or deployed — building the Dockerfile needs Docker, and buildspec.yml runs inside CodeBuild with an IAM role permitted to push to that one ECR repository."),
  ],
  ["npm test", "npm start", "IMAGE_DIGEST=sha256:0000 npm start # the tested-digest check blocks it"],
  "five tests pass\npromote: tested digest matches\ndeploying 123456789012.dkr.ecr.ap-south-1.amazonaws.com/notes-api@sha256:2c1f8e…",
  [
    api("decide", "decide(build: BuildOutput, testRun: TestRun, history: Promotion[]): Decision", "promote or block, with a reason, and the digest when promoting.", [param("build", "object", "digest and commit from the build stage's artifact."), param("testRun", "object", "Which digest the test stage ran, and whether it passed."), param("history", "object[]", "Previous promotions, so production is not deployed twice.")]),
    api("imageReference", "imageReference(repository: string, digest: string): string", "A digest-pinned reference suitable for a task definition.", [param("digest", "string", "The sha256 digest read back from ECR after the push.")]),
  ],
);

/* --------------------------------------------------------------------- *
 * Lesson: Analytics — S3 data lake, Glue, Athena, OpenSearch, Firehose   *
 * --------------------------------------------------------------------- */

const analyticsSimple = project(
  "concept",
  "Partition a data lake so Athena stays cheap",
  "Athena bills for bytes scanned. Partitioning is the one decision that changes that bill by an order of magnitude, and the layout is just an S3 key format.",
  [
    file("src/partitions.mjs", `// src/partitions.mjs — Hive-style keys, and the pruning they make possible.

/**
 * Hive partitioning encodes column values IN the key. Glue and Athena read the
 * column names from the path, which is why the key=value form matters.
 * @returns {string} e.g. events/dt=2026-09-12/hour=04/part-000.json
 */
export function objectKey({ prefix, date, hour, part }) {
  const pad = value => String(value).padStart(2, '0');
  return prefix + '/dt=' + date + '/hour=' + pad(hour) + '/part-' + String(part).padStart(3, '0') + '.json';
}

/**
 * Which partitions a query has to read. This is exactly what Athena's partition
 * pruning does — and what it CANNOT do if the predicate is not on a partition column.
 * @param {string[]} keys Every object in the prefix.
 * @param {{from:string,to:string,hours?:number[]}} filter Inclusive date range.
 * @returns {string[]} Only the keys the query must scan.
 */
export function scanned(keys, filter) {
  return keys.filter(key => {
    const date = key.match(/dt=(\\d{4}-\\d{2}-\\d{2})/)?.[1];
    const hour = Number(key.match(/hour=(\\d{2})/)?.[1]);
    if (!date) return true;                       // Unpartitioned data is always scanned.
    if (date < filter.from || date > filter.to) return false;
    // An hour filter only prunes when hour is a partition column, not a field
    // inside the file — that distinction is the whole cost difference.
    return !filter.hours || filter.hours.includes(hour);
  });
}`, "Two functions: one writes the layout, one measures what a query would read. Together they turn a cost question into an assertion."),
    file("sql/create-table.sql", `-- sql/create-table.sql — an external table over the S3 layout above.
CREATE EXTERNAL TABLE IF NOT EXISTS events (
  event_id   string,
  learner_id string,
  action     string,
  amount     double
)
-- dt and hour are PARTITION columns: they live in the key, not in the files.
-- Declaring them here is what lets Athena skip objects instead of opening them.
PARTITIONED BY (dt string, hour string)
ROW FORMAT SERDE 'org.openx.data.jsonserde.JsonSerDe'
LOCATION 's3://masterclass-lake/events/'
TBLPROPERTIES (
  -- Partition projection: Athena derives partitions from the range instead of
  -- calling the Glue catalog, so no MSCK REPAIR TABLE is needed after a load.
  'projection.enabled' = 'true',
  'projection.dt.type' = 'date',
  'projection.dt.range' = '2026-01-01,NOW',
  'projection.dt.format' = 'yyyy-MM-dd',
  'projection.hour.type' = 'integer',
  'projection.hour.range' = '0,23',
  'projection.hour.digits' = '2',
  'storage.location.template' = 's3://masterclass-lake/events/dt=\${dt}/hour=\${hour}'
);`, "Partition projection is the setting that stops a lake from needing a repair step after every load."),
    file("scripts/measure.mjs", `// scripts/measure.mjs — show the difference partitioning makes.
import assert from 'node:assert/strict';
import { objectKey, scanned } from '../src/partitions.mjs';

// One week of hourly files: 7 * 24 = 168 objects.
const keys = [];
for (let day = 1; day <= 7; day += 1) {
  for (let hour = 0; hour < 24; hour += 1) {
    keys.push(objectKey({ prefix: 'events', date: '2026-09-0' + day, hour, part: 0 }));
  }
}

const oneDay = scanned(keys, { from: '2026-09-03', to: '2026-09-03' });
const oneHour = scanned(keys, { from: '2026-09-03', to: '2026-09-03', hours: [4] });

assert.equal(keys.length, 168);
assert.equal(oneDay.length, 24);   // a day filter reads 1/7th of the data
assert.equal(oneHour.length, 1);   // adding the hour column reads 1/168th

console.log('objects in lake:', keys.length);
console.log('scanned for one day:', oneDay.length);
console.log('scanned for one hour:', oneHour.length);
console.log('example key:', oneHour[0]);`, "168 objects down to 1. That ratio is the Athena bill, and it comes entirely from the key layout."),
    readme("Athena partitioning", "Run `node scripts/measure.mjs` with Node.js 22.12+. No bucket, table or query is created. sql/create-table.sql is a real Athena DDL statement; the projection properties let it work without MSCK REPAIR TABLE or a Glue crawler run after each load."),
  ],
  ["node scripts/measure.mjs", "Remove hour from objectKey so every file lands under dt= only, and re-run: the one-hour query now scans 24 objects instead of 1."],
  "objects in lake: 168\nscanned for one day: 24\nscanned for one hour: 1\nexample key: events/dt=2026-09-03/hour=04/part-000.json",
  [
    api("objectKey", "objectKey(input: { prefix: string; date: string; hour: number; part: number }): string", "A Hive-partitioned S3 key, e.g. events/dt=2026-09-12/hour=04/part-000.json.", [param("date", "string", "ISO date; becomes the dt partition column."), param("hour", "number", "0-23; zero-padded into the hour partition column.")]),
    api("scanned", "scanned(keys: string[], filter: { from: string; to: string; hours?: number[] }): string[]", "Only the keys a partition-pruned query must read.", [param("filter", "object", "An inclusive date range and an optional list of hours.")]),
  ],
);

const analyticsHard = project(
  "application",
  "A Glue-style ETL job with a data-quality gate",
  "Raw JSON into partitioned, typed, deduplicated output — and a quality gate that quarantines bad rows instead of letting them poison every downstream query.",
  [
    nodePackage({ test: "node --test", start: "node scripts/etl.mjs" }),
    file("src/transform.mjs", `// src/transform.mjs — the row-level work: coerce, validate, deduplicate.

/** The schema the table declares. Raw JSON does not have to agree with it. */
const COERCE = {
  event_id: value => String(value),
  learner_id: value => String(value),
  action: value => String(value).toLowerCase().trim(),
  // Firehose and mobile clients send numbers as strings; Athena would read a
  // string column as null for a double, so coerce here rather than at query time.
  amount: value => (value === null || value === undefined || value === '' ? null : Number(value)),
  occurred_at: value => new Date(value).toISOString(),
};

/**
 * @param {object} raw One raw record.
 * @returns {{ok:true,row:object}|{ok:false,reason:string,raw:object}}
 */
export function transform(raw) {
  try {
    const row = Object.fromEntries(Object.entries(COERCE).map(([column, coerce]) => [column, coerce(raw[column])]));
    if (!row.event_id) return { ok: false, reason: 'missing event_id', raw };
    // NaN survives Number() silently and would land in the table as a real value.
    if (row.amount !== null && !Number.isFinite(row.amount)) return { ok: false, reason: 'amount is not a number', raw };
    if (Number.isNaN(Date.parse(raw.occurred_at))) return { ok: false, reason: 'unparseable occurred_at', raw };
    return { ok: true, row };
  } catch (error) {
    return { ok: false, reason: error.message, raw };
  }
}

/**
 * At-least-once delivery means duplicates are normal, not exceptional.
 * Keeping the FIRST occurrence makes the job deterministic on replay.
 */
export function deduplicate(rows) {
  const seen = new Set();
  return rows.filter(row => (seen.has(row.event_id) ? false : seen.add(row.event_id)));
}`, "Every rejection here is a query that would have quietly returned the wrong number a month from now."),
    file("src/job.mjs", `// src/job.mjs — the job: partition, gate, and either write or fail.
import { transform, deduplicate } from './transform.mjs';

/** dt and hour come from the event time, so late-arriving data lands in its own partition. */
export const partitionOf = row => {
  const at = new Date(row.occurred_at);
  return 'dt=' + at.toISOString().slice(0, 10) + '/hour=' + String(at.getUTCHours()).padStart(2, '0');
};

/**
 * @param {object[]} raw Records read from the raw prefix.
 * @param {{maxRejectRatio?:number}} options Quality gate threshold.
 * @returns {{partitions:Record<string,object[]>,rejected:object[],stats:object,failed:boolean}}
 */
export function run(raw, { maxRejectRatio = 0.05 } = {}) {
  const results = raw.map(transform);
  const rejected = results.filter(result => !result.ok);
  const rows = deduplicate(results.filter(result => result.ok).map(result => result.row));

  // Group into the partitions the writer will create, one prefix per group.
  const partitions = {};
  for (const row of rows) (partitions[partitionOf(row)] ??= []).push(row);

  const rejectRatio = raw.length === 0 ? 0 : rejected.length / raw.length;
  return {
    partitions,
    rejected,
    stats: { read: raw.length, written: rows.length, duplicates: results.filter(r => r.ok).length - rows.length, rejected: rejected.length, rejectRatio },
    // Above the threshold the job fails BEFORE writing. A partially-correct
    // partition is worse than a missing one: queries succeed and lie.
    failed: rejectRatio > maxRejectRatio,
  };
}`, "The gate fails the job before writing. That ordering is the difference between a missing partition and a wrong answer."),
    json("fixtures/raw-events.json", [
      { event_id: "e1", learner_id: "L1", action: "Lesson_Completed", amount: "12.50", occurred_at: "2026-09-12T04:20:00Z" },
      { event_id: "e2", learner_id: "L2", action: "lesson_completed", amount: 0, occurred_at: "2026-09-12T04:59:59Z" },
      { event_id: "e1", learner_id: "L1", action: "lesson_completed", amount: "12.50", occurred_at: "2026-09-12T04:20:00Z" },
      { event_id: "e3", learner_id: "L3", action: "purchase", amount: "1499", occurred_at: "2026-09-12T05:00:00Z" },
      { event_id: "e4", learner_id: "L4", action: "purchase", amount: "not-a-number", occurred_at: "2026-09-12T05:10:00Z" },
    ], "Five records covering the four real-world cases: mixed casing, a string number, an at-least-once duplicate, and one genuinely broken row."),
    file("test/etl.test.mjs", `// test/etl.test.mjs — correctness of the rows, and of the decision to write them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { run, partitionOf } from '../src/job.mjs';
import { transform } from '../src/transform.mjs';

const raw = JSON.parse(await readFile(new URL('../fixtures/raw-events.json', import.meta.url), 'utf8'));

test('string amounts become numbers and actions are normalised', () => {
  const { row } = transform(raw[0]);
  assert.equal(row.amount, 12.5);
  assert.equal(row.action, 'lesson_completed');
});

test('a redelivered event is written once', () => {
  const result = run(raw, { maxRejectRatio: 0.5 });
  assert.equal(result.stats.duplicates, 1);
  assert.equal(Object.values(result.partitions).flat().filter(row => row.event_id === 'e1').length, 1);
});

test('rows land in the partition of their event time, not of the run', () => {
  const result = run(raw, { maxRejectRatio: 0.5 });
  assert.deepEqual(Object.keys(result.partitions).sort(), ['dt=2026-09-12/hour=04', 'dt=2026-09-12/hour=05']);
  assert.equal(partitionOf({ occurred_at: '2026-09-12T04:59:59Z' }), 'dt=2026-09-12/hour=04');
});

test('the broken row is quarantined with a reason, not silently dropped', () => {
  const result = run(raw, { maxRejectRatio: 0.5 });
  assert.deepEqual(result.rejected.map(r => [r.raw.event_id, r.reason]), [['e4', 'amount is not a number']]);
});

test('too many bad rows fail the job before anything is written', () => {
  const result = run(raw, { maxRejectRatio: 0.05 });   // 1 of 5 = 20% > 5%
  assert.equal(result.failed, true);
});`, "Five tests. The last one is the gate: at the default threshold this batch is bad enough that writing it would be the wrong move."),
    file("scripts/etl.mjs", `// scripts/etl.mjs — run the job and report what a writer would do.
import { readFile } from 'node:fs/promises';
import { run } from '../src/job.mjs';

const raw = JSON.parse(await readFile('fixtures/raw-events.json', 'utf8'));
const result = run(raw, { maxRejectRatio: Number(process.env.MAX_REJECT_RATIO ?? 0.05) });

console.log('stats:', JSON.stringify(result.stats));
for (const [partition, rows] of Object.entries(result.partitions)) console.log('would write', partition, rows.length + ' rows');
for (const bad of result.rejected) console.log('quarantine', bad.raw.event_id, '-', bad.reason);
console.log(result.failed ? 'JOB FAILED: reject ratio above threshold' : 'JOB OK');
process.exitCode = result.failed ? 1 : 0;`, "Printing 'would write' rather than writing keeps the example runnable offline while showing the exact output layout."),
    readme("Glue-style ETL", "Node.js 22.12+. `npm test` runs five tests; `npm start` runs the job and exits 1 because this batch trips the quality gate. Nothing is read from or written to S3. In a real Glue job the same functions sit between a read from the raw prefix and a partitioned write to the curated prefix, with rejected rows written to a quarantine prefix for replay."),
  ],
  ["npm test", "npm start", "MAX_REJECT_RATIO=0.5 npm start # the gate passes and the partitions are reported"],
  'five tests pass\nstats: {"read":5,"written":3,"duplicates":1,"rejected":1,"rejectRatio":0.2}\nquarantine e4 - amount is not a number\nJOB FAILED: reject ratio above threshold',
  [
    api("run", "run(raw: object[], options?: { maxRejectRatio?: number }): { partitions: Record<string, object[]>; rejected: object[]; stats: object; failed: boolean }", "Rows grouped by partition, quarantined rows with reasons, counts, and whether the gate failed the job.", [param("raw", "object[]", "Records read from the raw prefix."), param("maxRejectRatio", "number", "Fraction of bad rows tolerated before the job fails; default 0.05.")]),
    api("transform", "transform(raw: object): { ok: true; row: object } | { ok: false; reason: string; raw: object }", "A coerced row, or a rejection carrying the original record and a reason.", [param("raw", "object", "One raw JSON record; types are not trusted.")]),
    api("partitionOf", "partitionOf(row: { occurred_at: string }): string", "The dt=…/hour=… prefix derived from the event time, so late data self-partitions.", [param("row", "object", "A transformed row with an ISO occurred_at.")]),
  ],
);

/** Keyed by lesson title, so a lesson picks up its pair without a positional index. */
export const AWS_DATA_EXAMPLES: Record<string, [CodeExample, CodeExample]> = {
  "Event-driven AWS: EventBridge, Step Functions, Kinesis and SNS": [eventsSimple, eventsHard],
  "Containers and pipelines: ECR, ECS, App Runner and CodeBuild": [containersSimple, containersHard],
  "Analytics: S3 data lakes, Glue, Athena, OpenSearch and Firehose": [analyticsSimple, analyticsHard],
};

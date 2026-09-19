import type { TechyExample } from "./techy-examples";

export const TECHY_ADDITIONAL_EXAMPLES: Record<string, TechyExample> = {
  python: {
    title: "Summarize study sessions", description: "A generator validates rows lazily; a separate entry point reads the JSON file using a context manager.",
    setup: "Python 3.10+ • No packages required • Save all files in one directory and run python main.py. Expected output: {'Python': 40, 'AWS': 20}.",
    files: [
      { path: "sessions.py", language: "python", code: `from collections import defaultdict

def valid_sessions(rows):
    for row in rows:
        if not isinstance(row, dict):
            continue
        topic, minutes = row.get("topic"), row.get("minutes")
        if (isinstance(topic, str) and topic.strip()
                and type(minutes) is int and minutes >= 0):
            yield topic.strip(), minutes

def summarize(rows):
    totals = defaultdict(int)
    for topic, minutes in valid_sessions(rows):
        totals[topic] += minutes
    return dict(totals)
` },
      { path: "main.py", language: "python", code: `import json
from pathlib import Path
from sessions import summarize

def main():
    source = Path(__file__).with_name("sessions.json")
    with source.open(encoding="utf-8") as handle:
        rows = json.load(handle)
    if not isinstance(rows, list):
        raise ValueError("Expected a list of sessions")
    print(summarize(rows))

if __name__ == "__main__":
    main()
` },
      { path: "sessions.json", language: "json", code: `[
  {"topic": "Python", "minutes": 25},
  {"topic": "AWS", "minutes": 20},
  {"topic": "Python", "minutes": 15},
  {"topic": "Invalid", "minutes": -2}
]` },
      { path: "test_sessions.py", language: "python", code: `import unittest
from sessions import summarize

class SessionTests(unittest.TestCase):
    def test_invalid_rows_and_duplicate_topics(self):
        rows = [{"topic": "Python", "minutes": 2},
                {"topic": "Python", "minutes": 3},
                {"topic": "Python", "minutes": True}, None]
        self.assertEqual(summarize(rows), {"Python": 5})

if __name__ == "__main__":
    unittest.main()
` },
    ],
  },
  javascript: {
    title: "Predict, run and explain", description: "Run the puzzle module first, predict each value, then run the assertion file to check the language rules.",
    setup: "Node.js 22+ • No packages required • node puzzles.mjs prints the outputs. Run node --test puzzles.test.mjs to verify the explanations.",
    files: [
      { path: "puzzles.mjs", language: "javascript", code: `export function makeCounter() {
  let count = 0;
  return () => ++count;
}

export async function eventOrder() {
  const events = ['sync'];
  const pending = Promise.resolve().then(() => events.push('microtask'));
  events.push('end');
  await pending;
  return events;
}

export function shallowCopy() {
  const first = { nested: { value: 1 } };
  const second = { ...first };
  second.nested.value = 2;
  return first.nested.value;
}

const next = makeCounter();
console.log('Closure:', next(), next());
console.log('Order:', await eventOrder());
console.log('Shared nested object:', shallowCopy());
` },
      { path: "puzzles.test.mjs", language: "javascript", code: `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeCounter, eventOrder, shallowCopy } from './puzzles.mjs';

test('each counter has its own captured binding', () => {
  const a = makeCounter();
  const b = makeCounter();
  assert.deepEqual([a(), a(), b()], [1, 2, 1]);
});
test('microtasks follow synchronous work', async () => {
  assert.deepEqual(await eventOrder(), ['sync', 'end', 'microtask']);
});
test('spread does not deeply clone nested objects', () => {
  assert.equal(shallowCopy(), 2);
});
` },
    ],
  },
  "aws-ai": {
    title: "Ask a Bedrock model with Python", description: "The Converse API uses a common message structure for supported models. Authentication stays in the SDK credential chain.",
    setup: "Python 3.10+ • pip install -r requirements.txt • Set AWS_REGION and BEDROCK_MODEL_ID to a supported model or inference profile you can access. The role needs bedrock:InvokeModel and applicable model access. Run python main.py; AWS inference charges may apply.",
    files: [
      { path: "requirements.txt", language: "text", code: "boto3>=1.35,<2\n" },
      { path: "bedrock_client.py", language: "python", code: `import os
import boto3

def explain(prompt):
    region = os.environ["AWS_REGION"]
    model_id = os.environ["BEDROCK_MODEL_ID"]
    client = boto3.client("bedrock-runtime", region_name=region)
    response = client.converse(
        modelId=model_id,
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        inferenceConfig={"maxTokens": 256},
    )
    blocks = response["output"]["message"]["content"]
    return "\\n".join(block["text"] for block in blocks if "text" in block)
` },
      { path: "main.py", language: "python", code: `from botocore.exceptions import BotoCoreError, ClientError
from bedrock_client import explain

if __name__ == "__main__":
    try:
        print(explain("Explain an S3 bucket in two concise sentences."))
    except (KeyError, BotoCoreError, ClientError) as error:
        raise SystemExit("Check configuration, model access and credentials: "
                         + str(error)) from error
` },
    ],
  },
  "aws-all": {
    title: "An event-driven storage architecture", description: "A minimal CloudFormation template connects S3 object-created events to SQS with a scoped queue policy. This demonstrates how services compose.",
    setup: "Review in a sandbox AWS account with CloudFormation, S3 and SQS permissions. Set a globally unique bucket name parameter. Upload a test object and inspect the queue. Empty the bucket before deleting the stack; AWS charges may apply.",
    files: [
      { path: "template.yml", language: "yaml", code: `AWSTemplateFormatVersion: '2010-09-09'
Parameters:
  BucketName:
    Type: String
Resources:
  Events:
    Type: AWS::SQS::Queue
  QueuePolicy:
    Type: AWS::SQS::QueuePolicy
    Properties:
      Queues: [!Ref Events]
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action: sqs:SendMessage
            Resource: !GetAtt Events.Arn
            Condition:
              ArnEquals:
                aws:SourceArn: !Sub 'arn:\${AWS::Partition}:s3:::\${BucketName}'
              StringEquals:
                aws:SourceAccount: !Ref AWS::AccountId
  Uploads:
    Type: AWS::S3::Bucket
    DependsOn: QueuePolicy
    Properties:
      BucketName: !Ref BucketName
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      NotificationConfiguration:
        QueueConfigurations:
          - Event: 's3:ObjectCreated:*'
            Queue: !GetAtt Events.Arn
Outputs:
  QueueUrl:
    Value: !Ref Events
` },
      { path: "README.md", language: "markdown", code: `# S3 to SQS learning example

1. S3 stores the uploaded object.
2. An object-created event is sent to the standard SQS queue.
3. A consumer would read the message, process the object, then delete the message.

CloudFormation deploys the queue policy before validating the bucket notification.
The source bucket and account conditions limit who may publish to the queue.
Consumers must tolerate repeated events; this template does not include a consumer.

Deploy after reviewing permissions and replacing YOUR-UNIQUE-BUCKET:
aws cloudformation deploy --template-file template.yml --stack-name techy-events --parameter-overrides BucketName=YOUR-UNIQUE-BUCKET
` },
    ],
  },
  "aws-devops": {
    title: "Build and package a tested Python service", description: "A CodeBuild buildspec checks the application and packages a versioned source artifact. CodePipeline can supply source from CodeCommit and pass the artifact to a separately configured deployment stage.",
    setup: "Python 3.10+ locally: python -m unittest discover -s tests. In CodeBuild, select a managed Linux image supporting Python 3.12, configure source and artifact output, and grant the build role only required permissions. The example builds and tests; it does not create a deployment target.",
    files: [
      { path: "app.py", language: "python", code: `def health():
    return {"status": "ok"}

if __name__ == "__main__":
    print(health())
` },
      { path: "tests/test_app.py", language: "python", code: `import unittest
from app import health

class HealthTests(unittest.TestCase):
    def test_health_contract(self):
        self.assertEqual(health(), {"status": "ok"})
` },
      { path: "buildspec.yml", language: "yaml", code: `version: 0.2
phases:
  install:
    runtime-versions:
      python: 3.12
  pre_build:
    commands:
      - python -m unittest discover -s tests
  build:
    commands:
      - mkdir -p dist
      - cp app.py dist/app.py
      - printf '%s' "$CODEBUILD_RESOLVED_SOURCE_VERSION" > dist/revision.txt
artifacts:
  base-directory: dist
  files:
    - app.py
    - revision.txt
` },
      { path: "README.md", language: "markdown", code: `# Pipeline responsibilities

- CodeCommit: private Git source, or use an authorized external connection.
- CodePipeline: orchestrate Source -> Build -> Approval -> Deploy stages.
- CodeBuild: execute buildspec.yml and emit the tested artifact.
- CodeDeploy: deliver a revision using a target-specific AppSpec and deployment group.
- CloudWatch: inspect logs and health alarms after promotion.

The deployment configuration is workload-specific and is not included here.
Keep source revision metadata with every promoted artifact.
` },
    ],
  },
};

export const TECHY_PUZZLES = [
  { title: "Microtask before timer", code: "console.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => console.log('C'));\nconsole.log('D');", output: "A, D, C, B", explanation: "The current task completes first, then the Promise microtask runs, then the timer callback becomes eligible." },
  { title: "Captured loop binding", code: "const callbacks = [];\nfor (var i = 0; i < 3; i++) callbacks.push(() => i);\nconsole.log(callbacks.map(fn => fn()));", output: "[3, 3, 3]", explanation: "All functions read the same var binding after the loop ends. Replacing var with let produces [0, 1, 2]." },
  { title: "Shallow spread", code: "const a = { child: { count: 1 } };\nconst b = { ...a };\nb.child.count++;\nconsole.log(a.child.count, a === b);", output: "2, false", explanation: "The outer objects differ, but both point to the same child object. Spread performs a shallow copy." },
  { title: "Numeric sorting", code: "const values = [20, 3, 100];\nconsole.log([...values].sort());\nconsole.log([...values].sort((a, b) => a - b));", output: "[100, 20, 3] then [3, 20, 100]", explanation: "Default sort compares string representations. The numeric comparator orders values by magnitude; copies preserve the original array." },
  { title: "Nullish versus falsy", code: "console.log(0 || 8, 0 ?? 8);\nconsole.log('' || 'fallback', '' ?? 'fallback');", output: "8, 0 then 'fallback', ''", explanation: "Logical OR replaces any falsy operand; nullish coalescing only replaces null or undefined." },
  { title: "Independent closures", code: "function counter() {\n  let n = 0;\n  return () => ++n;\n}\nconst a = counter();\nconst b = counter();\nconsole.log(a(), a(), b());", output: "1, 2, 1", explanation: "Each call to counter creates a distinct lexical environment, while repeated calls to a share its own n." },
  { title: "Reference identity", code: "const a = [1];\nconst b = a;\nconsole.log(a === b, a === [1]);\nconsole.log(Object.is(NaN, NaN), NaN === NaN);", output: "true, false then true, false", explanation: "Arrays compare by identity. Object.is considers NaN equal to itself, while strict equality does not." },
  { title: "Await schedules continuation", code: "async function run() {\n  console.log(1);\n  await Promise.resolve();\n  console.log(2);\n}\nrun();\nconsole.log(3);", output: "1, 3, 2", explanation: "The async function runs synchronously until await. Its continuation resumes after the surrounding synchronous code completes." },
];

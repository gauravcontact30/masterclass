/**
 * Interview-depth notes for the AWS services a learner meets first.
 *
 * The generated directory carries a summary and feature points for all 438
 * entries. It carries no use case and no questions, and inventing those for
 * every entry would produce plausible-sounding but unverified material — so
 * this file covers only services whose behaviour is stable and well documented,
 * in the popularity order of `aws-popularity.ts`. A service absent from here
 * renders its concept and key features and no question sections at all, which
 * is the honest result.
 *
 * `subjective` are spoken-answer questions; `objective` are single-answer
 * checks with the correct index and a reason. Both are editorial selections of
 * what interviews commonly cover, not measured question frequency.
 */

export type ServiceQuestion = { question: string; answer: string };
export type ServiceObjective = { question: string; options: string[]; correct: number; explanation: string };
export type ServiceDepth = {
  useCase: string;
  concepts: string[];
  subjective: ServiceQuestion[];
  objective: ServiceObjective[];
};

export const AWS_SERVICE_DEPTH: Record<string, ServiceDepth> = {
  "Amazon S3": {
    useCase: "Store build artefacts, user uploads, data-lake files and static site assets, then serve them through CloudFront.",
    concepts: [
      "Object storage: a flat bucket of keys, not a filesystem — there are no real directories, only key prefixes.",
      "Durability comes from replication across availability zones; availability and cost vary by storage class.",
      "Access is denied by default and granted by bucket policy, IAM policy or a pre-signed URL.",
    ],
    subjective: [
      {
        question: "How do you choose an S3 storage class?",
        answer:
          "Match the class to the access pattern. Standard for frequently read objects, Standard-IA for data read a few times a year that still needs millisecond access, Glacier classes for archives where a retrieval delay is acceptable. Intelligent-Tiering moves objects automatically when the pattern is unknown, at a small per-object monitoring charge.",
      },
      {
        question: "How would you give a browser temporary permission to upload one file?",
        answer:
          "Issue a pre-signed URL from the backend. It encodes one operation, one key and an expiry, signed with credentials the browser never sees, so the bucket stays private and no long-lived key is distributed.",
      },
    ],
    objective: [
      {
        question: "What does S3 strong read-after-write consistency guarantee?",
        options: [
          "A successful PUT is immediately visible to every subsequent GET",
          "Reads may return a stale object for up to 24 hours",
          "Consistency only within one availability zone",
          "Consistency only when versioning is disabled",
        ],
        correct: 0,
        explanation:
          "S3 has provided strong read-after-write consistency for all objects since 2020, with no change in price or performance.",
      },
    ],
  },

  "Amazon EC2": {
    useCase: "Run software that needs a specific operating system, a long-lived process, a GPU or a licence tied to a machine.",
    concepts: [
      "You rent a virtual machine and remain responsible for the OS, patching and everything above it.",
      "Instance families trade CPU, memory, storage and network differently; the family letter encodes the intent.",
      "Pricing models — on-demand, reserved, savings plans, spot — trade commitment and interruption risk for cost.",
    ],
    subjective: [
      {
        question: "When would you choose EC2 over Lambda or Fargate?",
        answer:
          "When the workload does not fit a request-scoped model: a process that must stay warm, a run longer than the Lambda limit, specialised hardware such as a GPU, or software licensed per host. EC2 costs more operationally because you own patching and scaling, so it is the choice when a managed runtime genuinely cannot express the workload.",
      },
      {
        question: "What are spot instances suitable for?",
        answer:
          "Interruptible, restartable work — batch processing, CI runners, rendering, stateless web capacity behind a load balancer. AWS can reclaim the instance with a two-minute warning, so the workload must checkpoint or be safe to lose.",
      },
    ],
    objective: [
      {
        question: "Which statement about a security group is correct?",
        options: [
          "It is stateful: a permitted inbound request's reply is allowed out automatically",
          "It is stateless and needs matching inbound and outbound rules",
          "It can write explicit deny rules",
          "It applies to a whole subnet rather than an instance",
        ],
        correct: 0,
        explanation:
          "Security groups are stateful and allow-only. Network ACLs are the stateless, subnet-level control that supports deny rules.",
      },
    ],
  },

  "AWS Lambda": {
    useCase: "Run event-driven code — an API handler, a queue consumer, a scheduled job, a reaction to an S3 upload — without managing servers.",
    concepts: [
      "Billing is per request plus active compute time, so idle costs nothing.",
      "A cold start is the first invocation on a new execution environment; keeping the package small shortens it.",
      "The execution environment may be reused, so anything outside the handler survives between invocations.",
    ],
    subjective: [
      {
        question: "How do you reduce cold starts?",
        answer:
          "Cut package size and dependencies, move initialisation outside the handler so a reused environment skips it, and choose a runtime with fast start-up. Provisioned concurrency keeps environments warm when a latency floor genuinely matters, at a standing cost.",
      },
      {
        question: "Why must a Lambda handler be idempotent?",
        answer:
          "Most event sources deliver at least once, so the same event can arrive twice after a retry or a visibility-timeout expiry. Writes should therefore be keyed on something stable from the event — a message ID or a business key — so a duplicate delivery does not double-charge or double-insert.",
      },
    ],
    objective: [
      {
        question: "What happens when a Lambda function exceeds its configured timeout?",
        options: [
          "The invocation is stopped and reported as an error, and the event source may retry",
          "The timeout extends automatically to the account maximum",
          "The function finishes but the response is discarded",
          "The function is disabled until redeployed",
        ],
        correct: 0,
        explanation:
          "The invocation is terminated and recorded as a failure. Whether it is retried depends on the event source and the configured retry and dead-letter behaviour.",
      },
    ],
  },

  "AWS IAM": {
    useCase: "Decide which people, services and workloads may call which AWS APIs on which resources, and prove it later from CloudTrail.",
    concepts: [
      "Everything is denied unless explicitly allowed, and one explicit deny overrides every allow.",
      "Roles are assumed for temporary credentials; users with long-lived access keys are the exception, not the default.",
      "A request is evaluated against identity policies, resource policies, permission boundaries and organisation policies together.",
    ],
    subjective: [
      {
        question: "Why prefer a role over an IAM user for an application?",
        answer:
          "A role issues short-lived credentials that rotate automatically, so there is no long-lived secret to leak, store or rotate by hand. An EC2 instance profile, an EKS service account or a Lambda execution role all obtain credentials at run time, and access can be revoked by changing the role rather than hunting down distributed keys.",
      },
      {
        question: "How do you apply least privilege in practice?",
        answer:
          "Start from the actions the workload actually calls — read them from CloudTrail or IAM Access Analyzer — and grant those on named resource ARNs rather than wildcards. Add permission boundaries so a team cannot grant itself more than intended, and review with Access Analyzer for unused permissions.",
      },
    ],
    objective: [
      {
        question: "An identity policy allows s3:GetObject and a bucket policy explicitly denies it. What happens?",
        options: [
          "The request is denied: an explicit deny always wins",
          "The request is allowed: identity policies take precedence",
          "The request is allowed only from inside the VPC",
          "The result depends on which policy was written most recently",
        ],
        correct: 0,
        explanation:
          "IAM evaluation is deny-by-default with explicit-deny precedence, so no allow anywhere can override an explicit deny.",
      },
    ],
  },

  "Amazon VPC": {
    useCase: "Give an application a private network with controlled routes to the internet, to other VPCs and to on-premises systems.",
    concepts: [
      "Subnets are per-availability-zone; a subnet is public only because its route table points at an internet gateway.",
      "Security groups guard instances statefully; network ACLs guard subnets statelessly and can deny.",
      "Private subnets reach AWS APIs through a NAT gateway or, without leaving the AWS network, a VPC endpoint.",
    ],
    subjective: [
      {
        question: "What actually makes a subnet public or private?",
        answer:
          "The route table. A subnet is public when its routes send 0.0.0.0/0 to an internet gateway and its instances hold public IPs. A private subnet has no such route; outbound access goes through a NAT gateway in a public subnet, and inbound access arrives only through a load balancer or another private path.",
      },
      {
        question: "When would you use a VPC endpoint instead of a NAT gateway?",
        answer:
          "When private resources only need AWS services such as S3 or DynamoDB. A gateway or interface endpoint keeps that traffic on the AWS network — cheaper than NAT data processing, and it removes an internet path the workload never needed.",
      },
    ],
    objective: [
      {
        question: "Which control can express an explicit deny rule?",
        options: ["A network ACL", "A security group", "A route table", "An internet gateway"],
        correct: 0,
        explanation:
          "Network ACLs are stateless and support both allow and deny. Security groups are stateful and allow-only.",
      },
    ],
  },

  "Amazon DynamoDB": {
    useCase: "Serve high-volume key-based reads and writes at predictable single-digit millisecond latency — sessions, carts, event state, device data.",
    concepts: [
      "The partition key decides data distribution; a poorly chosen key creates a hot partition.",
      "Queries are efficient only against a key or an index, so the access pattern is designed before the table.",
      "On-demand capacity absorbs unpredictable traffic; provisioned capacity is cheaper for steady, known load.",
    ],
    subjective: [
      {
        question: "How do you model data for DynamoDB?",
        answer:
          "Backwards from the queries. List the access patterns first, then choose partition and sort keys that answer them directly, often storing several entity types in one table with composite keys. There are no joins, so anything the query must return is either in the item or reachable through a secondary index.",
      },
      {
        question: "What is the difference between a local and a global secondary index?",
        answer:
          "A local secondary index keeps the table's partition key and adds a different sort key, must be created with the table, and shares its partition's capacity. A global secondary index can use an entirely different partition key, can be added later, and has its own capacity and eventually consistent reads.",
      },
    ],
    objective: [
      {
        question: "What limits a single DynamoDB partition?",
        options: [
          "About 3,000 read and 1,000 write units per second, which a hot key can exhaust",
          "There is no per-partition limit on provisioned tables",
          "One item per write, regardless of size",
          "Only the table-level capacity applies",
        ],
        correct: 0,
        explanation:
          "Capacity is spread across partitions, so traffic concentrated on one partition key can throttle even when table-level capacity looks sufficient.",
      },
    ],
  },

  "Amazon SQS": {
    useCase: "Decouple a producer from a slower consumer so a traffic spike queues up instead of failing, and retries are handled for you.",
    concepts: [
      "Standard queues are at-least-once with best-effort ordering; FIFO queues add exact ordering and deduplication at lower throughput.",
      "A received message is hidden for its visibility timeout, not deleted — the consumer deletes it after success.",
      "Messages that keep failing move to a dead-letter queue after the configured receive count.",
    ],
    subjective: [
      {
        question: "Why must an SQS consumer be idempotent?",
        answer:
          "Standard queues guarantee at-least-once delivery, and any consumer that crashes or exceeds the visibility timeout will see the message again. Processing must therefore be safe to repeat — usually by keying the side effect on the message ID or a business key so the second attempt is a no-op.",
      },
      {
        question: "How do SQS and SNS differ?",
        answer:
          "SQS is a queue: one message is processed by one consumer, pulled when it is ready. SNS is publish-subscribe: one message fans out to every subscriber, pushed immediately. They are often combined — SNS fans out to several SQS queues so each consumer keeps its own buffered, retryable stream.",
      },
    ],
    objective: [
      {
        question: "What does the visibility timeout control?",
        options: [
          "How long a received message stays hidden from other consumers before reappearing",
          "How long a message is retained before deletion",
          "The maximum time a producer may wait to send",
          "How long a long-poll request stays open",
        ],
        correct: 0,
        explanation:
          "Retention is a separate setting, and long polling has its own wait time. Visibility timeout governs only the hidden window after a receive.",
      },
    ],
  },

  "Amazon CloudWatch": {
    useCase: "Collect metrics, logs and traces from AWS services and your own code, then alarm on them and drive auto-scaling.",
    concepts: [
      "Metrics are numeric time series; logs are text streams; the two are linked by metric filters.",
      "An alarm evaluates a metric over a period and changes state, which can notify SNS or scale a group.",
      "Custom metrics and embedded metric format let application code publish alongside AWS-provided data.",
    ],
    subjective: [
      {
        question: "How would you alarm on an error that only appears in logs?",
        answer:
          "Create a metric filter on the log group that matches the error pattern and publishes a custom metric, then alarm on that metric. Treating missing data as not-breaching avoids false alarms when the service is simply idle.",
      },
      {
        question: "What signals would you alarm on for a user-facing API?",
        answer:
          "Symptoms the user feels rather than causes: p99 latency, 5xx rate and request volume dropping to zero. Cause metrics such as CPU are useful for diagnosis but make noisy alarms, because high CPU with healthy latency is not an incident.",
      },
    ],
    objective: [
      {
        question: "What does an alarm's INSUFFICIENT_DATA state mean?",
        options: [
          "Not enough data points were available in the evaluation period to decide",
          "The metric has breached the threshold",
          "The alarm is disabled",
          "The metric no longer exists",
        ],
        correct: 0,
        explanation:
          "It is a third state alongside OK and ALARM, common for metrics that are only published when activity occurs.",
      },
    ],
  },

  "Amazon Bedrock": {
    useCase: "Call hosted foundation models for summarising, extraction, chat or embeddings without running inference infrastructure.",
    concepts: [
      "One API fronts models from several providers, so switching model is a parameter change rather than a rewrite.",
      "Knowledge bases supply retrieval-augmented generation; guardrails filter input and output.",
      "Requests stay inside your AWS account boundary and are not used to train the base models.",
    ],
    subjective: [
      {
        question: "When would you choose Bedrock over SageMaker?",
        answer:
          "Bedrock when you want to consume an existing foundation model through an API and care about time to production. SageMaker when you need to train, fine-tune deeply or serve a custom model on infrastructure you control. Bedrock trades control for the removal of capacity planning and serving work.",
      },
      {
        question: "How do you ground a model on private data?",
        answer:
          "Retrieval rather than training: embed the documents into a vector store, retrieve the passages relevant to the question, and pass them in the prompt. A Bedrock knowledge base packages that pipeline. It keeps answers current without a training cycle and lets responses cite the source passage.",
      },
    ],
    objective: [
      {
        question: "What is the main purpose of a Bedrock guardrail?",
        options: [
          "To filter disallowed content and topics in both prompts and responses",
          "To reduce the cost of every request",
          "To fine-tune the base model on your data",
          "To cache identical prompts",
        ],
        correct: 0,
        explanation:
          "Guardrails apply configurable content and topic policies on the way in and out; they are a safety control, not a cost or training feature.",
      },
    ],
  },

  "Amazon SageMaker AI": {
    useCase: "Build, train and host custom machine-learning models with managed notebooks, training jobs and inference endpoints.",
    concepts: [
      "Training jobs run on instances provisioned for the job and released when it ends.",
      "An endpoint is a long-lived hosted model; serverless and asynchronous variants suit spiky or slow workloads.",
      "The feature store, model registry and pipelines exist to make a trained model reproducible.",
    ],
    subjective: [
      {
        question: "When is a real-time endpoint the wrong choice?",
        answer:
          "When traffic is sparse or bursty, or inference takes minutes. A standing endpoint bills while idle, so serverless inference suits intermittent traffic, asynchronous inference suits long-running requests with large payloads, and batch transform suits scoring a dataset on a schedule.",
      },
      {
        question: "What problem does the model registry solve?",
        answer:
          "Knowing exactly which artefact is in production and why. It versions models with their metrics and approval status, so a deployment references an approved version rather than a file someone uploaded, and a rollback means selecting the previous version.",
      },
    ],
    objective: [
      {
        question: "Which SageMaker option best fits infrequent, unpredictable inference traffic?",
        options: [
          "Serverless inference",
          "A provisioned real-time endpoint",
          "A multi-model endpoint kept always on",
          "A training job per request",
        ],
        correct: 0,
        explanation:
          "Serverless inference scales to zero between requests, so idle time is not billed — at the cost of a cold start.",
      },
    ],
  },

  "AWS CloudFormation": {
    useCase: "Describe a stack of AWS resources as a template so the same environment can be created, updated and deleted repeatably.",
    concepts: [
      "Templates are declarative: you state the desired resources and CloudFormation computes the changes.",
      "A change set previews what an update would do before it is applied.",
      "A failed update rolls the stack back to its previous state by default.",
    ],
    subjective: [
      {
        question: "Why use a change set?",
        answer:
          "Because a declarative update can imply a replacement rather than an in-place change — renaming a database identifier, for instance, destroys and recreates it. A change set shows each action and whether a resource will be replaced, so a destructive update is caught before it runs rather than during an outage.",
      },
      {
        question: "How does CloudFormation compare with Terraform?",
        answer:
          "CloudFormation is AWS-native, needs no state file of your own and supports new AWS features on release. Terraform spans multiple providers and has a more expressive language, but you own the state backend and its locking. The choice usually follows whether the estate is AWS-only and who operates it.",
      },
    ],
    objective: [
      {
        question: "What does DeletionPolicy: Retain do?",
        options: [
          "Keeps the resource when the stack or resource is deleted",
          "Prevents the stack from ever being deleted",
          "Takes a snapshot before every update",
          "Retains only the CloudFormation logs",
        ],
        correct: 0,
        explanation:
          "It leaves the underlying resource in place after stack deletion — the usual protection for databases and buckets holding real data.",
      },
    ],
  },

  "AWS CodePipeline": {
    useCase: "Chain source, build, test and deploy stages so a commit reaches production through the same reviewed path every time.",
    concepts: [
      "A pipeline is stages of actions; artefacts pass between stages through S3.",
      "Stages can run actions in parallel and can require a manual approval.",
      "It orchestrates rather than executes — CodeBuild, CodeDeploy or CloudFormation do the work.",
    ],
    subjective: [
      {
        question: "Where would you put a manual approval, and why?",
        answer:
          "Immediately before the production deploy stage, after automated tests and a staging deploy have passed. That keeps the gate where a human judgement adds something — release timing and business risk — rather than in front of checks a machine verifies better.",
      },
      {
        question: "How do you keep deployment credentials out of the pipeline?",
        answer:
          "Give each stage an IAM role scoped to what it deploys and let the service assume it, so nothing long-lived is stored. Values that genuinely must be configured come from Secrets Manager or Parameter Store at run time, referenced rather than embedded.",
      },
    ],
    objective: [
      {
        question: "How do artefacts move between CodePipeline stages?",
        options: [
          "Through an S3 artefact bucket configured for the pipeline",
          "They are held in memory by the pipeline service",
          "Each stage re-clones the source repository",
          "Through an EFS volume mounted by every stage",
        ],
        correct: 0,
        explanation:
          "Output artefacts are written to the pipeline's S3 bucket and read by the next stage, which is why that bucket's encryption and access matter.",
      },
    ],
  },

  "AWS CodeBuild": {
    useCase: "Run compile, test and packaging steps on managed build capacity that scales with the number of commits.",
    concepts: [
      "A buildspec file defines phases — install, pre_build, build, post_build — and the artefacts to keep.",
      "Builds run in a container image you choose, so the toolchain is pinned with the project.",
      "Caching dependencies between builds is the usual way to cut build time.",
    ],
    subjective: [
      {
        question: "How would you speed up a slow CodeBuild job?",
        answer:
          "Cache dependencies between builds, use a compute type matched to the work rather than the smallest available, and split independent steps into parallel actions. Pinning a prepared container image also removes per-build tool installation, which is often the largest fixed cost.",
      },
      {
        question: "How should a build access a private package registry?",
        answer:
          "Through its IAM service role for AWS-native registries such as CodeArtifact or ECR, and through Secrets Manager for third-party tokens read at build time. Credentials should never sit in the buildspec or the image, both of which are readable by anyone who can see the project.",
      },
    ],
    objective: [
      {
        question: "Where are a CodeBuild project's build phases defined?",
        options: [
          "In a buildspec file, usually committed at the repository root",
          "Only in the CodeBuild console",
          "In the Dockerfile of the build image",
          "In the CodePipeline stage definition",
        ],
        correct: 0,
        explanation:
          "A committed buildspec.yml keeps the build definition versioned with the code it builds; the console can override it, but that hides the definition from review.",
      },
    ],
  },

  "Amazon Rekognition": {
    useCase: "Detect objects, text, faces and unsafe content in images and video without training a model.",
    concepts: [
      "Pre-trained APIs return labels with confidence scores; you choose the threshold.",
      "Face comparison and search work against a collection of indexed face vectors, not stored images.",
      "Custom Labels trains on your own images when the built-in labels are too generic.",
    ],
    subjective: [
      {
        question: "How do you handle confidence scores in production?",
        answer:
          "Set a threshold per use case rather than globally, and route the uncertain band to a human. Content moderation tolerates false positives far better than false negatives, so it runs a lower threshold than a feature that automatically tags a user's photo.",
      },
      {
        question: "What should you consider before deploying face comparison?",
        answer:
          "Accuracy varies across demographics, so a single threshold can perform unevenly. Consent and retention obligations apply to biometric data in many jurisdictions, and a person should be able to contest an automated match — which means logging the decision and keeping a human review path.",
      },
    ],
    objective: [
      {
        question: "What does a Rekognition face collection store?",
        options: [
          "Face vectors derived from the images, not the images themselves",
          "The original uploaded images",
          "Only the bounding-box coordinates",
          "A link to the S3 object holding each face",
        ],
        correct: 0,
        explanation:
          "Indexing extracts a mathematical representation and stores that; the source image stays wherever you put it.",
      },
    ],
  },

  "Amazon Textract": {
    useCase: "Pull text, key-value pairs and tables out of scanned forms, invoices and identity documents.",
    concepts: [
      "It goes beyond OCR by preserving structure — a form field keeps its label, a table keeps its cells.",
      "Synchronous calls suit single pages; asynchronous jobs handle multi-page documents.",
      "Every block carries a confidence score, so low-confidence extractions can be routed for review.",
    ],
    subjective: [
      {
        question: "How does Textract differ from plain OCR?",
        answer:
          "OCR returns characters and their positions. Textract also returns relationships: this text is the value for that label, these cells form a table, this is a selection element and it is ticked. That structure is what lets a downstream system consume an invoice without a per-layout template.",
      },
      {
        question: "How would you build a reliable invoice pipeline on it?",
        answer:
          "Extract asynchronously, validate the fields against business rules — totals that add up, dates in range — and gate on the confidence scores. Anything below the threshold or failing validation goes to a human queue, and the corrections are kept so the thresholds can be tuned against real error rates.",
      },
    ],
    objective: [
      {
        question: "Which Textract API suits a 50-page scanned PDF?",
        options: [
          "The asynchronous document analysis API",
          "The synchronous DetectDocumentText API",
          "The Rekognition text detection API",
          "The Comprehend entity API",
        ],
        correct: 0,
        explanation:
          "Synchronous calls are limited to single pages; multi-page documents are started as a job and collected when it completes.",
      },
    ],
  },

  "Amazon Comprehend": {
    useCase: "Classify text, pull out entities and detect sentiment or PII across support tickets, reviews and documents.",
    concepts: [
      "Pre-trained APIs cover entities, key phrases, sentiment, language and PII detection.",
      "Custom classification and custom entity recognition train on your labelled examples.",
      "PII detection can both report and redact, which makes it useful before data leaves a boundary.",
    ],
    subjective: [
      {
        question: "When would you train a custom classifier instead of using sentiment analysis?",
        answer:
          "When the label you need is specific to the business — routing a ticket to the right team, tagging a policy breach — rather than a general polarity. Sentiment tells you a message is negative; it cannot tell you it is a billing dispute, and that distinction is what the workflow acts on.",
      },
      {
        question: "How would you use it to reduce PII exposure?",
        answer:
          "Run PII detection at the boundary where text is ingested, redact the detected spans before the text is stored or forwarded, and keep the unredacted original only where it is genuinely required and access-controlled. Detection is probabilistic, so it lowers exposure rather than eliminating it, and should be one control among several.",
      },
    ],
    objective: [
      {
        question: "What does Comprehend's sentiment analysis return?",
        options: [
          "One of positive, negative, neutral or mixed, with confidence scores",
          "A numeric score from minus one to one only",
          "A per-sentence polarity list with no overall result",
          "A binary positive or negative flag",
        ],
        correct: 0,
        explanation:
          "The mixed class matters in practice: a review praising delivery and criticising quality is neither positive nor neutral.",
      },
    ],
  },
};

export const serviceDepth = (name: string): ServiceDepth | undefined => AWS_SERVICE_DEPTH[name];

/** How many of the ranked services carry interview depth, for the UI to state plainly. */
export const DEPTH_COVERAGE = Object.keys(AWS_SERVICE_DEPTH).length;

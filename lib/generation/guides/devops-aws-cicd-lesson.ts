import type { Lesson } from "@/lib/domain";

/**
 * The AWS half of the DevOps guide: one lesson that follows a single Next.js
 * change from a commit to production using AWS delivery services only —
 * CodePipeline, CodeBuild, CodeArtifact, ECR, CodeDeploy, CloudFormation/CDK,
 * ECS on Fargate, Systems Manager, AppConfig, CloudWatch and X-Ray — and a
 * second lesson on what the pipeline must prove before a deploy is allowed.
 *
 * The card grid of these services is attached to the guide's curriculum as
 * `services` (see ./aws-catalog-views.ts), so the reader can search them.
 */
export const DEVOPS_AWS_CICD_LESSONS: Lesson[] = [
  {
    title: "A Next.js application end to end on AWS CI/CD",
    diagram: {
      kind: "flow",
      caption: "One commit to a Next.js app, followed all the way to production using AWS delivery services: each stage hands a single immutable artefact to the next, and the deploy is a traffic shift that can reverse itself.",
      items: [
        { label: "Commit to main", detail: "CodeCommit, or GitHub through the source action" },
        { label: "CodePipeline starts", detail: "one run per commit, artefacts flow between stages" },
        { label: "CodeBuild: install and test", detail: "npm ci, lint, unit tests, next build" },
        { label: "CodeArtifact", detail: "private packages, proxying the public registry" },
        { label: "Container image to ECR", detail: "tagged by commit SHA, scanned, referenced by digest" },
        { label: "CloudFormation / CDK", detail: "infrastructure change reviewed as a change set" },
        { label: "Deploy to staging", detail: "ECS on Fargate behind an ALB; CloudFront in front" },
        { label: "Manual approval", detail: "the one human gate, on the promotion" },
        { label: "CodeDeploy canary to production", detail: "10% of traffic, alarms armed" },
        { label: "CloudWatch alarms", detail: "breach during the shift rolls back automatically" },
        { label: "X-Ray and Application Signals", detail: "latency and errors attributed to a call path" },
        { label: "AppConfig flag", detail: "risky behaviour switched off without a deploy" },
      ],
    },
    explanation: "- Start from the artefact: `next build` produces the application, and the pipeline's job is to build it once and promote that exact build through every environment\n- For a containerised Next.js app, CodeBuild produces an image tagged with the commit SHA, pushes it to Amazon ECR, and everything downstream refers to the image digest rather than a moving tag\n- For a fully static export the same pipeline writes to S3 and invalidates CloudFront instead, but the promotion rule is identical: one artefact, many environments\n- CodePipeline models the journey as stages — Source, Build, DeployStaging, Approve, DeployProduction — and passes artefacts forward, so the thing you tested is provably the thing you deploy\n- buildspec.yml holds the build: install with `npm ci`, run lint and unit tests, run `next build`, build and push the image, and emit `imagedefinitions.json` for the ECS deploy action\n- Cache `~/.npm` and the Next.js build cache (`.next/cache`) in CodeBuild; without it every build recompiles the whole application and the pipeline becomes the slowest part of the day\n- Runtime configuration never goes in the image: read it from Systems Manager Parameter Store and Secrets Manager at startup, so one image runs in staging and production unchanged\n- Infrastructure travels through the same pipeline as code: a CDK or CloudFormation stage produces a change set, and the Replacement column is reviewed before execution because renaming a resource can recreate it\n- The deploy itself is CodeDeploy: an ECS blue-green or canary deployment shifts 10% of traffic first, with CloudWatch alarms registered so a breach rolls the deployment back automatically\n- Give the pipeline an identity per environment: a deploy role assumed per account, so no long-lived production credentials exist in the build environment, and GitHub sources federate with OIDC rather than storing keys\n- Observe the result where the pipeline can act on it: CloudWatch alarms gate the rollout, X-Ray attributes a latency change to a specific call, and Application Signals tracks the SLO the rollout must not breach\n- Keep a switch that is faster than a deploy: AppConfig flags turn a risky code path off in seconds, with automatic rollback when an alarm fires",
    keyPoints: [
      { tone: "key", title: "Build once, promote the artefact", text: "The image built in the Build stage is the image deployed to production. Rebuilding per environment means production runs code no environment tested." },
      { tone: "key", title: "Reference images by digest", text: "A tag can move; a digest cannot. Pinning the digest is what makes 'the scanned image is the running image' a fact rather than a hope." },
      { tone: "key", title: "The deploy is a traffic shift, not a rebuild", text: "CodeDeploy canary or blue-green with alarm-triggered rollback turns a bad release into a few minutes of partial impact." },
      { tone: "key", title: "Configuration comes from Parameter Store, not the image", text: "One image, many environments. Baking environment values into the build is what forces a rebuild per environment." },
      { tone: "tip", title: "Cache .next/cache in CodeBuild", text: "Next.js reuses compilation work between builds; without the cache every pipeline run recompiles the whole application." },
      { tone: "tip", title: "One human gate, on promotion", text: "Approvals everywhere become rubber stamps. Put the single approval where the risk actually changes: staging to production." },
      { tone: "tip", title: "Federate the source, assume the target", text: "OIDC for a GitHub source and an assumed role per environment removes every long-lived credential from the pipeline." },
      { tone: "warning", title: "Do not let the pipeline hold production keys", text: "A build environment runs code from a pull request. Anything it can reach, a malicious change can reach." },
      { tone: "warning", title: "Read the change set before executing", text: "An infrastructure stage that auto-executes will one day recreate a database because a logical id changed." },
    ],
    example: "- A commit produces image `orders-web:9f2c1ab`, and that digest reaches staging and then production unchanged\n- CodeBuild caches `~/.npm` and `.next/cache`, cutting build time from nine minutes to under three\n- The production stage waits on one manual approval, then shifts 10% of traffic for five minutes\n- A 5xx alarm breaches during the canary and CodeDeploy rolls back before most users see it\n- A feature behind an AppConfig flag is switched off in seconds when its error rate climbs",
    code: "# buildspec.yml — CodeBuild: test, build the Next.js app, publish one immutable image.\nversion: 0.2\nenv:\n  variables:\n    NODE_ENV: production\n  parameter-store:\n    SENTRY_DSN: /web/production/sentry-dsn      # configuration, not baked into the image\nphases:\n  install:\n    runtime-versions: { nodejs: 24 }\n    commands:\n      - aws codeartifact login --tool npm --domain acme --repository internal   # private packages\n      - npm ci\n  pre_build:\n    commands:\n      - npm run lint\n      - npm test -- --ci\n      - aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin $ECR_REGISTRY\n  build:\n    commands:\n      - npm run build                                   # next build\n      - export TAG=$CODEBUILD_RESOLVED_SOURCE_VERSION   # the commit SHA is the version\n      - docker build -t $ECR_REGISTRY/orders-web:$TAG .\n      - docker push $ECR_REGISTRY/orders-web:$TAG\n      - export DIGEST=$(aws ecr describe-images --repository-name orders-web --image-ids imageTag=$TAG --query 'imageDetails[0].imageDigest' --output text)\n  post_build:\n    commands:\n      # The deploy action consumes this: it names the exact image, by digest.\n      - printf '[{\"name\":\"web\",\"imageUri\":\"%s@%s\"}]' $ECR_REGISTRY/orders-web $DIGEST > imagedefinitions.json\nartifacts:\n  files: [imagedefinitions.json]\ncache:\n  paths:\n    - '/root/.npm/**/*'\n    - '.next/cache/**/*'          # without this every build recompiles the whole app\n\n# appspec.yml — CodeDeploy: how traffic moves to the new task set, and when to stop.\nversion: 0.0\nResources:\n  - TargetService:\n      Type: AWS::ECS::Service\n      Properties:\n        TaskDefinition: <TASK_DEFINITION>\n        LoadBalancerInfo: { ContainerName: web, ContainerPort: 3000 }\n# Deployment configuration: ECSCanary10Percent5Minutes\n# Alarms: web-5xx-rate, web-p99-latency  ->  breach during the shift rolls back automatically\n\n// infrastructure/pipeline.ts — CDK: the pipeline itself is reviewed infrastructure.\nimport { Stack, type StackProps } from 'aws-cdk-lib';\nimport * as pipelines from 'aws-cdk-lib/pipelines';\nimport { Construct } from 'constructs';\n\nexport class DeliveryStack extends Stack {\n  constructor(scope: Construct, id: string, props: StackProps) {\n    super(scope, id, props);\n\n    const pipeline = new pipelines.CodePipeline(this, 'Delivery', {\n      synth: new pipelines.ShellStep('Synth', {\n        input: pipelines.CodePipelineSource.connection('acme/orders-web', 'main', {\n          connectionArn: process.env.CODESTAR_CONNECTION_ARN!,   // OIDC-backed, no stored keys\n        }),\n        commands: ['npm ci', 'npm test -- --ci', 'npx cdk synth'],\n      }),\n      selfMutation: true,\n    });\n\n    const staging = pipeline.addStage(new WebStage(this, 'Staging', { env: { account: '111111111111', region: 'ap-south-1' } }));\n    staging.addPost(new pipelines.ShellStep('Smoke', { commands: ['curl -fsS https://staging.example.com/healthz'] }));\n\n    pipeline.addStage(new WebStage(this, 'Production', { env: { account: '222222222222', region: 'ap-south-1' } }), {\n      pre: [new pipelines.ManualApprovalStep('PromoteToProduction')],   // the single human gate\n    });\n  }\n}",
    apiReference: [
      {
        name: "buildspec.yml",
        kind: "CodeBuild",
        signature: "version, env { variables, parameter-store, secrets-manager }, phases { install, pre_build, build, post_build }, artifacts, cache",
        params: [
          { name: "parameter-store", type: "map", description: "Injects Systems Manager parameters as environment variables at build time." },
          { name: "cache.paths", type: "string[]", description: "Directories preserved between builds — ~/.npm and .next/cache for a Next.js app." },
          { name: "artifacts.files", type: "string[]", description: "What is handed to the next pipeline stage, such as imagedefinitions.json." },
        ],
        returns: "A build that publishes one immutable, versioned artefact.",
        notes: "Use the commit SHA as the tag and resolve the digest for downstream stages.",
      },
      {
        name: "CodeDeploy deployment configuration",
        kind: "strategy",
        signature: "ECSAllAtOnce | ECSLinear10PercentEvery1Minutes | ECSCanary10Percent5Minutes | blue-green with test traffic",
        params: [
          { name: "alarms", type: "CloudWatch alarms", description: "Registered with the deployment group; a breach during the shift triggers rollback." },
          { name: "hooks", type: "Lambda", description: "Lifecycle validation between traffic shifts." },
        ],
        returns: "A controlled rollout with an automatic exit route.",
      },
      {
        name: "CDK pipelines",
        kind: "construct",
        signature: "new pipelines.CodePipeline(scope, id, { synth, selfMutation }).addStage(stage, { pre: [ManualApprovalStep] })",
        params: [
          { name: "synth", type: "ShellStep", description: "The build that produces the cloud assembly, including tests." },
          { name: "selfMutation", type: "boolean", description: "The pipeline updates itself when its own definition changes." },
          { name: "pre", type: "Step[]", description: "Steps that must pass before a stage deploys, such as a manual approval." },
        ],
        returns: "A pipeline defined, reviewed and versioned like the rest of the infrastructure.",
      },
    ],
    vocabulary: [
      { word: "Promotion", meaning: "Moving one already-built artefact from a lower environment to a higher one.", example: "The staging image digest deployed to production.", synonyms: ["artefact advance", "environment promotion", "release advance", "stage progression", "hand-off"], antonyms: ["rebuild per environment", "separate build", "fresh compile", "per-stage artefact", "environment-specific build"] },
      { word: "Immutable artefact", meaning: "A build output that never changes after it is produced.", example: "An image referenced by sha256 digest.", synonyms: ["fixed build", "pinned image", "versioned output", "content-addressed artefact", "frozen bundle"], antonyms: ["mutable tag", "rebuilt output", "latest tag", "moving reference", "editable artefact"] },
      { word: "Deployment group", meaning: "The CodeDeploy configuration naming the target service, strategy and rollback alarms.", example: "An ECS service with a canary configuration.", synonyms: ["deploy target", "rollout configuration", "release group", "deployment target", "target configuration"], antonyms: ["manual deploy", "ad-hoc update", "direct push", "console change", "unmanaged rollout"] },
      { word: "Manual approval", meaning: "A pipeline action that pauses until a person approves the promotion.", example: "One gate between staging and production.", synonyms: ["human gate", "sign-off step", "approval action", "release gate", "approval checkpoint"], antonyms: ["fully automatic promotion", "unattended release", "continuous deployment", "no gate", "auto-promote"] },
      { word: "Self-mutating pipeline", meaning: "A pipeline that updates its own definition when that definition changes.", example: "A CDK pipeline adding a new stage on merge.", synonyms: ["self-updating pipeline", "pipeline as code", "bootstrapped pipeline", "self-reconfiguring workflow", "automated pipeline update"], antonyms: ["hand-edited pipeline", "console-configured pipeline", "static definition", "manual reconfiguration", "drifted pipeline"] },
      { word: "Build cache", meaning: "Work preserved between builds so the next run does less.", example: "~/.npm and .next/cache in CodeBuild.", synonyms: ["dependency cache", "compilation cache", "warm cache", "incremental store", "reusable build state"], antonyms: ["cold build", "clean checkout", "full recompile", "uncached build", "empty cache"] },
    ],
    useCase: {
      scenario: "A Next.js storefront is deployed by an engineer running a build on a laptop and pushing an image tagged latest, then updating the ECS service by hand. Staging and production run different builds, rollbacks mean rebuilding an old commit under pressure, and the AWS credentials live in a shared password manager.",
      example: "CodePipeline takes over: CodeBuild installs with CodeArtifact, runs lint and tests, builds one image tagged with the commit SHA and resolves its digest, caching ~/.npm and .next/cache. Staging deploys automatically; production waits on one manual approval, then CodeDeploy shifts 10% of traffic with the 5xx and p99 alarms armed. Configuration comes from Parameter Store, the pipeline assumes a deploy role per account, and a CDK stage produces a reviewed change set for infrastructure.",
      usage: "Production runs the artefact staging tested, a bad release reverses itself within minutes of the alarm, and no human holds a production credential.",
    },
    exercise: "- Write a buildspec that tests, builds and pushes one image tagged with the commit SHA, and caches .next/cache\n- Resolve the image digest and pass it forward in imagedefinitions.json\n- Configure a canary CodeDeploy deployment with two alarms wired to automatic rollback, then break it deliberately\n- Move one environment value out of the image into Parameter Store and prove the same image runs in both environments",
    checkpoint: "- Why must the pipeline build the artefact once rather than per environment?\n- What does referencing an image by digest guarantee that a tag does not?\n- Where does the single manual approval belong, and why there?",
    mistake: "- Do not rebuild per environment; production then runs code no environment tested\n- Do not bake environment configuration into the image; read it at startup instead\n- Do not give the build environment production credentials — it runs code from pull requests",
    interview: [
      {
        question: "Walk through deploying a Next.js application to production using AWS CI/CD services.",
        definition: "One pipeline builds a single immutable artefact, promotes it through environments, and deploys it as a reversible traffic shift.",
        answer: "CodePipeline triggers on a commit. CodeBuild installs dependencies (with CodeArtifact for private packages), runs lint and tests, runs next build, then builds a container image tagged with the commit SHA, pushes it to ECR and resolves its digest into imagedefinitions.json. Infrastructure changes travel in the same pipeline through a CDK or CloudFormation stage whose change set is reviewed. Staging deploys automatically; a single manual approval gates production, where CodeDeploy shifts traffic in a canary with CloudWatch alarms armed for automatic rollback. Runtime configuration comes from Parameter Store and Secrets Manager so one image runs everywhere, and the pipeline assumes a per-environment deploy role rather than holding long-lived credentials.",
        similar: [
          { question: "What changes for a static export?", answer: "The build writes to S3 and invalidates CloudFront instead of pushing an image; the build-once-promote-many rule is unchanged." },
          { question: "How do you make the build fast?", answer: "Cache ~/.npm and .next/cache in CodeBuild, and keep tests that must run before the artefact separate from slower suites that can run after." },
        ],
      },
      {
        question: "How does a deployment roll back automatically on AWS?",
        definition: "CodeDeploy shifts traffic gradually and reverts when a registered CloudWatch alarm enters ALARM during the deployment.",
        answer: "The deployment group names a configuration — canary or linear — and a set of alarms representing customer impact, typically error rate and latency, ideally alongside a Synthetics canary. During the shift CodeDeploy watches those alarms; a breach stops the rollout and returns traffic to the previous task set, which is still running, so recovery is a routing change rather than a rebuild. ECS's own deployment circuit breaker covers the other failure mode, where new tasks never become healthy. The design principle is that the previous version stays available until the new one has proven itself.",
        similar: [
          { question: "Why keep the old task set running?", answer: "Because rollback then takes seconds; rebuilding a previous commit under incident pressure takes minutes and invites mistakes." },
          { question: "What if the problem is not visible in metrics?", answer: "That is what the AppConfig flag is for: turn the behaviour off without a deployment at all." },
        ],
      },
    ],
    objectiveQuestions: [
      {
        question: "Why should a pipeline build the container image once and promote it, rather than rebuilding per environment?",
        options: ["It is faster", "Because the artefact tested in staging is then provably the artefact running in production", "Because ECR charges per build", "Because CodeBuild cannot run twice"],
        correct: 1,
        shortAnswer: "So the tested artefact is the deployed artefact",
        explanation: "Rebuilding per environment means production runs bytes no environment ever tested: a dependency could resolve differently, a base image could have moved, a build flag could differ. Building once and promoting the digest makes the chain of evidence from test to production unbroken. Speed and cost are secondary benefits.",
      },
      {
        question: "Which AWS service shifts traffic gradually to a new ECS task set and rolls back on a CloudWatch alarm?",
        options: ["AWS CodePipeline", "AWS CodeBuild", "AWS CodeDeploy", "AWS Systems Manager"],
        correct: 2,
        shortAnswer: "AWS CodeDeploy",
        explanation: "CodeDeploy owns the deployment strategy — canary, linear or blue-green — and the alarms registered with its deployment group trigger automatic rollback when they breach during the shift. CodePipeline orchestrates the stages, CodeBuild produces the artefact, and Systems Manager handles fleet operations and configuration.",
      },
      {
        question: "Where should a Next.js application's environment-specific configuration come from in this pipeline?",
        options: ["Baked into the container image at build time", "Systems Manager Parameter Store and Secrets Manager, read at startup", "A .env file committed to the repository", "Hardcoded in next.config.ts per environment"],
        correct: 1,
        shortAnswer: "Parameter Store and Secrets Manager at startup",
        explanation: "Reading configuration at runtime is what lets one image run in staging and production unchanged, which is a precondition for promoting an artefact rather than rebuilding it. Baking values in forces a rebuild per environment, and committed .env files leak secrets into every clone of the repository.",
      },
    ],
  },
];

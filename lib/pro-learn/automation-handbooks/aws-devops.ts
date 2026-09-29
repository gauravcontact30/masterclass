import { topics } from "./shared";

export const AWS_DEVOPS_TOPICS = topics({
  "Delivery foundations": [
    ["CI, delivery and deployment", "Distinguish integrating tested changes, preparing releases and automatically shipping them.", [
      "CI validates each integration with automated builds and tests.",
      "Continuous delivery keeps a releasable version ready for approval.",
      "Continuous deployment releases passing changes without a manual promotion step.",
    ]],
    ["Git branching and pull requests", "Keep changes reviewable and choose merge rules that fit the release process.", [
      "Protect release branches with required checks and code review.",
      "Keep pull requests focused so reviewers can assess their impact.",
      "Choose merge, squash or rebase rules that preserve useful history.",
    ]],
    ["Trunk-based development", "Integrate small changes frequently and use feature flags for unfinished behavior.", [
      "Merge short-lived branches into the mainline frequently.",
      "Hide incomplete paths behind flags while keeping trunk releasable.",
      "Fix a broken mainline promptly to unblock other changes.",
    ]],
    ["Build once, deploy many", "Promote the same immutable artifact through test, staging and production.", [
      "Package the release once and record its checksum or image digest.",
      "Inject environment configuration without rebuilding application code.",
      "Promote the tested artifact identity through every environment.",
    ]],
    ["Pipeline stages and quality gates", "Define which checks block promotion and how their results are recorded.", [
      "Order checks from fast feedback to expensive integration tests.",
      "Fail promotion when required tests or policy checks fail.",
      "Attach test and scan evidence to the release being approved.",
    ]],
    ["DORA delivery metrics", "Measure delivery throughput and stability with clearly defined team-specific event data.", [
      "Track release frequency and the time changes take to reach production.",
      "Record failed changes and the time needed to recover service.",
      "Use consistent event definitions to compare trends within the team.",
    ]],
    ["AWS accounts and environments", "Separate workloads and permissions so development changes cannot affect production implicitly.", [
      "Use separate AWS accounts to strengthen production isolation.",
      "Give each environment its own deployment roles and configuration.",
      "Apply account guardrails and budgets before onboarding workloads.",
    ]],
    ["Release versioning and provenance", "Trace each deployed artifact to its source revision, build inputs and approvals.", [
      "Label releases with a version and the source commit identifier.",
      "Record build tools, dependencies and artifact checksums.",
      "Retain provenance so incidents can be traced to the exact release.",
    ]],
  ],
  "Identity & pipeline security": [
    ["IAM roles and least privilege", "Give each pipeline stage only the AWS actions and resources it needs.", [
      "Scope each stage role to the specific resources it operates on.",
      "Separate build permissions from production deployment permissions.",
      "Check explicit denies and permission boundaries when access fails.",
    ]],
    ["OIDC federation for CI", "Use short-lived role credentials for supported external runners instead of long-lived access keys.", [
      "Exchange the runner's identity token for temporary AWS credentials.",
      "Restrict token subjects to trusted repositories and release branches.",
      "Validate the expected audience in the role's trust conditions.",
    ]],
    ["IAM trust policies", "Restrict which repository, branch or service can assume a deployment role.", [
      "Name the trusted service or federated identity as the principal.",
      "Constrain role assumption with conditions appropriate to the caller.",
      "Pair trust with a permissions policy for actions after assumption.",
    ]],
    ["Secrets Manager and Parameter Store", "Retrieve runtime configuration without embedding secrets in source or build artifacts.", [
      "Resolve secret values at runtime using the workload's IAM role.",
      "Choose Secrets Manager when managed secret rotation is needed.",
      "Use encrypted parameters for sensitive settings and avoid logging values.",
    ]],
    ["KMS encryption", "Control encryption and decryption access for pipeline artifacts and deployment data.", [
      "Authorize key use through both applicable IAM and key policies.",
      "Grant decrypt access only to stages that consume encrypted artifacts.",
      "Check key region and policy when encrypted artifact reads fail.",
    ]],
    ["Cross-account deployments", "Coordinate role trust, artifact access and encryption permissions across environments.", [
      "Let the pipeline assume a narrowly scoped role in the target account.",
      "Authorize artifact-bucket access for the cross-account consumer.",
      "Configure a customer managed KMS key for shared encrypted artifacts.",
    ]],
    ["Supply-chain security", "Verify dependencies, build provenance and artifact identity before release.", [
      "Pin dependencies and inspect a software bill of materials.",
      "Verify signatures and build attestations before accepting an artifact.",
      "Isolate untrusted pull-request builds from release credentials.",
    ]],
    ["Security gates and exceptions", "Make security failures actionable and record any approved exception with an expiry.", [
      "Define blocking severity thresholds and accountable finding owners.",
      "Record the reason, scope and expiry of a security exception.",
      "Recheck waived findings when the exception or dependency changes.",
    ]],
  ],
  "AWS CodePipeline": [
    ["CodePipeline stages and actions", "Connect source, build, test, approval and deployment actions through declared artifacts.", [
      "Group release actions into source, build, test and deployment stages.",
      "Use action run order to sequence work or run independent checks together.",
      "Give the pipeline role access to each integrated action provider.",
    ]],
    ["Source connections", "Connect the chosen source provider and scope repository access and triggering events.", [
      "Authorize the source provider through a supported AWS connection.",
      "Complete the provider installation before relying on the connection.",
      "Grant the pipeline permission to use only the intended connection.",
    ]],
    ["Source revisions and triggers", "Start releases from the intended branch or tag and preserve the originating commit.", [
      "Filter branch, tag or pull-request events to match the release policy.",
      "Carry the selected source revision into build and deployment metadata.",
      "Avoid overlapping trigger paths that start duplicate releases.",
    ]],
    ["Pipeline execution modes", "Understand how concurrent or queued revisions affect ordering and release safety.", [
      "SUPERSEDED lets newer executions overtake eligible older work.",
      "QUEUED preserves execution order; PARALLEL allows independent runs.",
      "Protect shared deployment targets when multiple releases can overlap.",
    ]],
    ["Input and output artifacts", "Pass versioned files between actions using the expected artifact names.", [
      "Make an action's input name match an earlier output artifact.",
      "Declare the files a build must publish for downstream consumers.",
      "Keep pipeline artifact storage encrypted and access scoped.",
    ]],
    ["Action variables", "Carry revision and build metadata between stages without hardcoding environment values.", [
      "Assign namespaces to actions that export pipeline variables.",
      "Reference exported values in downstream action configuration.",
      "Use a secret store for credentials instead of ordinary action variables.",
    ]],
    ["Manual approval actions", "Present release evidence and require a named approver before sensitive promotion.", [
      "Show the proposed revision and a link to release test evidence.",
      "Grant approval rights separately from pipeline editing rights.",
      "Stop promotion on rejection or when the approval window expires.",
    ]],
    ["Pipeline failure recovery", "Distinguish retrying an action from redeploying an artifact or reverting a release.", [
      "Inspect the failed action and its source revision before retrying.",
      "Retry transient errors only after confirming the operation is safe to repeat.",
      "Redeploy a known-good artifact when the release itself is faulty.",
    ]],
    ["Pipeline notifications", "Route actionable failure and approval events to the responsible team.", [
      "Notify owners about failed executions and pending approvals.",
      "Include the pipeline, environment and execution link in the alert.",
      "Filter routine successes to keep release notifications actionable.",
    ]],
    ["Pipeline as code", "Version the delivery workflow alongside infrastructure with reviewed changes.", [
      "Declare stages, artifact storage and service roles in version control.",
      "Review workflow changes with the same care as application changes.",
      "Parameterize account and environment values for repeatable setup.",
    ]],
  ],
  "AWS CodeBuild": [
    ["CodeBuild projects", "Configure build environments, roles, source and outputs for reproducible jobs.", [
      "Select the source, compute environment and service role for a build.",
      "Set timeouts and resource sizes to bound failed or stalled jobs.",
      "Configure output artifacts and reports before wiring downstream stages.",
    ]],
    ["buildspec.yml", "Define install, pre-build, build and post-build phases with clear failure behavior.", [
      "Use buildspec version 0.2 for commands that share shell state.",
      "Organize setup, compilation and publishing into named build phases.",
      "Declare report files and artifact paths alongside build commands.",
    ]],
    ["Build environment images", "Choose maintained toolchains and pin the inputs that affect build output.", [
      "Select an image with the required language runtimes and system tools.",
      "Pin custom build images by digest for reproducible toolchains.",
      "Schedule image updates so security fixes do not silently change releases.",
    ]],
    ["Environment variables and secrets", "Separate non-sensitive settings from securely resolved credentials.", [
      "Keep ordinary build options separate from secret references.",
      "Scope secret retrieval and KMS permissions to the build role.",
      "Prevent shell tracing and diagnostic output from exposing credentials.",
    ]],
    ["Build caches", "Cache dependencies with keys that invalidate when relevant inputs change.", [
      "Cache reusable dependencies rather than final release outputs.",
      "Include lockfile and toolchain changes in cache invalidation keys.",
      "Keep builds correct when the cache is cold, stale or unavailable.",
    ]],
    ["Test reports and coverage", "Publish machine-readable test results and gate releases on meaningful checks.", [
      "Write test results in a report format CodeBuild supports.",
      "Publish coverage files to a configured report group.",
      "Make test and coverage thresholds fail the build explicitly.",
    ]],
    ["Docker builds in CodeBuild", "Use the required build capabilities deliberately and avoid exposing unnecessary daemon privileges.", [
      "Enable privileged mode only when the chosen Docker build requires it.",
      "Authenticate to ECR with temporary credentials before pushing an image.",
      "Tag the output with its revision and record the resulting image digest.",
    ]],
    ["VPC build networking", "Provide the connectivity required for package downloads and private dependencies.", [
      "Choose subnets and security groups that reach private build dependencies.",
      "Provide NAT or suitable endpoints for required outbound services.",
      "Check DNS, routing and role permissions when a VPC build cannot connect.",
    ]],
    ["Batch and parallel builds", "Split independent build tasks while controlling aggregate resource use and cost.", [
      "Use a build matrix or graph to split independent build variants.",
      "Limit concurrency to fit account capacity and budget.",
      "Combine child-build results before publishing the release output.",
    ]],
    ["Build logs and debugging", "Diagnose phase failures without printing tokens, passwords or private payloads.", [
      "Locate the first failing command in the relevant build phase.",
      "Correlate logs with the build ID, source commit and environment image.",
      "Reproduce with the same inputs while redacting sensitive diagnostics.",
    ]],
  ],
  "Artifacts & registries": [
    ["Amazon ECR repositories", "Store container images with scoped push and pull permissions.", [
      "Separate image repositories by application and access needs.",
      "Grant CI push rights and runtime roles pull rights independently.",
      "Use immutable release tags or digests to identify deployed images.",
    ]],
    ["ECR lifecycle policies", "Expire unneeded images while retaining versions required for rollback.", [
      "Preview lifecycle rules before expiring repository images.",
      "Retain digests referenced by active deployments and rollback releases.",
      "Expire old untagged images to reduce registry storage.",
    ]],
    ["Image scanning and promotion", "Evaluate container findings and deploy by verified image identity.", [
      "Scan the built image and evaluate findings against release policy.",
      "Record scan evidence against the exact digest being promoted.",
      "Promote approved image content without rebuilding it between stages.",
    ]],
    ["S3 artifact buckets", "Protect build outputs with encryption, access controls and lifecycle rules.", [
      "Block public access and restrict artifact access to pipeline roles.",
      "Require encrypted transport and appropriate server-side encryption.",
      "Set retention rules that preserve release evidence and rollback artifacts.",
    ]],
    ["CodeArtifact dependencies", "Manage package consumption and publishing through authenticated repositories.", [
      "Configure package clients to use the intended domain and repository.",
      "Obtain a temporary authorization token for package access.",
      "Control upstream repositories to reduce dependency substitution risk.",
    ]],
    ["Artifact signing and attestations", "Check the producer and build history before trusting a release artifact.", [
      "Sign the artifact digest so verification covers the exact content.",
      "Check the signer identity against an approved trust policy.",
      "Verify build attestations before allowing artifact promotion.",
    ]],
  ],
  "Deployment strategies": [
    ["CodeDeploy applications and groups", "Define deployment targets and their associated permissions and lifecycle settings.", [
      "Choose the compute platform when creating a CodeDeploy application.",
      "Configure a deployment group with targets and its service role.",
      "Attach health alarms and rollback settings to the deployment group.",
    ]],
    ["AppSpec and lifecycle hooks", "Describe deployment steps and run health checks at the appropriate transition points.", [
      "Describe target resources using the AppSpec format for the platform.",
      "Run validation hooks before accepting production traffic.",
      "Make lifecycle scripts repeatable and return failures explicitly.",
    ]],
    ["EC2 in-place deployments", "Replace application versions with capacity, traffic and rollback behavior accounted for.", [
      "Install the CodeDeploy agent on supported EC2 target instances.",
      "Choose a minimum healthy capacity during instance updates.",
      "Drain traffic and validate the new revision before restoring service.",
    ]],
    ["Blue-green deployments", "Prepare a replacement environment and switch traffic only after validation.", [
      "Provision a green environment alongside the serving blue environment.",
      "Test green before changing the production traffic route.",
      "Retain blue long enough to reverse the traffic switch if needed.",
    ]],
    ["Canary and linear releases", "Shift traffic gradually while watching error, latency and business signals.", [
      "Canary sends a small initial share before shifting remaining traffic.",
      "Linear increases the new version's traffic in regular increments.",
      "Pause or reverse rollout when monitored health thresholds fail.",
    ]],
    ["ECS services and task definitions", "Deploy a container revision with explicit image, environment and resource settings.", [
      "Register a task definition revision with image and resource settings.",
      "Separate the application task role from the task execution role.",
      "Update the service and verify desired tasks become healthy.",
    ]],
    ["ECS Fargate delivery", "Promote an ECR image to a managed task runtime and verify load-balancer health.", [
      "Push the container image to ECR before updating the Fargate service.",
      "Configure task networking, execution permissions and supported resources.",
      "Wait for healthy tasks and target registration before declaring success.",
    ]],
    ["ECS blue-green pipeline", "Coordinate task definitions, target groups and deployment artifacts for controlled traffic switching.", [
      "Provide task definition, AppSpec and image artifacts for the deployment.",
      "Configure the CodeDeploy controller with two load-balancer target groups.",
      "Validate the replacement task set before production traffic is shifted.",
    ]],
    ["Lambda versions and aliases", "Separate immutable function revisions from the traffic-facing alias.", [
      "Publish an immutable Lambda version for each release candidate.",
      "Point the production alias at the approved published version.",
      "Move the alias back to a retained version for code rollback.",
    ]],
    ["Lambda gradual deployments", "Use staged traffic shifts and alarms to reduce the impact of a faulty function release.", [
      "Use an alias to direct traffic between published function versions.",
      "Choose a supported canary or linear deployment configuration.",
      "Attach alarms and validation hooks before increasing function traffic.",
    ]],
    ["EKS and Kubernetes delivery", "Apply versioned workloads with rollout checks, namespace isolation and rollback planning.", [
      "Version manifests or Helm values together with container image identity.",
      "Check readiness probes, rollout status and available cluster capacity.",
      "Retain prior workload revisions and account for stateful dependencies.",
    ]],
    ["Database migrations in CI/CD", "Use backward-compatible schema changes so old and new application versions can overlap.", [
      "Expand the schema before deploying code that depends on new fields.",
      "Keep migrations compatible while old and new application versions coexist.",
      "Remove obsolete columns only after migration and rollback windows close.",
    ]],
  ],
  "Infrastructure as code": [
    ["CloudFormation stacks", "Manage infrastructure resources with versioned templates and explicit stack boundaries.", [
      "Declare related AWS resources in a template with a clear stack boundary.",
      "Use parameters and outputs to connect environment-specific values.",
      "Protect important stateful resources with deliberate deletion policies.",
    ]],
    ["CloudFormation change sets", "Review proposed replacements and permission changes before applying a stack update.", [
      "Create a change set to inspect additions, updates and replacements.",
      "Review identity changes and any resource marked for replacement.",
      "Execute only after assessing data retention and dependent resources.",
    ]],
    ["AWS CDK", "Generate CloudFormation from reviewed application code and test synthesized infrastructure.", [
      "Model infrastructure with constructs in a supported programming language.",
      "Synthesize templates and inspect the CDK diff before deployment.",
      "Bootstrap target environments and test critical synthesized properties.",
    ]],
    ["Terraform on AWS", "Manage declarative infrastructure with controlled providers, state and locking.", [
      "Pin provider versions and commit the dependency lockfile.",
      "Review the saved plan before applying AWS resource changes.",
      "Protect remote state and serialize writers with supported state locking.",
    ]],
    ["Remote state and drift", "Protect state files and detect manual changes that diverge from declared infrastructure.", [
      "Encrypt state and limit access because it may contain sensitive values.",
      "Detect out-of-band resource changes before the next infrastructure update.",
      "Reconcile drift deliberately rather than overwriting unexplained changes.",
    ]],
    ["Infrastructure testing", "Check policies, templates and deployed behavior before promoting environment changes.", [
      "Validate templates and reject unsafe IAM or network policies.",
      "Assert critical infrastructure properties before deploying a test stack.",
      "Exercise deployed endpoints and clean up temporary test resources.",
    ]],
    ["GitOps workflows", "Reconcile reviewed desired state while retaining clear ownership of production changes.", [
      "Store the desired deployment state in a reviewed Git repository.",
      "Let a reconciler compare declared state with the running environment.",
      "Resolve emergency manual changes back into Git to prevent drift.",
    ]],
    ["Ephemeral environments", "Create temporary review stacks with automated expiry and cost controls.", [
      "Create a separate review stack for a branch or pull request.",
      "Use isolated test data and scoped access for preview deployments.",
      "Tag stacks with owners and expiry times, then automate teardown.",
    ]],
  ],
  "Observability & recovery": [
    ["CloudWatch logs, metrics and alarms", "Collect signals that distinguish application failures from infrastructure problems.", [
      "Centralize application logs with useful request and deployment identifiers.",
      "Graph error rates, latency and saturation for the deployed workload.",
      "Define alarm periods and missing-data behavior to avoid misleading signals.",
    ]],
    ["Distributed tracing", "Follow a request across services to identify the source of latency and errors.", [
      "Propagate trace context across incoming and outgoing service calls.",
      "Use spans to locate slow operations and downstream failures.",
      "Balance sampling cost with enough traces to diagnose release regressions.",
    ]],
    ["CloudTrail deployment auditing", "Trace control-plane actions back to the actor and assumed role.", [
      "Find API events around the time a deployment changed resources.",
      "Inspect the assumed-role identity and session behind each change.",
      "Retain audit trails in access-controlled storage for investigation.",
    ]],
    ["EventBridge automation", "React to deployment and operational events with deduplication and bounded recovery actions.", [
      "Match deployment events with a narrowly scoped event pattern.",
      "Make targets idempotent because events can be delivered more than once.",
      "Configure retries and a dead-letter queue for failed event handling.",
    ]],
    ["Automatic rollback", "Tie release reversal to tested health criteria and a known-good artifact.", [
      "Define release health criteria before enabling automatic reversal.",
      "Keep the previous artifact available and verify the reversal path.",
      "Account for database and external side effects that code rollback cannot undo.",
    ]],
    ["SLOs and error budgets", "Define acceptable reliability and use observed failure rates to guide release decisions.", [
      "Choose user-facing reliability indicators and a measurement window.",
      "Calculate the allowed unreliability from the service objective.",
      "Use error-budget consumption to guide rollout pace and reliability work.",
    ]],
    ["Incident response and runbooks", "Provide verifiable diagnosis and recovery steps with clear escalation ownership.", [
      "Document symptoms, diagnostic queries and verified recovery commands.",
      "Assign an incident owner and a clear escalation route.",
      "Capture the incident timeline and turn findings into follow-up work.",
    ]],
    ["Backup and disaster recovery", "Test restore procedures against recovery time and data-loss objectives.", [
      "Define recovery time and acceptable data-loss objectives for each workload.",
      "Store backups with access separation appropriate to the failure scenario.",
      "Run restore drills and measure whether the recovered service meets objectives.",
    ]],
    ["Deployment cost controls", "Track build minutes, artifact storage and idle environments with ownership and budgets.", [
      "Track build duration, registry storage and temporary environment spend.",
      "Tag release resources so costs can be attributed to a team.",
      "Set budgets and remove idle deployment capacity after validation.",
    ]],
    ["End-to-end AWS CI/CD project", "Build, test and scan a container, push to ECR, deploy to ECS and demonstrate a safe rollback.", [
      "Connect source changes to CodeBuild tests and container image scanning.",
      "Publish a versioned ECR image and deploy it through an ECS release stage.",
      "Demonstrate an alarm-triggered rollback and retain the release evidence.",
    ]],
  ],
});

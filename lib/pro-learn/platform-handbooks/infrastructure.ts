import { defineHandbook } from "./shared";

/**
 * Infrastructure and delivery.
 *
 * The DevOps handbook under `automation-handbooks/aws-devops.ts` covers the
 * AWS-managed pipeline services; these three are the portable tools a team
 * carries between clouds, so they are taught on their own terms rather than as
 * a step inside someone else's pipeline.
 */
export const INFRASTRUCTURE_HANDBOOKS = [
  defineHandbook("Terraform", "Configuration language, providers, state, modules, plans and safe change management.", "https://developer.hashicorp.com/terraform/docs", {
    mechanism: "Terraform compares three things: the configuration you wrote, the state file recording what it last created, and the real infrastructure. A plan is that comparison; apply performs only the difference it found.",
    example: "Renaming a resource in configuration reads as destroy-and-create, because state keys on the address rather than the name. A moved block, or a state move, tells Terraform the address changed so the plan becomes a no-op.",
    pitfall: "State holds secrets in plain text and must never sit in version control. Two applies against the same unlocked remote state can also corrupt it, so locking is a requirement rather than a refinement.",
  }, {
    "Language fundamentals": [
      ["Providers", "Declare and pin the providers a configuration requires.", [
        "A provider is the plugin that translates configuration into API calls.",
        "Pin a version range so a provider release cannot change tomorrow's plan.",
        "Alias a provider when one configuration spans two regions or accounts.",
      ]],
      ["Resources", "Describe a piece of infrastructure and let Terraform reconcile it.", [
        "A resource block names a type and a local name that together form its address.",
        "Arguments describe the wanted end state, not the steps to reach it.",
        "Some arguments force replacement when changed, which the plan marks explicitly.",
      ]],
      ["Variables and validation", "Parameterize a configuration and reject invalid input early.", [
        "Typed variables reject a wrong shape before any API call is made.",
        "A validation block turns a business rule into a plan-time error message.",
        "Mark a variable sensitive so its value is redacted from plan output.",
      ]],
      ["Outputs", "Expose values other configurations or operators need.", [
        "An output publishes a computed value such as an endpoint or an ARN.",
        "Root outputs are what a pipeline reads after an apply finishes.",
        "Marking an output sensitive keeps it out of logs but not out of state.",
      ]],
      ["Locals and expressions", "Name intermediate values instead of repeating an expression.", [
        "A local is computed once and reused, unlike a variable supplied from outside.",
        "Expressions cover conditionals, for comprehensions and string templates.",
        "Naming a repeated expression once keeps a rename to a single edit.",
      ]],
      ["Data sources", "Read something Terraform does not manage without adopting it.", [
        "A data source reads existing infrastructure without taking ownership of it.",
        "It refreshes on every plan, so a changed upstream value shows as a diff.",
        "Use one to look up an AMI, a zone or a network another team owns.",
      ]],
    ],
    "State": [
      ["State purpose", "Understand why Terraform records what it created and what breaks without it.", [
        "State maps each configuration address to a real remote object id.",
        "Without it Terraform cannot tell a create apart from an update.",
        "It also caches attribute values so a plan need not read everything again.",
      ]],
      ["Remote backends", "Store state centrally so a team shares one source of truth.", [
        "A remote backend puts state where every machine and pipeline reads the same copy.",
        "Backends add locking, versioning and encryption that a local file has not.",
        "Initialising a new backend migrates the existing state rather than discarding it.",
      ]],
      ["State locking", "Prevent two concurrent applies from corrupting shared state.", [
        "A lock is taken for the duration of a plan or an apply and released after.",
        "Two unlocked applies can interleave writes and leave state describing neither.",
        "A stale lock from a crashed run is cleared deliberately, never automatically.",
      ]],
      ["Workspaces", "Keep separate state per environment from one configuration.", [
        "Each workspace carries its own state under the same configuration directory.",
        "They suit environments that differ only in variable values, not in shape.",
        "Separate directories or backends scale better once environments truly diverge.",
      ]],
      ["Import", "Bring existing infrastructure under management without recreating it.", [
        "An import block adopts a live object into state at a chosen address.",
        "The configuration must already describe the object or the next plan wants changes.",
        "Import writes state only; it never creates or modifies the real resource.",
      ]],
      ["State surgery", "Move or remove state entries deliberately, and know the risk.", [
        "Moving an entry rewrites an address without touching live infrastructure.",
        "Removing an entry makes Terraform forget a resource that keeps on running.",
        "Take a state backup first, because these commands have no undo.",
      ]],
    ],
    "Modules & composition": [
      ["Module structure", "Package a reusable unit with clear inputs and outputs.", [
        "A module is a directory of configuration with declared inputs and outputs.",
        "Keep provider configuration in the root and pass it down rather than nesting it.",
        "A module with dozens of inputs is usually two modules that have not been split.",
      ]],
      ["Module sources and versions", "Pin a module version so a plan does not change beneath you.", [
        "A source can be a local path, a registry entry or a git reference.",
        "Pin registry modules to an exact version so plans stay reproducible.",
        "A git source without a tag or commit re-resolves and can shift under you.",
      ]],
      ["Composition over inheritance", "Build environments by composing modules rather than branching inside one.", [
        "Environments differ by the arguments passed in, not by conditionals inside.",
        "A root configuration per environment stays readable as the estate grows.",
        "Branching inside one module makes every environment share one blast radius.",
      ]],
      ["count and for_each", "Create many similar resources and understand how each key maps to state.", [
        "count keys instances by index, so removing the middle one reshuffles the rest.",
        "for_each keys by a map or set member, so each instance has a stable identity.",
        "Prefer for_each whenever the collection can change in the middle.",
      ]],
      ["Dynamic blocks", "Generate repeated nested blocks from a collection.", [
        "A dynamic block expands a collection into repeated nested blocks.",
        "Use it for rule lists such as security group ingress, not for whole resources.",
        "Overusing it hides the shape of the configuration from anyone reading a diff.",
      ]],
      ["Dependency ordering", "Rely on implicit references and reach for depends_on only when required.", [
        "Referencing another resource's attribute creates the dependency automatically.",
        "depends_on is for ordering that no attribute reference expresses, such as IAM propagation.",
        "An unnecessary depends_on serialises work that could otherwise run in parallel.",
      ]],
    ],
    "Operating safely": [
      ["Plan review", "Read a plan as a change proposal and reject surprises before applying.", [
        "Read the counts first: create, update, destroy and replace.",
        "Any replacement of a stateful resource deserves a reason before it is approved.",
        "Save the plan to a file and apply that file, so no drift slips in between.",
      ]],
      ["Targeted applies", "Limit a change to specific addresses, and know why that is a last resort.", [
        "Targeting applies one address and skips the rest of the graph.",
        "It leaves state partly reconciled, so the next full plan may still show work.",
        "Reserve it for recovering from a failed apply, not for routine change.",
      ]],
      ["Moved and removed blocks", "Refactor addresses without destroying live infrastructure.", [
        "A moved block tells Terraform an address was renamed, not replaced.",
        "It lives in configuration, so the refactor is reviewed like any other change.",
        "A removed block drops management of a resource while leaving it running.",
      ]],
      ["Drift detection", "Find changes made outside Terraform and decide whether to adopt or revert.", [
        "A plan with no configuration change still reports what someone altered by hand.",
        "Scheduled plans surface drift before it collides with a real deployment.",
        "Decide per case whether to revert the change or write it into configuration.",
      ]],
      ["Secrets handling", "Keep credentials out of configuration and out of state where possible.", [
        "Read credentials from the environment or a secret store, never from a committed file.",
        "Values a provider returns land in state in plain text regardless of sensitivity.",
        "Encrypt the state backend and restrict who can read it as if it were the secret.",
      ]],
      ["CI pipelines", "Plan on a pull request and apply only after review on the default branch.", [
        "A pull request runs plan and posts it as the change proposal for review.",
        "Apply runs only from the default branch, with credentials no fork can reach.",
        "Apply the exact saved plan so what was reviewed is what runs.",
      ]],
    ],
  }),

  defineHandbook("Kubernetes", "Workloads, services, configuration, storage, scheduling, security and day-two operations.", "https://kubernetes.io/docs/home/", {
    mechanism: "Every object declares a desired state, and a controller works continuously to make reality match it. Nothing is imperative: a deployment does not create pods once, it keeps the requested number of healthy pods existing.",
    example: "A rolling update creates new pods, waits for each to pass its readiness probe, then removes an old one. A pod that never becomes ready stalls the rollout instead of replacing working pods with broken ones.",
    pitfall: "A liveness probe that is really a readiness check restarts a pod that is merely busy, turning slow responses into a restart loop. Readiness removes a pod from the load balancer; liveness kills it.",
  }, {
    "Core objects": [
      ["Pods", "Understand the smallest deployable unit and why you rarely create one directly.", [
        "A pod is the smallest deployable unit and shares a network namespace between its containers.",
        "Creating one directly leaves nothing to recreate it when its node disappears.",
        "Containers in a pod are co-scheduled, which is why a sidecar can reach localhost.",
      ]],
      ["Deployments", "Declare a replica count and a template, and let the controller maintain it.", [
        "A replica count and a template are declared, and a controller keeps them true.",
        "Changing the template starts a rollout rather than editing running pods.",
        "Revision history is what makes returning to the previous template possible.",
      ]],
      ["ReplicaSets", "Recognize the object a deployment manages on your behalf during rollouts.", [
        "A deployment manages replica sets on your behalf during a rollout.",
        "Two exist at once mid-rollout, which is why pod counts look wrong briefly.",
        "Editing one directly is undone by the deployment that owns it.",
      ]],
      ["StatefulSets", "Run workloads that need stable identity and ordered startup.", [
        "Workloads that need stable identity and ordered startup use this instead.",
        "Each pod keeps its name and its volume across a reschedule.",
        "Scaling down removes the highest ordinal first, which is rarely the one you meant.",
      ]],
      ["DaemonSets", "Run one pod per node for agents and collectors.", [
        "One pod runs per node, which is what agents and collectors need.",
        "New nodes get the pod automatically as they join.",
        "It scales with the cluster, so its resource requests are multiplied by node count.",
      ]],
      ["Jobs and CronJobs", "Run work that finishes, on demand or on a schedule.", [
        "Work that finishes is run once or on a schedule rather than kept alive.",
        "A job tracks completions and retries, which a deployment does not.",
        "Overlapping schedules run concurrently unless the concurrency policy forbids it.",
      ]],
    ],
    "Networking & configuration": [
      ["Services", "Give a changing set of pods one stable address.", [
        "A changing set of pods is given one stable address.",
        "Selection is by label, so membership follows the label rather than the pod name.",
        "A service with no matching endpoints resolves and then refuses the connection.",
      ]],
      ["Service types", "Choose ClusterIP, NodePort or LoadBalancer for how traffic arrives.", [
        "ClusterIP, NodePort and LoadBalancer differ in how traffic reaches the service.",
        "ClusterIP is internal only, which is what most services should be.",
        "Every LoadBalancer is usually a separate provisioned address and its own cost.",
      ]],
      ["Ingress", "Route external HTTP traffic to services by host and path.", [
        "External HTTP traffic is routed to services by host and path.",
        "One entry point serves many services rather than one address each.",
        "Ingress does nothing without a controller actually running in the cluster.",
      ]],
      ["ConfigMaps", "Supply non-secret configuration as environment variables or files.", [
        "Non-secret configuration is supplied as environment variables or mounted files.",
        "A mounted file can update in place; an environment variable cannot.",
        "Changing one does not restart the pods that already read it.",
      ]],
      ["Secrets", "Hold sensitive values with restricted access and encryption at rest.", [
        "Sensitive values are held with restricted access and encryption at rest.",
        "They are base64-encoded rather than encrypted in the manifest itself.",
        "Anyone able to create a pod in the namespace can usually read them.",
      ]],
      ["Network policies", "Restrict which pods may talk to which, instead of a flat network.", [
        "Which pods may talk to which is restricted instead of leaving the network flat.",
        "Without any policy every pod can reach every other pod.",
        "The first policy selecting a pod switches it to deny by default.",
      ]],
    ],
    "Scheduling & resources": [
      ["Requests and limits", "Reserve CPU and memory, and cap what a container may consume.", [
        "CPU and memory are reserved, and a ceiling is set on what a container may use.",
        "The request is what scheduling uses; the limit is what enforcement uses.",
        "Exceeding a memory limit kills the container; exceeding CPU only throttles it.",
      ]],
      ["Quality of service", "Understand which pods are evicted first when a node is pressured.", [
        "The class a pod falls into decides how early it is evicted under pressure.",
        "Equal requests and limits is what earns the most protected class.",
        "A pod with no requests at all is the first one evicted.",
      ]],
      ["Node selectors and affinity", "Place pods on suitable nodes deliberately.", [
        "Pods are placed on suitable nodes deliberately rather than wherever they fit.",
        "Affinity expresses preference; a selector expresses a hard requirement.",
        "A requirement no node satisfies leaves the pod pending indefinitely.",
      ]],
      ["Taints and tolerations", "Reserve nodes for workloads that explicitly accept them.", [
        "A node is reserved for workloads that explicitly accept its taint.",
        "A taint repels pods; a toleration only permits, it does not attract.",
        "Tolerating a taint without affinity does not place the pod on that node.",
      ]],
      ["Horizontal autoscaling", "Scale replicas on a metric rather than by hand.", [
        "Replicas scale on a metric rather than being set by hand.",
        "Scaling on CPU needs requests set, or there is no ratio to measure.",
        "Scaling reacts after load arrives, so a spike is served by the old count.",
      ]],
      ["Pod disruption budgets", "Keep a minimum available during voluntary disruption.", [
        "A minimum stays available through voluntary disruption such as a node drain.",
        "It constrains drains and upgrades, not crashes or node failure.",
        "A budget that cannot be satisfied blocks the drain indefinitely.",
      ]],
    ],
    "Health, storage & security": [
      ["Readiness probes", "Remove a pod from service while it cannot serve traffic.", [
        "A pod is removed from service while it cannot serve traffic.",
        "Failing readiness stops traffic without restarting the container.",
        "A rollout waits on readiness, so a wrong probe stalls the deploy.",
      ]],
      ["Liveness and startup probes", "Restart a genuinely stuck container without punishing a slow start.", [
        "A genuinely stuck container is restarted without punishing a slow start.",
        "A liveness probe used as a readiness check turns slowness into a restart loop.",
        "The startup probe is what buys a slow boot time the others will not.",
      ]],
      ["Rolling updates and rollback", "Ship gradually and return to the previous revision quickly.", [
        "Change ships gradually and the previous revision is one command away.",
        "Surge and unavailable settings decide how much capacity the rollout risks.",
        "A rollout that never becomes ready holds both revisions in place.",
      ]],
      ["Persistent volumes and claims", "Attach durable storage and understand reclaim behaviour.", [
        "Durable storage is attached through a claim rather than to a pod directly.",
        "The reclaim policy decides whether the data outlives the claim.",
        "A volume bound to one zone pins every pod using it to that zone.",
      ]],
      ["RBAC", "Grant the least privilege a workload or operator actually needs.", [
        "A workload or operator is granted the least privilege it actually needs.",
        "Roles are namespaced; cluster roles are not, which is the usual over-grant.",
        "A wildcard verb on a wildcard resource is administrative access by another name.",
      ]],
      ["Security context", "Drop capabilities, avoid root and enforce a read-only filesystem.", [
        "Capabilities are dropped, root is avoided and the filesystem is made read-only.",
        "Running as root in a container is root on the node if anything escapes.",
        "A read-only filesystem needs writable volumes declared for the paths that need them.",
      ]],
    ],
  }),

  defineHandbook("GitHub Actions", "Workflows, triggers, jobs, runners, caching, reusability and supply-chain security.", "https://docs.github.com/en/actions", {
    mechanism: "A workflow is triggered by an event, runs jobs on runners, and each job is a fresh machine. Jobs are parallel unless one needs another, and nothing survives between jobs except what you upload as an artifact or cache.",
    example: "A pull request runs lint, typecheck and tests as parallel jobs sharing a dependency cache. A deploy job needs all three, runs only on the default branch, and draws its credentials from an environment that requires approval.",
    pitfall: "pull_request_target runs with repository secrets and the base branch's permissions. Checking out and running a fork's code under that trigger hands write-scoped secrets to an untrusted contributor.",
  }, {
    "Workflow fundamentals": [
      ["Workflow files", "Define triggers, jobs and steps in a versioned YAML file.", [
        "Triggers, jobs and steps live in a versioned YAML file beside the code.",
        "The file on the triggering ref is the one that runs, not the one on the default branch.",
        "A syntax error stops the workflow being registered rather than failing a run.",
      ]],
      ["Events and triggers", "Run on push, pull request, schedule, manual dispatch or another workflow.", [
        "A run starts from a push, a pull request, a schedule, a manual dispatch or another workflow.",
        "Each event exposes a different payload, so conditions cannot be shared blindly.",
        "A scheduled workflow only runs from the default branch.",
      ]],
      ["Jobs and steps", "Group work into jobs and sequence the commands inside each.", [
        "Work is grouped into jobs, and commands are sequenced inside each.",
        "Every job gets a fresh machine, so nothing carries across without an artifact.",
        "Steps in a job share a filesystem and a working directory.",
      ]],
      ["Runners", "Choose a hosted or self-hosted runner and the operating system.", [
        "A hosted or self-hosted runner is chosen along with its operating system.",
        "Hosted runners are discarded after the job, which is what makes them clean.",
        "Shell syntax differs per operating system, so a matrix needs portable commands.",
      ]],
      ["Expressions and contexts", "Read event, job and step data to make decisions.", [
        "Event, job and step data are read to make decisions inside the workflow.",
        "Contexts are evaluated before the shell runs, so a value can be substituted into a command.",
        "Interpolating untrusted event text into a run step is a script injection.",
      ]],
      ["Conditions", "Run a job or step only when a condition holds.", [
        "A job or step runs only when its condition holds.",
        "A step is skipped rather than failed, which keeps the job green.",
        "A condition on failure needs an explicit always or failure call to run at all.",
      ]],
    ],
    "Data & performance": [
      ["Dependency caching", "Restore a cache by a lockfile-derived key and save it on miss.", [
        "A cache is restored by a key derived from the lockfile and saved on a miss.",
        "A key that never changes restores a cache that is never refreshed.",
        "Cache restore is best effort, so the build must still work without it.",
      ]],
      ["Artifacts", "Pass build output between jobs and keep it after the run.", [
        "Build output is passed between jobs and kept after the run ends.",
        "Artifacts are how anything survives a job, since the machine does not.",
        "They have a retention period and count against storage.",
      ]],
      ["Job outputs", "Return a value from one job for a dependent job to consume.", [
        "One job returns a value for a dependent job to consume.",
        "Outputs are strings, so structured data has to be serialized.",
        "A job that is skipped produces no outputs for anything downstream.",
      ]],
      ["Matrix builds", "Run the same job across versions or platforms in parallel.", [
        "The same job runs across versions or platforms in parallel.",
        "Include and exclude adjust the generated combinations without restating them.",
        "A matrix that fails fast cancels its siblings on the first failure.",
      ]],
      ["Concurrency groups", "Cancel superseded runs so only the newest branch build continues.", [
        "A superseded run is cancelled so only the newest build on a branch continues.",
        "The group key decides what counts as superseding what.",
        "Cancelling a deploy mid-flight can leave a partial release.",
      ]],
      ["Service containers", "Run a database or broker alongside a job for integration tests.", [
        "A database or broker runs alongside the job for integration tests.",
        "They are reachable by service name from the job's steps.",
        "A job must wait for the service to be healthy, not merely started.",
      ]],
    ],
    "Reuse & environments": [
      ["Composite actions", "Package repeated steps as one action inside the repository.", [
        "Repeated steps are packaged as one action inside the repository.",
        "It keeps the steps in the same repo rather than in a shared workflow.",
        "A composite action cannot itself use a matrix.",
      ]],
      ["Reusable workflows", "Call a shared workflow with inputs and secrets.", [
        "A shared workflow is called with inputs and secrets.",
        "Secrets have to be passed explicitly or inherited; they do not flow automatically.",
        "The called workflow runs its own jobs, which is what makes it more than a step.",
      ]],
      ["Environments", "Gate a deployment behind approval and environment-scoped secrets.", [
        "A deployment is gated behind approval and environment-scoped secrets.",
        "The approval pauses the job rather than failing it.",
        "Environment secrets override repository ones for that job only.",
      ]],
      ["Deployment jobs", "Sequence build, test and deploy with explicit dependencies.", [
        "Build, test and deploy are sequenced with explicit dependencies.",
        "Without a dependency the deploy job races the tests it should follow.",
        "Restricting the deploy to the default branch is a condition, not an assumption.",
      ]],
      ["Variables and secrets", "Separate configuration from credentials at the right scope.", [
        "Configuration and credentials are separated at the scope each belongs to.",
        "A variable is readable in logs; a secret is masked.",
        "A secret is unavailable to a workflow triggered from a fork.",
      ]],
      ["Self-hosted runner isolation", "Keep untrusted code away from a persistent runner.", [
        "Untrusted code is kept away from a runner that persists between jobs.",
        "A persistent runner carries whatever the previous job left behind.",
        "A public repository with a self-hosted runner lets any fork run code on it.",
      ]],
    ],
    "Security": [
      ["GITHUB_TOKEN permissions", "Grant the minimum scope a workflow needs and default to read.", [
        "A workflow is granted the minimum scope it needs, defaulting to read.",
        "The token is issued per run and expires when the run ends.",
        "Write permission on contents is what lets a compromised step push to the repository.",
      ]],
      ["Pinning actions", "Pin third-party actions to a commit rather than a moving tag.", [
        "A third-party action is pinned to a commit rather than a moving tag.",
        "A tag can be repointed, so it is not a version, only a name.",
        "A pinned action needs a deliberate update path or it goes stale.",
      ]],
      ["pull_request_target risks", "Understand why this trigger must never run untrusted code.", [
        "This trigger runs with repository secrets and the base branch's permissions.",
        "Checking out the fork's code under it hands those secrets to a contributor.",
        "It exists for workflows that must label or comment, not build the change.",
      ]],
      ["Secret handling", "Avoid printing secrets and recognize where they can leak.", [
        "Secrets are kept out of logs and away from the places they leak.",
        "Masking covers exact matches, so a transformed secret prints in clear.",
        "A secret passed as a command argument is visible to anything reading the process list.",
      ]],
      ["OIDC to cloud providers", "Exchange a short-lived token for cloud access instead of storing keys.", [
        "A short-lived token is exchanged for cloud access instead of storing long-lived keys.",
        "There is no stored credential left to leak or rotate.",
        "The trust policy must pin the repository and ref, or any repository can assume the role.",
      ]],
      ["Dependency review", "Block a pull request that introduces a vulnerable dependency.", [
        "A pull request introducing a vulnerable dependency is blocked.",
        "The check runs on the change rather than on the whole tree.",
        "It reads the manifest, so a dependency pulled in at runtime is invisible to it.",
      ]],
    ],
  }),
];

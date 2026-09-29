import type { TechnologyEssentials } from "./types";

/** Infrastructure, delivery, authentication, payments and architecture. */
export const PLATFORM_ESSENTIALS: TechnologyEssentials[] = [
  {
    technologies: ["AWS"],
    points: [
      "Everything is an API behind an IAM policy. Access is denied by default, and 'AccessDenied' is usually a missing permission on a resource you did not realise was involved.",
      "Regions are separate deployments of the service, and data does not move between them for free. Latency, cost and compliance all follow from the region choice.",
      "Charges come from three places: what you store, what you transfer, and what you run. Egress is the one people forget, and it is often the largest line.",
      "Managed does not mean unlimited. Every service has quotas, and the realistic capacity question is which quota you hit first.",
      "Design for failure of one availability zone. Multi-AZ is the baseline for anything that must stay up; multi-region is a different and much larger commitment.",
    ],
  },
  {
    technologies: ["DevOps with AWS CI/CD"],
    points: [
      "Build once, deploy the same artifact everywhere. A pipeline that rebuilds per environment cannot prove that what passed staging is what reached production.",
      "The pipeline holds production credentials, which makes it a production system: it needs least-privilege roles, review and an audit trail like any other.",
      "Every deployment strategy is a trade of blast radius against speed and cost. Choose it from how you would roll back, not from how fast it ships.",
      "A rollback that has never been run is a plan, not a capability. Rehearse it while nothing is broken.",
      "Prefer short-lived credentials from a trust relationship over stored keys. A long-lived access key in CI is the credential most likely to leak.",
    ],
    categories: {
      "Observability & recovery": ["Alert on what users experience — error rate and latency — not on CPU. A healthy instance serving errors is the case that matters."],
      "Infrastructure as code": ["If a human changed it in the console, the code is now wrong. Drift detection is how you find out before the next apply does."],
    },
  },
  {
    technologies: ["Kubernetes"],
    points: [
      "You declare the desired state and controllers work towards it continuously. Nothing is imperative, which is why a manual fix gets reverted by the thing that owns the resource.",
      "A pod is disposable and its IP is temporary. Anything that needs a stable address talks to a Service, never to a pod.",
      "Requests decide scheduling, limits decide throttling and killing. Omitting requests is how a cluster becomes unpredictable under load.",
      "Liveness and readiness probes answer different questions — restart me, versus do not send me traffic yet. Using the same endpoint for both causes restart loops during slow startup.",
      "ConfigMaps and Secrets are mounted or injected at pod start, so changing one does not change a running pod until it is rolled.",
    ],
    categories: {
      "Scheduling & resources": ["A pod with no limits can starve its neighbours; a memory limit that is too low gets it killed with an OOM status and no log line."],
      "Health, storage & security": ["Secrets are base64-encoded, not encrypted, unless encryption at rest is configured. That surprises people once.", "Container storage disappears with the pod. Persistence needs a volume with a lifecycle of its own."],
      "Networking & configuration": ["Services load-balance to whatever matches the selector — including a pod from a different deployment with the same labels."],
    },
  },
  {
    technologies: ["Docker"],
    points: [
      "An image is layers, and each instruction is a layer keyed on the previous one. Instruction order decides rebuild time far more than Dockerfile length does.",
      "A container is one process with its own namespaces, not a small virtual machine. It shares the host kernel, which is why a Linux image cannot run a Windows binary.",
      "The build context is uploaded to the builder. A missing `.dockerignore` sends `node_modules` and `.git` on every build and slows everything down.",
      "The filesystem is ephemeral. Anything that must outlive the container needs a volume, and 'it works because the container has not restarted yet' is not persistence.",
      "Run as a non-root user and pin base images by digest. `latest` means whatever was pushed most recently, which makes a build non-reproducible by design.",
    ],
    categories: {
      "Dockerfile design": ["Multi-stage builds keep compilers out of the runtime image, which cuts both size and attack surface.", "Copy dependency manifests and install before copying source, so a code change does not reinstall the world."],
      "Security & operations": ["A secret passed as a build argument is recorded in the image history. Use a build secret mount instead."],
      "Storage & networking": ["Containers on the same user-defined network reach each other by name; on the default bridge they do not."],
    },
  },
  {
    technologies: ["Terraform"],
    points: [
      "State is the source of truth about what exists, so whoever holds the state file holds the infrastructure. Remote state with locking is the first thing to set up, not the last.",
      "The plan is the review artifact. Reading it — particularly every 'destroy' and 'replace' line — is the safety mechanism the tool provides.",
      "Configuration is declarative and evaluated as a graph, so resource order comes from references, not from where you wrote something in the file.",
      "Changing an immutable attribute replaces the resource. For a database or a volume, that is data loss dressed up as an update.",
      "Secrets in state are stored in plain text. Encrypt the backend and keep secrets in a secret manager referenced at apply time.",
    ],
    categories: {
      "State": ["Two applies at once without locking corrupt state. Recovery is manual and unpleasant."],
      "Operating safely": ["`import` adopts an existing resource; writing config and applying blindly creates a second one instead."],
      "Modules & composition": ["A module is an interface. Exposing every variable makes it a template, not an abstraction."],
    },
  },
  {
    technologies: ["GitHub Actions"],
    points: [
      "A workflow is triggered by an event, and the event decides what context and permissions the run gets. Most 'works on main but not on a pull request' confusion is the event, not the script.",
      "Jobs are isolated and parallel by default: separate machines, separate filesystems. Sharing anything between them needs artifacts, a cache or an output.",
      "A workflow from a fork must not receive secrets. Treating pull-request input as untrusted is the core security rule of CI.",
      "`GITHUB_TOKEN` permissions should be set explicitly and narrowly, per job, because a broad default token makes every action in the run powerful.",
      "The cache is keyed on a lockfile hash. A key that never changes serves stale dependencies forever; a key that always changes never hits.",
    ],
    categories: {
      "Security": ["Pin third-party actions to a commit SHA. A tag can be moved to different code after you reviewed it.", "Anything interpolated into a `run` block is shell input — an untrusted branch or issue title can inject commands."],
      "Reuse & environments": ["Environments carry their own secrets and can require an approval, which is how a deploy job becomes a gate."],
      "Data & performance": ["Artifacts move files between jobs; the cache speeds a job up. Using the cache to pass build output is how a run becomes flaky."],
    },
  },
  {
    technologies: ["Webhook"],
    points: [
      "A webhook is an untrusted HTTP request until the signature is verified, and verification must use the raw body — a parsed and re-serialized body will not match.",
      "Delivery is at-least-once, so handlers must be idempotent. Store the event id and ignore one you have already processed.",
      "Acknowledge fast, then work. Doing the job inside the request risks a timeout, which the sender reads as failure and retries.",
      "Events can arrive out of order. Trust a version or timestamp in the payload rather than arrival order, or fetch current state from the sender.",
      "Retries are the sender's, and they are usually exponential with a deadline. A handler that returns 500 for a permanently bad payload will be retried until that deadline for no reason.",
    ],
  },
  {
    technologies: ["Inngest services"],
    points: [
      "A function is a sequence of steps, and each step's result is durable. After a crash, completed steps are not re-run — which is what 'durable execution' means concretely.",
      "Because a step may be replayed, everything inside one must be idempotent, and anything non-deterministic belongs in its own step so its result is recorded.",
      "Waiting is free: a function can sleep for days or wait for another event without holding a process open.",
      "Concurrency, throttling and debouncing are declared on the function rather than implemented with a queue and a lock you maintain yourself.",
    ],
  },
  {
    technologies: ["Arcjet"],
    points: [
      "Decisions are made in your own application, next to the request, so a rule can use what you know about the user rather than only the IP.",
      "Rules run in dry-run mode first. Watching what they would have blocked, before blocking, is what keeps a bot rule from banning your own customers.",
      "Rate limits need a key that identifies the actor. Keying on IP alone punishes shared networks and misses distributed abuse.",
      "Layered rules are the design: bot detection, rate limiting and validation each catch a different class of abuse, and none of them is sufficient alone.",
    ],
  },
  {
    technologies: ["Payment gateway integration"],
    points: [
      "Never trust an amount or a price that came from the browser. The server decides what is being charged; the client only says what was chosen.",
      "The webhook is the source of truth for whether payment succeeded, not the redirect back to your site. A user can close the tab and still have paid.",
      "Every charge needs an idempotency key. A retried request without one is how a customer gets billed twice.",
      "Money is integer minor units. Floating-point arithmetic on currency produces discrepancies that accounting will find before you do.",
      "Handling the unhappy paths — refund, dispute, failed renewal, partial capture — is most of the real work, and each one is a state your data model must be able to represent.",
    ],
  },
  {
    technologies: ["Authentication with Auth.js & Kinde Auth"],
    points: [
      "Authentication says who someone is; authorization says what they may do. One library can answer the first while your code still owes every answer to the second.",
      "The session is the contract between the two. Whatever a page needs to make an access decision must be in it, or the page will make that decision from stale data.",
      "OAuth returns an identity, not a user record. Deciding how to link a provider identity to an existing account — safely, without allowing takeover by email claim — is the design question.",
      "Tokens belong in HTTP-only cookies. Anything reachable from JavaScript is reachable from injected JavaScript.",
      "Sign-out has to end the server session, not just clear the client. Otherwise the token keeps working until it expires.",
    ],
  },
  {
    technologies: ["BetterAuth"],
    points: [
      "Auth lives in your own database, so users, sessions and accounts are ordinary tables you can query, migrate and reason about.",
      "The plugin model is the point: passkeys, two-factor, organizations and magic links are composed onto a core rather than reimplemented per project.",
      "Sessions are server-side records. Revoking one takes effect immediately, which is the behaviour a stateless token cannot give you.",
      "Multi-tenancy is a data-model decision before it is a feature flag. Which table carries the tenant id determines every query you write afterwards.",
    ],
  },
  {
    technologies: ["Clerk user management"],
    points: [
      "Identity is hosted, so the sensitive storage and the flows around it are not yours — but every authorization check still is.",
      "The session token travels on the request and is verified at the edge of your app. Protecting a route means checking that token server-side, not hiding a link.",
      "Organizations bring roles and memberships, and the role in the session is what a permission check should read.",
      "Webhooks keep your database in step with user changes made elsewhere. Without them, a deleted user lingers in your tables.",
    ],
  },
  {
    technologies: ["System Design"],
    points: [
      "Start from requirements and numbers — users, requests per second, payload size, growth — because every later choice is a trade against those numbers and is unjustifiable without them.",
      "State is what makes a system hard. Stateless services scale by adding copies; the database, the cache and the queue are where the real design lives.",
      "You cannot have consistency, availability and partition tolerance at once, and partitions are not optional. The real question is which of the first two you give up, and where.",
      "Caching, replication and queues all trade freshness for capacity. Say out loud how stale a read may be, because the answer differs per feature.",
      "Design the failure behaviour: what happens when a dependency is slow, not just when it is down. Timeouts, retries with backoff, and a bounded queue are the difference between degradation and collapse.",
    ],
    categories: {
      "Scaling & performance": ["Measure percentiles, not averages. The p99 is what a user with a full cart experiences."],
      "Distributed systems": ["A retry without idempotency turns one failure into several writes."],
      "Reliability & operations": ["An SLO is a decision about how much unreliability is acceptable, which makes it a product decision, not a technical one."],
      "Data": ["Pick the access pattern first, then the storage. A schema designed without the queries is a schema you will migrate."],
    },
  },
  {
    technologies: ["Modern Full-Stack Technologies — Tools, Data & Infrastructure"],
    points: [
      "Every tool here exists to remove a specific failure, and adopting one you do not need adds a dependency without removing anything.",
      "Boundaries are where bugs live: between client and server, between application and database, between your code and a third party. Most of this stack is about making one boundary explicit.",
      "Prefer the platform's own capability before a library, and a library before a service. Each step outward adds an operational responsibility.",
      "Anything that runs in production needs three answers ready: how it is configured, how you know it is healthy, and how you undo a change to it.",
    ],
  },
  {
    technologies: ["Git — Commands, Branching, Rebase & History"],
    points: [
      "Almost nothing in Git is destroyed. Commits you reset or rebase away stay reachable through `git reflog` for weeks, which is why a bad command is usually recoverable.",
      "The exception is uncommitted work: `git reset --hard`, `git checkout -- <file>` and `git clean` delete it with no record anywhere. Stash first.",
      "A commit's hash covers its parent, so rewriting any commit changes every hash after it — which is the whole reason rewriting shared history causes trouble.",
    ],
    categories: {
      "Getting started": [
        "Staging is a separate step so one messy working tree can become several clean commits; `git add -p` is what makes that practical.",
        "`git commit -am` never includes new untracked files, which is the usual reason a branch builds locally and fails in CI.",
      ],
      "Branching & merging": [
        "A branch is a file holding one commit hash, which is why creating and deleting branches costs nothing however large the repository.",
        "Git merges text, not meaning: a merge with no conflicts can still be wrong when one side renamed what the other side called.",
      ],
      "Rebase & cherry-pick": [
        "Rebase and cherry-pick both copy commits rather than moving them — every replayed commit is a new object with a new hash.",
        "Rebase only what nobody else has pulled. The rule is about who has the commits, not about whether rebasing is good.",
      ],
      "Remotes & collaboration": [
        "`origin/main` is your last view of the server, not the server. Fetch updates that view; only merge or rebase moves your branch.",
        "`--force-with-lease` refuses to overwrite a remote branch that moved since you fetched; plain `--force` never checks.",
      ],
      "Undoing & recovering": [
        "The three resets differ in how far they reach: `--soft` moves the branch, `--mixed` also resets the index, `--hard` also resets the working tree.",
        "Revert for anything already pushed, reset for anything still local: revert adds history, reset rewrites it.",
      ],
      "Inspecting history": [
        "`git log -S \"text\"` finds the commit where a string appeared or disappeared, which is how you locate when behaviour changed.",
        "Blame reports the last change to a line, not the decision behind it; `-w` and a `.git-blame-ignore-revs` file remove most of the noise.",
      ],
      "How Git works": [
        "Four object types — blob, tree, commit, tag — each named by the hash of its own content, with branches as one-line files pointing at commits.",
        "Identical content is stored once, so history is not a copy per commit; but a large file committed once is in the history permanently.",
      ],
    },
  },
];

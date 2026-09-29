import { topics } from "./shared";

export const DOCKER_TOPICS = topics({
  "Container foundations": [
    ["Containers vs virtual machines", "Distinguish process isolation from a separate guest kernel and operating system.", [
        "A container is an isolated process on the host kernel, not a machine with a kernel of its own.",
        "Sharing the kernel is what makes start-up a process spawn rather than a boot.",
        "It also means a container cannot run a different kernel from the host.",
      ]],
    ["Docker architecture", "Understand the client, daemon, registry and container runtime responsibilities.", [
        "The client talks to a daemon, which pulls from registries and hands work to a runtime.",
        "The client is thin, so the machine running the daemon is where the work happens.",
        "Anything able to reach the daemon controls every container on that host.",
      ]],
    ["Images, containers and layers", "Separate immutable image content from a running container's writable state.", [
        "An image is immutable layers; a container adds one writable layer over them.",
        "Deleting the container discards that writable layer and everything only it held.",
        "Layers are shared between images, so a second image from the same base costs little.",
      ]],
    ["Docker Desktop and Engine", "Choose a supported local or server installation and understand the host environment.", [
        "Desktop runs a virtual machine; Engine runs natively on a Linux host.",
        "The virtual machine is why file mounts and networking behave differently on a laptop.",
        "Desktop's licensing and its resource limits are set outside the project.",
      ]],
    ["Image tags and digests", "Use tags for human labels and digests when an exact immutable image is required.", [
        "A tag is a movable label; a digest names exactly one image forever.",
        "Deploying by tag means the image can change under an unchanged manifest.",
        "A digest is what makes a rollback land on the artifact that was actually tested.",
      ]],
    ["Container lifecycle", "Create, start, stop and remove containers without confusing them with images or volumes.", [
        "Create, start, stop and remove act on containers, not on images or volumes.",
        "A stopped container still holds its writable layer until it is removed.",
        "Removing a container leaves its named volumes behind on purpose.",
      ]],
  ],
  "Docker CLI": [
    ["docker run", "Configure a container's command, environment, mounts, ports and resource limits.", [
        "One command sets the container's command, environment, mounts, ports and limits.",
        "Flags apply at creation, so changing one means replacing the container.",
        "Without a restart policy or a limit, the defaults are no restart and no ceiling.",
      ]],
    ["docker ps and inspect", "Inspect effective configuration and runtime state when a container behaves unexpectedly.", [
        "Inspect reports the effective configuration after defaults and overrides are merged.",
        "What was requested and what is running differ more often than expected.",
        "ps shows only running containers unless the all flag is given.",
      ]],
    ["docker logs and attach", "Read process output and distinguish observing logs from attaching to a live process.", [
        "Reading logs observes output; attaching connects to the live process.",
        "Attaching means a stray interrupt can signal the process itself.",
        "Only the main process's output is captured, not a child writing elsewhere.",
      ]],
    ["docker exec", "Run a diagnostic command in an existing container without turning manual changes into a deployment process.", [
        "A diagnostic command runs inside a container that is already running.",
        "Anything changed this way is lost when the container is replaced.",
        "Fixing a container by hand makes the image and the running state disagree.",
      ]],
    ["docker stop and signals", "Give the main process time to shut down cleanly before forced termination.", [
        "Stop sends a termination signal and waits before forcing the process down.",
        "A process that ignores the signal is killed once the grace period expires.",
        "The grace period must exceed the time the application needs to drain.",
      ]],
    ["docker cp and export", "Distinguish copying files and exporting a filesystem from saving an image with its metadata.", [
        "Copying files and exporting a filesystem are not the same as saving an image.",
        "An export is a flat filesystem with no layers, history or metadata.",
        "An exported filesystem cannot be run without being given a command again.",
      ]],
    ["docker save and load", "Transfer image archives for offline use while tracking the exact image version.", [
        "An image archive moves a build to a machine with no registry access.",
        "Save preserves layers and metadata, which export does not.",
        "The archive carries the digest, so what arrives is provably what left.",
      ]],
    ["Disk usage and prune", "Inspect reclaimable objects and understand deletion scope before removing data.", [
        "Reclaimable images, containers, volumes and caches are listed before anything is removed.",
        "Pruning volumes deletes data no running container is using.",
        "A dangling image may still be the one a stopped container depends on.",
      ]],
  ],
  "Dockerfile design": [
    ["FROM and base images", "Select a maintained base that supplies only the runtime your application needs.", [
        "The base supplies only the runtime the application actually needs.",
        "Every tool in the base is also in the attack surface.",
        "Pinning the base by digest is what makes the build repeatable.",
      ]],
    ["WORKDIR and COPY", "Make build paths explicit and copy only the files needed by each stage.", [
        "Build paths are explicit and each stage copies only the files it needs.",
        "Copying the whole tree early invalidates the cache on any file change.",
        "WORKDIR creates the directory, which is not the same as the path existing.",
      ]],
    ["RUN and image layers", "Combine build operations deliberately and understand their effects on caching and size.", [
        "Each instruction adds a layer, which is what caching and size are measured in.",
        "Deleting a file in a later layer does not remove it from the earlier one.",
        "Combining steps shrinks the image but coarsens what the cache can reuse.",
      ]],
    ["CMD vs ENTRYPOINT", "Separate the executable contract from default arguments and understand runtime overrides.", [
        "ENTRYPOINT is the executable contract; CMD is the default arguments.",
        "Arguments given at run replace CMD but not ENTRYPOINT.",
        "Shell form wraps the process in a shell, which stops it receiving signals.",
      ]],
    ["ARG vs ENV", "Distinguish build-time settings from runtime environment and keep secrets out of both image layers.", [
        "ARG is build-time only; ENV persists into the running container.",
        "A secret in either is readable in the image history afterwards.",
        "An ARG not consumed in a stage is unavailable in the stages after it.",
      ]],
    ["EXPOSE vs published ports", "Recognize that metadata about a port does not publish it on the host.", [
        "EXPOSE is documentation; it opens nothing on the host.",
        "Publishing at run is what actually binds a host port.",
        "Tools read EXPOSE, which is why it looks like it works.",
      ]],
    ["USER and filesystem ownership", "Run the service with the minimum required user privileges and writable paths.", [
        "The service runs with the least privilege and only the writable paths it needs.",
        "Root in the container is root on the host if isolation is broken.",
        "Switching user after copying files leaves them owned by the wrong account.",
      ]],
    ["HEALTHCHECK", "Define a useful readiness signal without creating an expensive or misleading probe.", [
        "A readiness signal is defined without making the probe expensive or misleading.",
        "A check that only proves the process is alive reports a broken service as healthy.",
        "The probe runs inside the container and its cost is paid on every interval.",
      ]],
    [".dockerignore", "Exclude secrets, local dependencies and irrelevant files from the build context.", [
        "Secrets, local dependencies and irrelevant files are kept out of the build context.",
        "The whole context is sent to the daemon before the build starts.",
        "A local environment file reaching the context can be copied into a layer.",
      ]],
    ["Multi-stage builds", "Keep compilers and build dependencies out of the final runtime image.", [
        "Compilers and build dependencies stay out of the final runtime image.",
        "Only the artifacts copied forward appear in the last stage.",
        "A secret used in an early stage is not in the final image but is in the cache.",
      ]],
  ],
  "BuildKit & Buildx": [
    ["BuildKit and build frontends", "Understand the build engine and Dockerfile frontend used by modern builds.", [
        "The modern build engine parses the Dockerfile through a versioned frontend.",
        "It builds independent stages concurrently rather than strictly top to bottom.",
        "Features like cache and secret mounts exist only on this engine.",
      ]],
    ["Build cache invalidation", "Order dependency and source steps to reuse unchanged work safely.", [
        "Dependency and source steps are ordered so unchanged work is reused.",
        "One changed layer invalidates every layer after it.",
        "Copying the lockfile before the source is what keeps installs cached.",
      ]],
    ["Cache mounts", "Speed package downloads without baking transient caches into the final image.", [
        "A package download cache is reused without being baked into the image.",
        "The mount exists during the step and leaves nothing in the layer.",
        "The cache is per builder, so a fresh CI runner starts cold.",
      ]],
    ["Build secrets and SSH mounts", "Supply build credentials without persisting them in image layers or build arguments.", [
        "Credentials are supplied to a build without persisting in layers or arguments.",
        "The secret is mounted for one step and is not in the image history.",
        "An agent forwarded over SSH is reachable for the life of that step.",
      ]],
    ["Remote cache import and export", "Share reusable layers between CI jobs while controlling cache access.", [
        "Layers are shared between CI jobs through a registry-backed cache.",
        "A shared cache turns a cold runner into a warm one.",
        "Whoever can write the cache can influence what later builds reuse.",
      ]],
    ["Buildx builders", "Choose and inspect builder instances for local and remote build workloads.", [
        "Builder instances are selected and inspected for local or remote workloads.",
        "A remote builder moves the work off the machine running the client.",
        "Each builder keeps its own cache, so switching loses the warm one.",
      ]],
    ["Multi-platform images", "Build and test images for multiple CPU architectures using explicit platform targets.", [
        "Images are built for several architectures behind one tag.",
        "The manifest list is what lets each host pull the right variant.",
        "Emulated builds are correct but far slower than native ones.",
      ]],
    ["Build contexts and named contexts", "Control which source trees and external inputs are available to a build.", [
        "Which source trees and external inputs a build may read is controlled explicitly.",
        "A named context supplies a second tree without copying it in first.",
        "Nothing outside the context is reachable, however the path is written.",
      ]],
    ["Build provenance and SBOM", "Attach traceable build and dependency information to release artifacts.", [
        "Traceable build and dependency information is attached to the artifact.",
        "Provenance records how the image was produced, not only what is in it.",
        "An attestation is only as trustworthy as the builder that signed it.",
      ]],
    ["Reproducible container builds", "Pin dependencies and base image identities and verify builds across clean environments.", [
        "Dependencies and base identities are pinned and verified from a clean environment.",
        "Timestamps and install order are the usual reasons two builds differ.",
        "Reproducibility is what makes a supply-chain claim checkable.",
      ]],
  ],
  "Storage & networking": [
    ["Named volumes", "Persist data outside a disposable container's writable layer.", [
        "Data is persisted outside the container's disposable writable layer.",
        "The volume survives the container being removed and recreated.",
        "Docker manages the location, so it is not a host path you choose.",
      ]],
    ["Bind mounts", "Map host files into a container with deliberate path and permission choices.", [
        "A host path is mapped into the container with deliberate permissions.",
        "The container sees the host's live files, not a copy of them.",
        "Mounting over a directory hides whatever the image had there.",
      ]],
    ["tmpfs mounts", "Keep suitable temporary data in memory rather than persistent storage.", [
        "Suitable temporary data is kept in memory instead of on disk.",
        "The contents disappear when the container stops, by design.",
        "It consumes host memory, so an unbounded write pressures the node.",
      ]],
    ["Volume backup and restore", "Coordinate application consistency before copying or restoring persistent files.", [
        "The application is made consistent before persistent files are copied.",
        "Copying a live database directory captures a torn state.",
        "A restore is only proven by restoring it somewhere and starting up.",
      ]],
    ["Bridge networks and DNS", "Connect containers on a user-defined network using service names.", [
        "Containers on a user-defined network reach each other by service name.",
        "The default bridge has no name resolution between containers.",
        "A name resolves to whatever holds it now, which changes on recreate.",
      ]],
    ["Port publishing", "Bind only the required host interface and distinguish host ports from container ports.", [
        "Only the required host interface is bound, and host and container ports stay distinct.",
        "Binding to all interfaces exposes the service beyond the machine.",
        "The published port is the host's; the application still listens on its own.",
      ]],
    ["Host and none networking", "Understand the isolation and platform implications of alternative network modes.", [
        "Alternative modes trade isolation for directness or remove networking entirely.",
        "Host mode shares the host's stack, so published ports become meaningless.",
        "Host mode behaves differently where the daemon runs in a virtual machine.",
      ]],
    ["Container-to-host connectivity", "Resolve host services using the supported mechanism for the deployment platform.", [
        "Reaching a service on the host uses the mechanism the platform supports.",
        "The host is not reachable as localhost from inside a container.",
        "The supported name differs between Linux and a desktop virtual machine.",
      ]],
    ["Network troubleshooting", "Trace DNS, port binding, routing and firewall behavior separately.", [
        "DNS, port binding, routing and firewall behaviour are traced separately.",
        "Confusing a resolution failure with a refused connection sends the fix the wrong way.",
        "Testing from inside the container is what tests the container's own view.",
      ]],
    ["Overlay networking", "Understand multi-host networking and its orchestration and connectivity requirements.", [
        "Containers across hosts share one network through an orchestrator.",
        "It needs a control plane, so it is not available to a plain single host.",
        "Encapsulation reduces the usable packet size, which surfaces as odd stalls.",
      ]],
  ],
  "Docker Compose": [
    ["Compose services", "Describe a multi-container application with explicit images, commands and dependencies.", [
        "A multi-container application is described with explicit images, commands and dependencies.",
        "The file is the environment, so a new machine reproduces it from one command.",
        "Compose builds a default network, which is why service names resolve.",
      ]],
    ["Compose networks and volumes", "Define persistent data and service communication as part of application configuration.", [
        "Persistent data and service communication are declared as part of the application.",
        "Naming them is what keeps a recreate from orphaning the previous data.",
        "An unnamed volume is generated fresh and is easy to lose track of.",
      ]],
    ["Compose environment interpolation", "Distinguish variable substitution from the environment passed into containers.", [
        "Substitution into the file differs from the environment given to containers.",
        "A variable used in the file is resolved before any container starts.",
        "A missing variable interpolates as empty rather than failing loudly.",
      ]],
    ["depends_on and readiness", "Wait for appropriate health conditions rather than assuming start order means readiness.", [
        "Startup waits on a health condition rather than assuming order means readiness.",
        "Started is not ready, which is what makes a dependent service crash first.",
        "Without a health condition the dependency only orders the start.",
      ]],
    ["Compose profiles", "Enable optional services for development, diagnostics or one-off tasks.", [
        "Optional services are enabled for development, diagnostics or one-off tasks.",
        "Services outside the active profile are not started at all.",
        "A dependency in an inactive profile does not start implicitly.",
      ]],
    ["Compose overrides", "Layer environment-specific configuration and inspect the final merged result.", [
        "Environment-specific configuration is layered and the merged result inspected.",
        "Later files override earlier ones, and lists and maps merge differently.",
        "Rendering the merged configuration is the only reliable way to see what runs.",
      ]],
    ["Compose secrets and configs", "Supply runtime configuration with controlled file access and no hardcoded credentials.", [
        "Runtime configuration is supplied as files with controlled access.",
        "A secret arrives as a mounted file rather than an environment variable.",
        "An environment variable is visible to anything that can inspect the container.",
      ]],
    ["Compose Watch", "Synchronize supported development changes without rebuilding the entire stack manually.", [
        "Supported development changes synchronise without rebuilding the stack by hand.",
        "It distinguishes syncing a file from rebuilding the image.",
        "A change outside the watched paths still needs a rebuild.",
      ]],
    ["Compose one-off tasks", "Run migrations or maintenance commands with explicit dependencies and cleanup.", [
        "Migrations and maintenance run with explicit dependencies and cleanup.",
        "A one-off container must be removed or it accumulates.",
        "Running a task against a service that is not ready fails intermittently.",
      ]],
    ["Compose deployment limits", "Recognize when a single-host Compose setup needs a different orchestration strategy.", [
        "A single-host Compose setup eventually needs a different orchestration strategy.",
        "It has no scheduling, no rescheduling and no multi-host placement.",
        "The same file working locally is what hides the missing production story.",
      ]],
  ],
  "Security & operations": [
    ["Rootless Docker", "Reduce daemon privilege while checking networking and filesystem constraints.", [
        "The daemon runs with reduced privilege, at some networking and filesystem cost.",
        "A container escape reaches an unprivileged user rather than root.",
        "Low-numbered ports and some storage drivers stop being available.",
      ]],
    ["Linux capabilities and seccomp", "Remove unnecessary privileges and constrain container system calls.", [
        "Unnecessary privileges are dropped and system calls constrained.",
        "Dropping all and adding back is narrower than trimming the defaults.",
        "A privileged container disables these protections entirely.",
      ]],
    ["Read-only root filesystems", "Provide only the writable mounts the application actually requires.", [
        "Only the writable mounts the application genuinely needs are provided.",
        "A read-only root stops a compromise persisting anything to the image.",
        "Temporary directories and caches must be mounted explicitly or startup fails.",
      ]],
    ["Docker socket exposure", "Treat access to the daemon as a powerful administrative capability.", [
        "Access to the daemon socket is administrative access to the host.",
        "A container given the socket can start a privileged container.",
        "Mounting it into a CI job hands that power to whatever the job runs.",
      ]],
    ["Image scanning and Docker Scout", "Inspect dependency vulnerabilities and prioritize fixes by actual exposure.", [
        "Dependency vulnerabilities are inspected and prioritised by real exposure.",
        "A vulnerability in an unreachable package is not the same risk as one in the entry path.",
        "A scan reflects the database at that moment, so a clean image can turn.",
      ]],
    ["Registry authentication", "Use scoped credentials and avoid leaving registry secrets in CI logs.", [
        "Scoped credentials are used and kept out of build logs.",
        "A push token with pull-only scope fails late rather than at login.",
        "Credentials written to the config file persist on the machine.",
      ]],
    ["CPU and memory limits", "Bound resource use and investigate out-of-memory termination separately from application exits.", [
        "Resource use is bounded, and out-of-memory kills investigated apart from application exits.",
        "Exceeding memory kills the process; exceeding CPU only throttles it.",
        "A runtime that cannot see the limit sizes its heap to the host.",
      ]],
    ["Logging drivers and rotation", "Collect logs without allowing local log files to exhaust disk capacity.", [
        "Logs are collected without local files filling the disk.",
        "The default driver grows without bound until rotation is configured.",
        "Switching driver can make the logs command stop returning anything.",
      ]],
    ["Restart policies", "Choose restart behavior that supports recovery without hiding persistent crash loops.", [
        "Restart behaviour supports recovery without concealing a crash loop.",
        "Always restarting turns a broken deploy into a quiet loop.",
        "A backoff is what stops a failing container consuming the node.",
      ]],
    ["Graceful shutdown and PID 1", "Handle signals and child processes correctly in the container's main process.", [
        "The main process handles signals and reaps its children correctly.",
        "A shell wrapper as PID 1 swallows the termination signal.",
        "Unreaped children accumulate as zombies in a long-lived container.",
      ]],
    ["CI container pipelines", "Build once, test the image, scan it and promote the same immutable artifact.", [
        "One build is tested, scanned and promoted as the same immutable artifact.",
        "Rebuilding per stage means the tested image is not the shipped one.",
        "Promotion by digest is what makes that guarantee checkable.",
      ]],
    ["Docker Swarm overview", "Recognize services, tasks and managers in Docker's native orchestration model.", [
        "Services, tasks and managers make up Docker's own orchestration model.",
        "A service declares desired state that managers reconcile, like a deployment.",
        "Its ecosystem is far smaller, which is the practical constraint.",
      ]],
  ],
});

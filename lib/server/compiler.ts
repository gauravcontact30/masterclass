import "server-only";
import { Sandbox, Snapshot } from "@vercel/sandbox";
import { HttpError } from "./http";
import { COMPILER_LIMITS, CPP_STANDARDS, JAVA_RELEASES, type CompilerRequest, type CompilerResult } from "@/lib/compiler";

/*
 * Compiles and runs a learner's Java or C++ program in a Vercel Sandbox: a fresh Firecracker microVM per run, booted
 * from a snapshot that already holds the toolchain (OpenJDK 25 and GCC), with no network, one vCPU, a short session,
 * a 10 s run limit and a 10 MB output cap. The VM is stopped as soon as the run finishes.
 *
 * The toolchain snapshot is COMPILER_SNAPSHOT_ID when set; otherwise the newest snapshot of the toolchain sandbox,
 * built here on first use (about a minute) and logged so its id can be pinned in the environment.
 */

const TOOLCHAIN_SANDBOX = "mcb-java-cpp-toolchain-v1";
const ROOT = "/vercel/sandbox";

// The newest JDK the image's repositories carry, and GCC.
const INSTALL = `set -e
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q --no-install-recommends g++ make
apt-get install -y -q --no-install-recommends openjdk-25-jdk-headless || apt-get install -y -q --no-install-recommends openjdk-21-jdk-headless
apt-get clean`;

let snapshotPromise: Promise<string> | null = null;
const toolchainLines = new Map<string, string>();

async function buildSnapshot(): Promise<string> {
  const builder = await Sandbox.create({ name: TOOLCHAIN_SANDBOX, image: "vercel/sandbox/ubuntu", persistent: false, timeout: 15 * 60_000, resources: { vcpus: 2 } });
  try {
    const install = await builder.runCommand({ cmd: "bash", args: ["-c", INSTALL], sudo: true });
    if (install.exitCode !== 0) throw new Error(`toolchain_install_failed: ${(await install.stderr()).slice(-400)}`);
    const snapshot = await builder.snapshot({ expiration: 0 });
    console.info(JSON.stringify({ event: "compiler_snapshot_built", snapshotId: snapshot.snapshotId, hint: "Set COMPILER_SNAPSHOT_ID to pin it." }));
    return snapshot.snapshotId;
  } catch (error) {
    await builder.stop().catch(() => undefined);
    throw error;
  }
}

async function findSnapshot(): Promise<string | null> {
  const snapshots = await (await Snapshot.list({ name: TOOLCHAIN_SANDBOX })).toArray();
  return snapshots.filter(snapshot => snapshot.status === "created").sort((a, b) => b.createdAt - a.createdAt)[0]?.id ?? null;
}

function toolchainSnapshot(): Promise<string> {
  const pinned = process.env.COMPILER_SNAPSHOT_ID?.trim();
  if (pinned) return Promise.resolve(pinned);
  snapshotPromise ??= (async () => (await findSnapshot().catch(() => null)) ?? await buildSnapshot())();
  // A failed build must not stick for the life of the instance.
  snapshotPromise.catch(() => { snapshotPromise = null; });
  return snapshotPromise;
}

const safeName = (name: string) => /^[A-Za-z_][\w.-]{0,79}$/.test(name) && !name.includes("..");
const quote = (value: string) => `'${value.replace(/'/g, "'\\''")}'`;

/** Validates the request: file names, sizes, one entry point, a known standard. */
function validate(request: CompilerRequest) {
  const { files, language, standard, stdin } = request;
  if (!files.length || files.length > COMPILER_LIMITS.files) throw new HttpError(400, "invalid_files");
  if (files.some(file => !safeName(file.name) || Buffer.byteLength(file.code) > COMPILER_LIMITS.fileBytes)) throw new HttpError(400, "invalid_files");
  if (files.reduce((total, file) => total + Buffer.byteLength(file.code), 0) > COMPILER_LIMITS.totalBytes) throw new HttpError(413, "request_too_large");
  if (Buffer.byteLength(stdin) > COMPILER_LIMITS.stdinBytes) throw new HttpError(413, "request_too_large");
  if (new Set(files.map(file => file.name)).size !== files.length) throw new HttpError(400, "duplicate_file");
  if (language === "java" && (!(JAVA_RELEASES as readonly string[]).includes(standard) || files.some(file => !/\.java$/.test(file.name)))) throw new HttpError(400, "invalid_files");
  if (language === "cpp" && (!(CPP_STANDARDS as readonly string[]).includes(standard) || files.some(file => !/\.(cpp|cc|cxx|h|hpp)$/.test(file.name)) || !files.some(file => /\.(cpp|cc|cxx)$/.test(file.name)))) throw new HttpError(400, "invalid_files");
}

/** The Java class to launch: the file declaring main (classic or Java 25 instance main), named after its file. */
function javaEntry(files: CompilerRequest["files"]) {
  const entry = files.find(file => /\bstatic\s+void\s+main\s*\(/.test(file.code)) ?? files.find(file => /(^|\n)\s*(public\s+)?void\s+main\s*\(/.test(file.code)) ?? files[0];
  const packageName = entry.code.match(/^\s*package\s+([\w.]+)\s*;/m)?.[1];
  const className = entry.name.replace(/\.java$/, "");
  return packageName ? `${packageName}.${className}` : className;
}

function scripts(request: CompilerRequest) {
  const { language, standard, files } = request;
  const names = files.map(file => quote(`${ROOT}/src/${file.name}`)).join(" ");
  // Output goes to files capped at 10 MB, so a runaway print loop cannot fill the disk or the response.
  const capture = `ulimit -f 10240; timeout -s KILL ${COMPILER_LIMITS.runSeconds}`;
  if (language === "java") {
    return {
      compile: `cd ${ROOT} && mkdir -p out && timeout -s KILL ${COMPILER_LIMITS.compileSeconds} javac -encoding UTF-8 --release ${standard} -Xlint:all -d out ${names} 2>&1`,
      run: `cd ${ROOT} && ${capture} java -Xss8m -Xmx512m -XX:+UseSerialGC -cp out ${quote(javaEntry(files))} < stdin.txt > stdout.txt 2> stderr.txt; echo $? > exit.txt`,
      version: "javac -version 2>&1 | head -1",
    };
  }
  const sources = files.filter(file => /\.(cpp|cc|cxx)$/.test(file.name)).map(file => quote(`${ROOT}/src/${file.name}`)).join(" ");
  return {
    compile: `cd ${ROOT} && timeout -s KILL ${COMPILER_LIMITS.compileSeconds} g++ -std=${standard} -O2 -pipe -Wall -Wextra -I src -o app ${sources} 2>&1`,
    run: `cd ${ROOT} && ${capture} ./app < stdin.txt > stdout.txt 2> stderr.txt; echo $? > exit.txt`,
    version: "g++ --version | head -1",
  };
}

const MAX_OUT = 64_000;
const clip = (text: string) => text.length > MAX_OUT ? `${text.slice(0, MAX_OUT)}\n… output truncated at ${MAX_OUT.toLocaleString("en-IN")} characters` : text;

export async function compileAndRun(request: CompilerRequest): Promise<CompilerResult> {
  validate(request);
  const started = Date.now();
  const snapshotId = await toolchainSnapshot().catch(error => {
    console.error(JSON.stringify({ event: "compiler_toolchain_failed", message: String(error).slice(0, 300) }));
    throw new HttpError(503, "compiler_unavailable");
  });
  const sandbox = await Sandbox.create({ source: { type: "snapshot", snapshotId }, persistent: false, networkPolicy: "deny-all", resources: { vcpus: 1 }, timeout: 90_000 })
    .catch(error => { console.error(JSON.stringify({ event: "compiler_sandbox_failed", message: String(error).slice(0, 300) })); throw new HttpError(503, "compiler_unavailable"); });
  try {
    const plan = scripts(request);
    await sandbox.writeFiles([
      ...request.files.map(file => ({ path: `src/${file.name}`, content: Buffer.from(file.code) })),
      { path: "stdin.txt", content: Buffer.from(request.stdin) },
    ]);
    const known = toolchainLines.get(request.language);
    const [compiled, version] = await Promise.all([
      sandbox.runCommand("bash", ["-c", plan.compile]),
      known ? Promise.resolve(null) : sandbox.runCommand("bash", ["-c", plan.version]),
    ]);
    const toolchain = known ?? (await version?.stdout() ?? "").trim();
    if (!known && toolchain) toolchainLines.set(request.language, toolchain);
    const compileOutput = clip(await compiled.stdout());
    if (compiled.exitCode !== 0) {
      return { phase: "compile", ok: false, compileOutput: compileOutput || `Compilation stopped (exit ${compiled.exitCode}).`, stdout: "", stderr: "", exitCode: compiled.exitCode, timedOut: compiled.exitCode === 137, durationMs: Date.now() - started, toolchain };
    }
    await sandbox.runCommand("bash", ["-c", plan.run]);
    const read = async (path: string) => (await sandbox.readFileToBuffer({ path }))?.toString("utf8") ?? "";
    const [stdout, stderr, exit] = await Promise.all([read("stdout.txt"), read("stderr.txt"), read("exit.txt")]);
    const exitCode = Number.parseInt(exit.trim(), 10);
    const timedOut = exitCode === 137;
    return {
      phase: "run", ok: exitCode === 0, compileOutput, stdout: clip(stdout), stderr: clip(timedOut ? `${stderr}\nStopped: the program ran longer than ${COMPILER_LIMITS.runSeconds} seconds.` : stderr),
      exitCode: Number.isFinite(exitCode) ? exitCode : null, timedOut, durationMs: Date.now() - started, toolchain,
    };
  } finally {
    await sandbox.stop().catch(() => undefined);
  }
}

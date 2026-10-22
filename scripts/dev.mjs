// Runs `next dev` and the local queue-processing loop side by side, so a
// document generated in the dashboard actually finishes without a separate
// `npm run worker` command. See scripts/dev-worker-loop.ts for what the loop
// does and why the real deployment needs its own scheduler instead.
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";

// Use package entry points directly so Windows needs no nested cmd/npx processes.
// Turbopack (Next 16's default) is the dev bundler: measured 2026-10-22 it compiled /sign-in in 0.8–3.5 s against
// 27 s on webpack and held ~0.5 GB against webpack's 1.8–3.4 GB, and its disk cache makes restarts quick.
// If the old Turbopack HMR "cell no longer exists" failure comes back, `npm run dev -- --webpack` opts out.
const require = createRequire(import.meta.url);
const win = process.platform === "win32";
const args = process.argv.slice(2);
const bundler = args.some(arg => ["--webpack", "--turbopack", "--turbo"].includes(arg)) ? [] : ["--turbopack"];
const next = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", ...bundler, ...args], { stdio: "inherit" });
const worker = spawn(process.execPath, [require.resolve("tsx/cli"), "--conditions=react-server", "--env-file=.env", "scripts/dev-worker-loop.ts"], { stdio: "inherit" });

// Next and tsx spawn subprocesses. On Windows, stop their entire trees on Ctrl+C.
function stop(child) {
  if (child.exitCode !== null || !child.pid) return;
  if (win) spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  else child.kill();
}

let shuttingDown = false;
function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  stop(next);
  stop(worker);
  process.exit(code ?? 0);
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
next.on("exit", code => shutdown(code ?? 0));
// The worker loop dying shouldn't take the dev server down with it — just
// warn, since the app still works without it (generation simply won't finish).
worker.on("exit", code => {
  if (!shuttingDown) console.error(`[worker] loop exited unexpectedly (code ${code}). Documents will stay queued until you restart dev.`);
});

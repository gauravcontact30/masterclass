// Runs `next dev` and the local queue-processing loop side by side, so a
// document generated in the dashboard actually finishes without a separate
// `npm run worker` command. See scripts/dev-worker-loop.ts for what the loop
// does and why the real deployment needs its own scheduler instead.
import { spawn } from "node:child_process";

// Windows can't exec a .cmd shim directly without a shell; the args here are
// all static and repo-controlled, never user input, so shell:true is safe.
const win = process.platform === "win32";
const next = spawn("npx", ["next", "dev"], { stdio: "inherit", shell: win });
const worker = spawn("npx", ["tsx", "--conditions=react-server", "--env-file=.env.local", "scripts/dev-worker-loop.ts"], { stdio: "inherit", shell: win });

let shuttingDown = false;
function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  next.kill();
  worker.kill();
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

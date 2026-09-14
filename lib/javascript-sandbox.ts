export type PuzzleResult = { status: "complete" | "error" | "timeout" | "stopped"; output: string[] };
export const PUZZLE_TIMEOUT_MS = 3000;

// This code runs in a worker created by an opaque-origin sandboxed iframe.
// It never evaluates student code in the application window or on the server.
export const PUZZLE_WORKER = String.raw`
(() => {
  const send = self.postMessage.bind(self);
  const nativeTimeout = self.setTimeout.bind(self);
  const nativeClear = self.clearTimeout.bind(self);
  const nativeInterval = self.setInterval.bind(self);
  const nativeClearInterval = self.clearInterval.bind(self);
  const pending = new Set();
  let logs = 0, finished = false, mainDone = false;
  const stringify = value => {
    if (typeof value === 'string') return value.slice(0, 2000);
    if (typeof value === 'undefined') return 'undefined';
    if (typeof value === 'bigint') return String(value) + 'n';
    if (typeof value === 'function' || typeof value === 'symbol') return String(value).slice(0, 2000);
    if (value instanceof Error) return value.name + ': ' + value.message;
    const seen = new WeakSet();
    try { return JSON.stringify(value, (_, item) => {
      if (typeof item === 'bigint') return String(item) + 'n';
      if (typeof item === 'object' && item !== null) {
        if (seen.has(item)) return '[Circular]';
        seen.add(item);
      }
      return item;
    })?.slice(0, 2000) ?? String(value); } catch { return '[Unserializable value]'; }
  };
  const log = (...args) => {
    if (finished || logs >= 32) return;
    send({ type: 'log', text: args.map(stringify).join(' ').slice(0, 2000) });
    if (++logs === 32) send({ type: 'log', text: '[Output limited to 32 lines]' });
  };
  const finish = (type, error) => {
    if (finished) return;
    if (error) log(error);
    finished = true;
    send({ type });
  };
  const settle = () => nativeTimeout(() => {
    if (mainDone && pending.size === 0) finish('complete');
  }, 40);
  self.console = { log, info: log, warn: log, error: log, debug: log, clear() {}, table: log };
  self.setTimeout = (callback, delay, ...args) => {
    const id = nativeTimeout(() => {
      try { callback(...args); } catch (error) { finish('error', error); }
      finally { pending.delete(id); settle(); }
    }, delay);
    pending.add(id); return id;
  };
  self.clearTimeout = id => { nativeClear(id); pending.delete(id); settle(); };
  self.setInterval = (callback, delay, ...args) => {
    const id = nativeInterval(() => { try { callback(...args); } catch (error) { finish('error', error); } }, delay);
    pending.add(id); return id;
  };
  self.clearInterval = id => { nativeClearInterval(id); pending.delete(id); settle(); };
  for (const name of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'Worker', 'SharedWorker', 'importScripts']) {
    Object.defineProperty(self, name, { value: undefined, configurable: false, writable: false });
  }
  self.addEventListener('unhandledrejection', event => { event.preventDefault(); finish('error', event.reason); });
  self.addEventListener('error', event => { event.preventDefault(); finish('error', event.message); });
  self.onmessage = async event => {
    self.onmessage = null;
    try {
      const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
      const result = await new AsyncFunction(event.data)();
      if (result !== undefined) log('Return:', result);
      mainDone = true; settle();
    } catch (error) { finish('error', error); }
  };
})();`;

export function puzzleFrameDocument(token: string) {
  // Only our trusted worker bootstrap is embedded; puzzle source is messaged.
  const worker = JSON.stringify(PUZZLE_WORKER).replace(/</g, "\\u003c");
  return `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; worker-src blob:; connect-src 'none'; img-src 'none'; style-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'"><script>
  (() => {
    const token = ${JSON.stringify(token).replace(/</g, "\\u003c")};
    const send = payload => parent.postMessage({ token, ...payload }, '*');
    let worker, timer, count = 0, started = false;
    const end = type => { clearTimeout(timer); if (worker) worker.terminate(); send({ type }); };
    addEventListener('message', event => {
      if (event.source !== parent || event.data?.token !== token) return;
      if (event.data.type === 'stop') { end('stopped'); return; }
      if (started || event.data.type !== 'run' || typeof event.data.code !== 'string') return;
      started = true;
      try {
        const url = URL.createObjectURL(new Blob([${worker}], { type: 'text/javascript' }));
        worker = new Worker(url); URL.revokeObjectURL(url);
        worker.onmessage = event => {
          if (++count > 40) { end('error'); return; }
          const message = event.data;
          if (message?.type === 'log' && typeof message.text === 'string') send({ type: 'log', text: message.text.slice(0, 2000) });
          else if (['complete', 'error'].includes(message?.type)) end(message.type);
        };
        worker.onerror = () => end('error');
        timer = setTimeout(() => end('timeout'), ${PUZZLE_TIMEOUT_MS});
        worker.postMessage(event.data.code);
      } catch { end('error'); }
    });
    send({ type: 'ready' });
  })();</script>`;
}

export function runJavaScriptPuzzle(code: string, onLine: (line: string) => void, onDone: (result: PuzzleResult) => void): () => void {
  if (!code.trim() || code.length > 12000) {
    onDone({ status: "error", output: ["Enter JavaScript code, up to 12,000 characters."] });
    return () => {};
  }
  const token = crypto.randomUUID();
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-scripts");
  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("referrerpolicy", "no-referrer");
  frame.title = "Isolated JavaScript puzzle runner";
  frame.hidden = true;
  const output: string[] = [];
  let finished = false;
  const finish = (status: PuzzleResult["status"]) => {
    if (finished) return;
    finished = true;
    frame.contentWindow?.postMessage({ token, type: "stop" }, "*");
    clearTimeout(watchdog);
    window.removeEventListener("message", receive);
    frame.remove();
    onDone({ status, output });
  };
  const receive = (event: MessageEvent) => {
    if (event.source !== frame.contentWindow || event.data?.token !== token) return;
    const message = event.data;
    if (message.type === "ready") frame.contentWindow?.postMessage({ token, type: "run", code }, "*");
    else if (message.type === "log" && typeof message.text === "string" && output.length < 33) {
      const line = message.text.slice(0, 2000); output.push(line); onLine(line);
    } else if (["complete", "error", "timeout", "stopped"].includes(message.type)) finish(message.type);
  };
  const watchdog = setTimeout(() => finish("timeout"), PUZZLE_TIMEOUT_MS + 1500);
  window.addEventListener("message", receive);
  frame.srcdoc = puzzleFrameDocument(token);
  document.body.append(frame);
  return () => finish("stopped");
}

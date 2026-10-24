import { spawn } from "node:child_process";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9333;

const chrome = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  "--disable-gpu",
  "--no-sandbox",
  "about:blank",
]);

await new Promise(resolve => setTimeout(resolve, 1500));

try {
  const targetsRes = await fetch(`http://127.0.0.1:${port}/json`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === "page") || targets[0];
  if (!pageTarget) throw new Error("No page target found");

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  const errors = [];
  let id = 1;
  const send = (method, params = {}) => {
    return new Promise((resolve) => {
      const msgId = id++;
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === msgId) {
          ws.removeEventListener("message", handler);
          resolve(data.result);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  };

  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  ws.onmessage = (evt) => {
    const data = JSON.parse(evt.data);
    if (data.method === "Runtime.consoleAPICalled") {
      const { type, args } = data.params;
      const text = args.map(a => a.value || a.description || JSON.stringify(a)).join(" ");
      if (type === "error" || type === "warning") {
        errors.push({ source: "console", type, text });
      }
    } else if (data.method === "Runtime.exceptionThrown") {
      errors.push({ source: "exception", type: "error", text: data.params.exceptionDetails.text + " " + (data.params.exceptionDetails.exception?.description || "") });
    } else if (data.method === "Log.entryAdded") {
      if (data.params.entry.level === "error" || data.params.entry.level === "warning") {
        errors.push({ source: "log", type: data.params.entry.level, text: data.params.entry.text });
      }
    } else if (data.method === "Network.responseReceived") {
      const { response } = data.params;
      if (response.status >= 400) {
        errors.push({ source: "network", type: "error", text: `${response.status} ${response.statusText}: ${response.url}` });
      }
    }
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Network.enable");

  console.log("Navigating to http://localhost:3000 ...");
  await send("Page.navigate", { url: "http://localhost:3000" });

  await new Promise(resolve => setTimeout(resolve, 6000));

  console.log(`\n================ FOUND ${errors.length} BROWSER CONSOLE ENTRIES ================`);
  errors.forEach((err, idx) => {
    console.log(`\n[#${idx + 1}] [${err.type.toUpperCase()}] (${err.source})`);
    console.log(err.text);
  });

  ws.close();
} catch (err) {
  console.error("CDP failed:", err);
} finally {
  chrome.kill();
}

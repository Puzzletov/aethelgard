import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "frontend", "public");
const maxOutputBytes = 1024 * 1024;
const resultPrefix = "AETHELGARD:";
const errorPrefix = "AETHELGARD-ERROR:";

function proofPage(pageMode = false) {
  if (pageMode) return `<!doctype html><html><head><title>AETHELGARD:PENDING</title></head><body>
<script type="module">
const proofError = (value) => document.title = "AETHELGARD-ERROR:" + btoa(String(value));
addEventListener("error", (event) => proofError(event.error ?? event.message));
addEventListener("unhandledrejection", (event) => proofError(event.reason));
const timer = setTimeout(() => proofError("page_proof_timeout"), 30000);
import("/proof-script.js").then(({ runProof }) => runProof()).then((value) => {
  clearTimeout(timer); document.title = "AETHELGARD:" + btoa(JSON.stringify(value));
}).catch(proofError);
</script></body></html>`;
  return `<!doctype html><html><head><title>AETHELGARD:PENDING</title></head><body>
<script>
const proofError = (value) => document.title = "AETHELGARD-ERROR:" + btoa(String(value));
addEventListener("error", (event) => proofError(event.error ?? event.message));
addEventListener("unhandledrejection", (event) => proofError(event.reason));
const worker = new Worker("/proof-worker.js", { type: "module" });
const timer = setTimeout(() => { worker.terminate(); proofError("worker_timeout"); }, 30000);
worker.onmessage = (event) => {
  clearTimeout(timer);
  worker.terminate();
  document.title = "AETHELGARD:" + btoa(JSON.stringify(event.data));
};
worker.onerror = (event) => { clearTimeout(timer); worker.terminate(); proofError(event.message); };
</script></body></html>`;
}

export function supportedBrowserExecutables() {
  const candidates = process.platform === "win32" ? [
    ["edge", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"],
    ["chrome", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"],
    ["chrome", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"],
  ] : [["chrome", "/usr/bin/google-chrome"], ["chrome", "/usr/bin/chromium"]];
  const unique = new Map(candidates.filter(([, executable]) => existsSync(executable)));
  if (unique.size === 0) throw new Error("A supported Chrome or Edge executable is required for parser proofs.");
  return Object.freeze([...unique].map(([name, executable]) => Object.freeze({ name, executable })));
}

function browserPath() {
  return supportedBrowserExecutables()[0].executable;
}

function contentType(filePath) {
  if (filePath.endsWith(".mjs")) return "text/javascript";
  if (filePath.endsWith(".json")) return "application/json";
  if (filePath.endsWith(".wasm")) return "application/wasm";
  if (filePath.endsWith(".whl") || filePath.endsWith(".zip")) return "application/octet-stream";
  return "text/plain; charset=utf-8";
}

async function serveStatic(response, pathname) {
  const relative = pathname.replace(/^\/+/, "");
  const resolved = path.resolve(publicRoot, relative);
  if (!resolved.startsWith(`${publicRoot}${path.sep}`)) {
    response.writeHead(404).end();
    return;
  }
  try {
    const bytes = await readFile(resolved);
    response.writeHead(200, { "content-type": contentType(resolved), "cache-control": "no-store" }).end(bytes);
  } catch {
    response.writeHead(404).end();
  }
}

function startServer(fixture, workerSource, additionalSources, pageSource) {
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    if (pathname === "/proof") response.writeHead(200, { "content-type": "text/html" }).end(proofPage(pageSource !== undefined));
    else if (pathname === "/proof-worker.js") {
      response.writeHead(200, { "content-type": "text/javascript" }).end(workerSource);
    } else if (pathname === "/proof-script.js" && pageSource !== undefined) {
      response.writeHead(200, { "content-type": "text/javascript" }).end(pageSource);
    } else if (pathname === "/fixture") {
      response.writeHead(200, { "content-type": "application/octet-stream" }).end(fixture);
    } else if (Object.hasOwn(additionalSources, pathname)) {
      response.writeHead(200, { "content-type": "text/javascript", "cache-control": "no-store" })
        .end(additionalSources[pathname]);
    } else await serveStatic(response, pathname);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function runBrowser(executable, url, profile) {
  const args = ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    `--user-data-dir=${profile}`, "--host-resolver-rules=MAP * 0.0.0.0, EXCLUDE 127.0.0.1",
    "--remote-debugging-port=0", url];
  if (process.env.CI === "true") args.splice(2, 0, "--no-sandbox", "--disable-dev-shm-usage");
  const child = spawn(executable, args, { windowsHide: true });
  let stderr = "";
  let startupError;
  child.stderr.on("data", (chunk) => { if (stderr.length <= maxOutputBytes) stderr += chunk; });
  child.once("error", (error) => { startupError = error; });
  return { child, stderr: () => stderr, startupError: () => startupError };
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function devToolsPort(profile, browser) {
  const file = path.join(profile, "DevToolsActivePort");
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (browser.startupError() !== undefined) throw browser.startupError();
    if (browser.child.exitCode !== null) throw new Error(`Browser exited before the proof started (${browser.child.exitCode}).`);
    try {
      const [port] = (await readFile(file, "utf8")).trim().split(/\r?\n/);
      if (/^\d{1,5}$/.test(port)) return Number(port);
    } catch {
      await delay(100);
    }
  }
  throw new Error("Browser debugging endpoint did not start.");
}

function evaluate(socket, id) {
  return new Promise((resolve, reject) => {
    const listener = (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== id) return;
      socket.removeEventListener("message", listener);
      if (message.error !== undefined) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result.result.value);
    };
    socket.addEventListener("message", listener);
    socket.send(JSON.stringify({ id, method: "Runtime.evaluate", params: { expression: "document.title", returnByValue: true } }));
  });
}

async function proofTitle(port) {
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((target) => target.type === "page" && target.url.includes("/proof"));
  if (page?.webSocketDebuggerUrl === undefined) throw new Error("Browser proof page was not found.");
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  try {
    for (let attempt = 1; attempt <= 240; attempt += 1) {
      const title = await evaluate(socket, attempt);
      if (title !== "AETHELGARD:PENDING"
        && (title.startsWith(resultPrefix) || title.startsWith(errorPrefix))) return title;
      if (title !== "" && title !== "AETHELGARD:PENDING") throw new Error(`Browser navigated unexpectedly: ${title}`);
      await delay(250);
    }
    throw new Error("Browser proof exceeded 60 seconds.");
  } finally {
    socket.close();
  }
}

async function closeBrowser(browser) {
  browser.child.kill();
  await Promise.race([new Promise((resolve) => browser.child.once("close", resolve)), delay(5_000)]);
  if (browser.child.exitCode !== 0 && browser.child.exitCode !== null) {
    process.stderr.write(browser.stderr().slice(-2000));
  }
}

export async function runBrowserParserProof(
  fixture, workerSource, executable = browserPath(), additionalSources = Object.freeze({}),
) {
  return runBrowserProof(fixture, workerSource, executable, additionalSources);
}

export async function runBrowserPageProof(pageSource, executable = browserPath(), additionalSources = Object.freeze({})) {
  return runBrowserProof(Buffer.alloc(0), "", executable, additionalSources, pageSource);
}

async function runBrowserProof(fixture, workerSource, executable, additionalSources, pageSource) {
  const profile = await mkdtemp(path.join(tmpdir(), "aethelgard-parser-proof-"));
  const server = await startServer(fixture, workerSource, additionalSources, pageSource);
  try {
    const address = server.address();
    if (address === null || typeof address === "string") throw new Error("Parser proof server did not start.");
    const browser = runBrowser(executable, `http://127.0.0.1:${address.port}/proof`, profile);
    try {
      const title = await proofTitle(await devToolsPort(profile, browser));
      if (title.startsWith(errorPrefix)) {
        throw new Error(Buffer.from(title.slice(errorPrefix.length), "base64").toString("utf8"));
      }
      if (!title.startsWith(resultPrefix)) throw new Error(`Browser proof returned an invalid result: ${title}`);
      return JSON.parse(Buffer.from(title.slice(resultPrefix.length), "base64").toString("utf8"));
    } finally {
      await closeBrowser(browser);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(profile, { recursive: true, force: true });
  }
}

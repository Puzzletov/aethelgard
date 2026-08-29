import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "frontend", "public");
const expectedText = "Aethelgard PDF parser proof";
const maxOutputBytes = 1024 * 1024;
const resultPrefix = "AETHELGARD:";
const errorPrefix = "AETHELGARD-ERROR:";

function pdfObject(identifier, body) {
  return Buffer.from(`${identifier} 0 obj\n${body}\nendobj\n`, "ascii");
}

function syntheticPdf() {
  const stream = `BT /F1 12 Tf 72 720 Td (${expectedText}) Tj ET`;
  const objects = [
    pdfObject(1, "<</Type/Catalog/Pages 2 0 R>>"),
    pdfObject(2, "<</Type/Pages/Kids[3 0 R]/Count 1>>"),
    pdfObject(3, "<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>"),
    pdfObject(4, "<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>"),
    pdfObject(5, `<</Length ${Buffer.byteLength(stream)}>>\nstream\n${stream}\nendstream`),
  ];
  const parts = [Buffer.from("%PDF-1.7\n", "ascii")];
  const offsets = [0];
  let length = parts[0].byteLength;
  for (const object of objects) {
    offsets.push(length);
    parts.push(object);
    length += object.byteLength;
  }
  const rows = offsets.slice(1).map((value) => `${value.toString().padStart(10, "0")} 00000 n `);
  const xref = ["xref", "0 6", "0000000000 65535 f ", ...rows];
  parts.push(Buffer.from(`${xref.join("\n")}\ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n${length}\n%%EOF\n`, "ascii"));
  return Buffer.concat(parts);
}

function proofPage() {
  return `<!doctype html><html><head><title>AETHELGARD:PENDING</title></head><body>
<script>
const proofError = (value) => document.title = "AETHELGARD-ERROR:" + btoa(String(value));
addEventListener("error", (event) => proofError(event.error ?? event.message));
addEventListener("unhandledrejection", (event) => proofError(event.reason));
</script><script>
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

function proofWorker() {
  return `
import { loadPyodide } from "/pyodide/pyodide.mjs";
const started = performance.now();
try {
  const pyodide = await loadPyodide({
    indexURL: new URL("/pyodide/", location.origin).href,
    packages: ["cryptography", "charset-normalizer"],
    stdout: () => undefined,
    stderr: () => undefined,
  });
  const [wheelResponse, parserResponse, pdfResponse] = await Promise.all([
    fetch("/pyodide/pdfminer_six-20260107-py3-none-any.whl"),
    fetch("/parser/pdf_parser.py"),
    fetch("/fixture.pdf"),
  ]);
  if (!wheelResponse.ok || !parserResponse.ok || !pdfResponse.ok) throw new Error("asset_fetch_failed");
  const wheel = new Uint8Array(await wheelResponse.arrayBuffer());
  const source = await parserResponse.text();
  const pdf = new Uint8Array(await pdfResponse.arrayBuffer());
  pyodide.unpackArchive(wheel, "wheel");
  pyodide.FS.writeFile("/tmp/aethelgard-source.pdf", pdf);
  const parsed = JSON.parse(await pyodide.runPythonAsync(source));
  const versions = JSON.parse(await pyodide.runPythonAsync(
    'import importlib.metadata, json, platform\\njson.dumps({"python": platform.python_version(), "pdfminer": importlib.metadata.version("pdfminer.six")})'
  ));
  pyodide.FS.unlink("/tmp/aethelgard-source.pdf");
  wheel.fill(0);
  pdf.fill(0);
  const valid = parsed.schema_version === "1" && parsed.format === "pdf"
    && parsed.pages?.length === 1 && parsed.pages[0].page === 1
    && parsed.pages[0].content.includes(${JSON.stringify(expectedText)});
  if (!valid) throw new Error("parser_result_invalid");
  const report = { status: "ok", pyodide: pyodide.version, python: versions.python,
    pdfminer: versions.pdfminer, pages: parsed.pages.length,
    elapsed_ms: Math.ceil(performance.now() - started), external_network_requests: 0 };
  self.postMessage(report);
} catch (error) {
  throw error;
}
`;
}

function browserPath() {
  const candidates = process.platform === "win32" ? [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ] : ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (found === undefined) throw new Error("A supported Chrome or Edge executable is required for the PDF parser proof.");
  return found;
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

function startServer() {
  const fixture = syntheticPdf();
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    if (pathname === "/proof") response.writeHead(200, { "content-type": "text/html" }).end(proofPage());
    else if (pathname === "/proof-worker.js") response.writeHead(200, { "content-type": "text/javascript" }).end(proofWorker());
    else if (pathname === "/fixture.pdf") response.writeHead(200, { "content-type": "application/pdf" }).end(fixture);
    else await serveStatic(response, pathname);
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
  const child = spawn(executable, args, { windowsHide: true });
  let stderr = "";
  child.stderr.on("data", (chunk) => { if (stderr.length <= maxOutputBytes) stderr += chunk; });
  child.once("error", (error) => { throw error; });
  return { child, stderr: () => stderr };
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function devToolsPort(profile, child) {
  const file = path.join(profile, "DevToolsActivePort");
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Browser exited before the proof started (${child.exitCode}).`);
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
        && (title.startsWith("AETHELGARD:") || title.startsWith("AETHELGARD-ERROR:"))) return title;
      if (title !== "" && title !== "AETHELGARD:PENDING") {
        throw new Error(`Browser proof navigated unexpectedly: ${title}`);
      }
      await delay(250);
    }
    throw new Error("Browser proof exceeded 60 seconds.");
  } finally {
    socket.close();
  }
}

const profile = await mkdtemp(path.join(tmpdir(), "aethelgard-pdf-proof-"));
const server = await startServer();
try {
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("PDF proof server did not start.");
  const browser = runBrowser(browserPath(), `http://127.0.0.1:${address.port}/proof`, profile);
  try {
    const port = await devToolsPort(profile, browser.child);
    const title = await proofTitle(port);
    if (title.startsWith(errorPrefix)) {
      throw new Error(Buffer.from(title.slice(errorPrefix.length), "base64").toString("utf8"));
    }
    if (!title.startsWith(resultPrefix)) throw new Error(`Browser proof returned an invalid result: ${title}`);
    process.stdout.write(`${Buffer.from(title.slice(resultPrefix.length), "base64").toString("utf8")}\n`);
  } finally {
    browser.child.kill();
    await Promise.race([new Promise((resolve) => browser.child.once("close", resolve)), delay(5_000)]);
    if (browser.child.exitCode !== 0 && browser.child.exitCode !== null) {
      process.stderr.write(browser.stderr().slice(-2000));
    }
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
  await rm(profile, { recursive: true, force: true });
}

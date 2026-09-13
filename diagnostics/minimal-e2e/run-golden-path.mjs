import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const pageUrl = "https://golden-path.aethelgard-3j9.pages.dev/";
const analyzeUrl = "https://aethelgard-minimal-edge.justbwas.workers.dev/analyze";
const originals = ["Evelyn Marlowe", "Northstar Lantern Ltd", "evelyn.marlowe@example.invalid",
  "+44 7700 900123", "42 Fiction Lane, Exampletown EX4 2ZZ", "CUST-654321"];
const fixture = [`Person | ${originals[0]}`, `Organization | ${originals[1]}`,
  `Address | ${originals[4]}`, `Email: ${originals[2]}`, `Telephone: ${originals[3]}`,
  `Customer: ${originals[5]}`,
  "Revenue increased by twelve percent while supplier concentration created delivery risk."].join("\n");

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function devtoolsPort(profile, child) {
  const filename = path.join(profile, "DevToolsActivePort");
  for (let attempt = 0; attempt < 300; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`browser_exited_${child.exitCode}`);
    try { return Number((await readFile(filename, "utf8")).split(/\r?\n/u)[0]); }
    catch { await delay(100); }
  }
  throw new Error("devtools_timeout");
}

async function pageSocket(port) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const page = targets.find((target) => target.type === "page");
    if (page?.webSocketDebuggerUrl !== undefined) return new WebSocket(page.webSocketDebuggerUrl);
    await delay(100);
  }
  throw new Error("page_target_missing");
}

async function opened(socket) {
  if (socket.readyState === WebSocket.OPEN) return;
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
}

function rpc(socket) {
  let sequence = 0;
  const pending = new Map();
  const listeners = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id !== undefined) {
      const waiter = pending.get(message.id); pending.delete(message.id);
      if (message.error !== undefined) waiter?.reject(new Error(JSON.stringify(message.error)));
      else waiter?.resolve(message.result);
    } else for (const listener of listeners) listener(message);
  });
  return {
    listen: (listener) => listeners.push(listener),
    send(method, params = {}) {
      const id = ++sequence;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
  };
}

async function waitFor(client, expression, milliseconds) {
  const deadline = Date.now() + milliseconds;
  while (Date.now() < deadline) {
    const result = await client.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.result.value) return result.result.value;
    await delay(100);
  }
  throw new Error(`wait_timeout:${expression}`);
}

async function selectFixture(client, fixturePath) {
  const document = await client.send("DOM.getDocument", { depth: 1 });
  const input = await client.send("DOM.querySelector", { nodeId: document.root.nodeId, selector: "#document" });
  if (input.nodeId === 0) throw new Error("file_input_missing");
  await client.send("DOM.setFileInputFiles", { nodeId: input.nodeId, files: [fixturePath] });
}

function inspectOutbound(postData) {
  if (typeof postData !== "string") throw new Error("analyze_body_missing");
  for (const original of originals) if (postData.includes(original)) throw new Error(`raw_pii_egress:${original}`);
  for (const placeholder of ["[PERSON_1]", "[ORGANIZATION_1]", "[ADDRESS_1]", "[EMAIL_1]",
    "[PHONE_1]", "[CUSTOMER_ID_1]"]) if (!postData.includes(placeholder)) throw new Error(`placeholder_missing:${placeholder}`);
  if (/Evelyn-Marlowe|\.txt|pii_map|filename/iu.test(postData)) throw new Error("forbidden_metadata_egress");
}

async function browserState(client) {
  const expression = `Promise.all([indexedDB.databases(), Promise.resolve({
    diagnostic: window.__AETHELGARD_DIAGNOSTIC__,
    resultVisible: !document.querySelector('#result').hidden,
    sections: ['summary','findings','risks','recommendations'].map(id => document.querySelector('#'+id).textContent.trim().length > 0),
    localStorage: localStorage.length, sessionStorage: sessionStorage.length
  })]).then(([databases,value]) => ({...value,indexedDb:databases.length}))`;
  return (await client.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value;
}

async function run() {
  const executable = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  if (!existsSync(executable)) throw new Error("chrome_missing");
  const profile = await mkdtemp(path.join(tmpdir(), "aethelgard-minimal-e2e-"));
  const fixturePath = path.join(profile, "synthetic-golden-path.txt");
  await writeFile(fixturePath, fixture, "utf8");
  const child = spawn(executable, ["--headless=new", "--disable-gpu", "--no-first-run",
    "--no-default-browser-check", `--user-data-dir=${profile}`, "--remote-debugging-port=0", "about:blank"],
  { windowsHide: true });
  const started = Date.now();
  try {
    const socket = await pageSocket(await devtoolsPort(profile, child));
    await opened(socket);
    const client = rpc(socket);
    let analyzePostData;
    const runtimeErrors = [];
    client.listen((message) => {
      if (message.method === "Fetch.requestPaused") {
        void client.send("Fetch.continueRequest", { requestId: message.params.requestId });
      }
      if (message.method === "Fetch.requestPaused" && message.params.request.url === analyzeUrl) {
        analyzePostData = message.params.request.postData;
      }
      if (message.method === "Runtime.exceptionThrown") {
        const details = message.params.exceptionDetails;
        runtimeErrors.push({ text: details.text, description: details.exception?.description,
          url: details.url, line: details.lineNumber, column: details.columnNumber });
      }
    });
    await client.send("Network.enable");
    await client.send("Fetch.enable", { patterns: [{ urlPattern: `${analyzeUrl}*`, requestStage: "Request" }] });
    await client.send("Runtime.enable");
    await client.send("Log.enable");
    await client.send("Page.enable");
    await client.send("Page.navigate", { url: pageUrl });
    await waitFor(client, "document.readyState === 'complete' && document.querySelector('#document') !== null", 15_000);
    await selectFixture(client, fixturePath);
    try { await waitFor(client, "!document.querySelector('#analyze').disabled", 15_000); }
    catch {
      const state = await client.send("Runtime.evaluate", { expression: `({
        status: document.querySelector('#status')?.textContent,
        redaction: window.__AETHELGARD_DIAGNOSTIC__,
        turnstileLoaded: typeof window.turnstile === 'object',
        iframeCount: document.querySelectorAll('iframe').length
      })`, returnByValue: true });
      throw new Error(`analyze_not_ready:${JSON.stringify({ ...state.result.value, runtimeErrors })}`);
    }
    await client.send("Runtime.evaluate", { expression: "document.querySelector('#analyze').click()" });
    await waitFor(client, "window.__AETHELGARD_DIAGNOSTIC__?.passed === true || window.__AETHELGARD_DIAGNOSTIC__?.failure", 60_000);
    inspectOutbound(analyzePostData);
    const state = await browserState(client);
    socket.close();
    const passed = state.diagnostic?.passed === true && state.resultVisible
      && state.sections.every(Boolean) && state.localStorage === 0 && state.sessionStorage === 0 && state.indexedDb === 0;
    process.stdout.write(`${JSON.stringify({ passed, total_ms: Date.now() - started,
      pii_egress: 0, storage_writes: 0, diagnostic: state.diagnostic })}\n`);
    if (!passed) process.exitCode = 1;
  } finally {
    child.kill();
    await Promise.race([new Promise((resolve) => child.once("close", resolve)), delay(5_000)]);
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}

await run();

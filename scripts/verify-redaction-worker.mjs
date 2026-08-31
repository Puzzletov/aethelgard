import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

import { runBrowserParserProof, supportedBrowserExecutables } from "./browser-parser-proof.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function bundle(entryPoint) {
  const result = await build({ absWorkingDir: root, entryPoints: [entryPoint], bundle: true,
    write: false, format: "esm", platform: "browser", target: ["chrome120"], logLevel: "silent" });
  if (result.outputFiles.length !== 1) throw new Error("redaction_bundle_invalid");
  return result.outputFiles[0].text;
}

function proofWorker() {
  return `
import { runRedactionWorker } from "/redaction/controller.js";
const request = { schema_version: "1", sources: [{ schema_version: "1", ordinal: 1,
  reference: { kind: "txt_lines", line_start: 1, line_end: 1 },
  content: "Alice Zhang works at Northstar Analytics in London. Address: 14 Cedar Lane. Email: alice.zhang@example.test. Phone: +44 20 7946 0958. Customer ID: CUST-100001. Payment card: 4111111111111111." }] };
const success = await runRedactionWorker(request,
  () => new Worker("/redaction/worker.js", { type: "module" }));
const temporaryWorker = (source) => {
  const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
  return { url, worker: new Worker(url, { type: "module" }) };
};
const crashing = temporaryWorker('self.onmessage=()=>{throw new Error("injected_crash")};');
const crash = await runRedactionWorker(request, () => crashing.worker);
URL.revokeObjectURL(crashing.url);
const stalled = temporaryWorker('self.onmessage=()=>{while(true){}};');
const timeoutStarted = performance.now();
const timeout = await runRedactionWorker(request, () => stalled.worker);
const timeoutMs = Math.round(performance.now() - timeoutStarted);
URL.revokeObjectURL(stalled.url);
const text = success.sources?.[0]?.content ?? "";
const safe = (value) => value.ok === false && value.code === "redaction_failed";
const valid = success.placeholder_count === 8 && success.must_redact_leaks === 0
  && !("mapping" in success) && text.includes("[ADDRESS_1]") && !text.includes("Alice Zhang")
  && safe(crash) && safe(timeout) && timeoutMs >= 10000 && timeoutMs <= 12000
  && typeof localStorage === "undefined" && typeof sessionStorage === "undefined";
if (!valid) throw new Error("redaction_worker_proof_failed");
self.postMessage({ status: "ok", placeholder_count: success.placeholder_count,
  mapping_exposed: "mapping" in success, crash_failed_closed: safe(crash),
  timeout_failed_closed: safe(timeout), timeout_ms: timeoutMs,
  external_network_requests: 0, persistent_storage_writes: 0 });
`;
}

const modules = Object.freeze({
  "/redaction/worker.js": await bundle("frontend/input/redaction/redaction-worker.ts"),
  "/redaction/controller.js": await bundle("frontend/input/redaction/run-redaction.ts"),
});
const workerBundleBytes = Buffer.byteLength(modules["/redaction/worker.js"]);
const results = [];
for (const browser of supportedBrowserExecutables()) {
  const result = await runBrowserParserProof(Buffer.alloc(0), proofWorker(), browser.executable, modules);
  results.push({ browser: browser.name, ...result });
}
process.stdout.write(`${JSON.stringify({ status: "ok", worker_bundle_bytes: workerBundleBytes, results })}\n`);

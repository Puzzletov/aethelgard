import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

import { runBrowserPageProof, supportedBrowserExecutables } from "./browser-parser-proof.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function bundle(entryPoint, externalPyodide = false) {
  const plugins = externalPyodide ? [{ name: "self-hosted-pyodide", setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^pyodide$/ }, () => ({
      path: "/pyodide/pyodide.mjs", external: true,
    }));
  } }] : [];
  const result = await build({ absWorkingDir: root, entryPoints: [`./${entryPoint}`], bundle: true,
    write: false, format: "esm", platform: "browser", target: ["chrome120"], logLevel: "silent", plugins });
  return result.outputFiles[0].text;
}

const page = `
import { runBrowserMission } from "/phase1/mission.js";
import { selectBrowserDocument } from "/phase1/input.js";
import { runParserWorker } from "/phase1/parser-controller.js";
import { runRedactionWorker } from "/phase1/redaction-controller.js";
import { runAnalysis } from "/phase1/orchestrator.js";
const privateText = "This project provides a clear independent analysis of the evidence and explains every recommendation in plain English for careful review. Customer ID CUST-100001.";
const reference = { kind: "txt_lines", line_start: 1, line_end: 1 };
const outputs = {
  strawman: { schema_version: "1", findings: [{ id: "finding-1", title: "Evidence finding",
    analysis: "The evidence supports review.", confidence: "high", evidence: [reference] }],
    risks: [], assumptions: [], quantitative_candidates: [] },
  steelman: { schema_version: "1", items: [{ id: "critique-1", strawman_finding_ids: ["finding-1"],
    kind: "nuance", critique: "The evidence needs qualification.", evidence: [reference] }] },
  oracle: { schema_version: "1", executive_summary: "The evidence supports a qualified decision.",
    findings: [{ id: "oracle-1", title: "Qualified finding", analysis: "The evidence is material.",
      confidence: "high", evidence: [reference] }], recommendations: [{ id: "recommendation-1",
      title: "Review controls", action: "Verify the material controls.", priority: "high",
      confidence: "high", evidence: [reference] }], risks: [], quantitative_candidates: [],
    critique_resolutions: [{ steelman_item_id: "critique-1", status: "resolved",
      explanation: "The final finding is qualified." }] },
};
let storageWrites = 0;
for (const method of ["setItem", "removeItem", "clear"]) {
  const native = Storage.prototype[method];
  Storage.prototype[method] = function(...args) { storageWrites += 1; return native.apply(this, args); };
}
const NativeWorker = globalThis.Worker;
let workersCreated = 0; let workersTerminated = 0;
globalThis.Worker = class extends NativeWorker {
  constructor(...args) { super(...args); workersCreated += 1; }
  terminate() { workersTerminated += 1; super.terminate(); }
};
export async function runProof() {
  const file = new File([new TextEncoder().encode(privateText)], "private-review.txt", { type: "text/plain" });
  const selected = selectBrowserDocument([file]);
  if (!selected.ok) throw new Error("real_document_selection_failed");
  let analyzeRequests = 0; let capturedRequest; const calls = [];
  const transport = async (request) => {
    calls.push(request.stage + ":" + request.provider);
    const prompt = request.messages.map((message) => message.content).join("\\n");
    if (prompt.includes("fresh-exit-token") || prompt.includes(privateText)) throw new Error("prompt_boundary_failed");
    return { ok: true, provider: request.provider,
      body: { choices: [{ message: { content: JSON.stringify(outputs[request.stage]) } }] } };
  };
  const outcome = await runBrowserMission(selected.document, "full", ["pdf"], "fresh-exit-token",
    () => undefined, {
      parseDocument: (document) => runParserWorker(document,
        () => new Worker("/phase1/parser-worker.js", { type: "module" })),
      redact: (request) => runRedactionWorker(request,
        () => new Worker("/phase1/redaction-worker.js", { type: "module" })),
      send: async (body) => {
        analyzeRequests += 1; capturedRequest = JSON.parse(new TextDecoder().decode(body));
        return runAnalysis(capturedRequest, { groq: "test-only", openrouter_free: "test-only" }, transport);
      },
    });
  const requestText = capturedRequest === undefined ? "" : JSON.stringify(capturedRequest);
  const passed = !("ok" in outcome.result) && outcome.result.executive_summary === outputs.oracle.executive_summary
    && analyzeRequests === 1 && calls.join(",") === "strawman:groq,steelman:groq,oracle:groq"
    && requestText.includes("[CUSTOMER_ID_1]") && !requestText.includes("CUST-100001")
    && !requestText.includes("private-review.txt")
    && workersCreated === 2 && workersTerminated === 2 && storageWrites === 0;
  return { status: passed ? "ok" : "failed", valid_oracle: !("ok" in outcome.result),
    analyze_requests: analyzeRequests, provider_calls: calls,
    raw_or_pii_egress: requestText.includes("CUST-100001"), storage_writes: storageWrites,
    workers_created: workersCreated, workers_terminated: workersTerminated,
    outcome_category: "ok" in outcome.result ? outcome.result.category : "oracle",
    outcome_code: "ok" in outcome.result ? outcome.result.code : "valid" };
}`;

const modules = Object.freeze({
  "/phase1/mission.js": await bundle("frontend/analysis/browser-mission.ts"),
  "/phase1/input.js": await bundle("frontend/input/document-input.ts"),
  "/phase1/parser-controller.js": await bundle("frontend/input/parsers/run-parser.ts"),
  "/phase1/parser-worker.js": await bundle("frontend/workers/parser.worker.ts", true),
  "/phase1/redaction-controller.js": await bundle("frontend/input/redaction/run-redaction.ts"),
  "/phase1/redaction-worker.js": await bundle("frontend/input/redaction/redaction-worker.ts"),
  "/phase1/orchestrator.js": await bundle("workers/trusted-runtime/src/analysis-orchestrator.ts"),
});
const results = [];
for (const browser of supportedBrowserExecutables()) {
  results.push({ browser: browser.name,
    ...await runBrowserPageProof(page, browser.executable, modules) });
}
if (results.some((result) => result.status !== "ok")) throw new Error(JSON.stringify(results));
process.stdout.write(`${JSON.stringify({ status: "ok", results })}\n`);

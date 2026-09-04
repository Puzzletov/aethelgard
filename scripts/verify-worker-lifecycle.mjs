import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

import { runBrowserPageProof, supportedBrowserExecutables } from "./browser-parser-proof.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function bundle(entryPoint, parserTimeoutMs) {
  const plugins = parserTimeoutMs === undefined ? [] : [{
    name: "scaled-parser-timeout-proof",
    setup(pluginBuild) {
      pluginBuild.onLoad({ filter: /run-parser\.ts$/ }, async (args) => ({
        contents: (await readFile(args.path, "utf8")).replace(
          "PARSER_TIMEOUT_MS = 30_000", `PARSER_TIMEOUT_MS = ${parserTimeoutMs}`,
        ),
        loader: "ts",
      }));
    },
  }];
  const result = await build({ absWorkingDir: root, entryPoints: [entryPoint], bundle: true,
    write: false, format: "esm", platform: "browser", target: ["chrome120"], logLevel: "silent", plugins });
  if (result.outputFiles.length !== 1) throw new Error("worker_lifecycle_bundle_invalid");
  return result.outputFiles[0].text;
}

const PAGE_SOURCE = `
import { runBrowserMission } from "/lifecycle/mission.js";
import { runParserWorker } from "/lifecycle/parser-controller.js";
import { runRedactionWorker } from "/lifecycle/redaction-controller.js";
const privateCrash = "synthetic-private-crash-marker";
const content = "This project provides a clear independent analysis of the evidence and explains every recommendation in plain English for careful review.";
const reference = { kind: "txt_lines", line_start: 1, line_end: 1 };
const parsed = { ok: true, schema_version: "1", format: "txt",
  sources: [{ line_start: 1, line_end: 1, content }] };
const oracle = { schema_version: "1", executive_summary: "Safe synthetic result.",
  findings: [{ id: "finding-1", title: "Finding", analysis: "Analysis", confidence: "high", evidence: [reference] }],
  recommendations: [], risks: [], quantitative_candidates: [], critique_resolutions: [] };
const NativeWorker = globalThis.Worker;
let workersCreated = 0; let workersTerminated = 0; let externalRequests = 0;
globalThis.fetch = async () => { externalRequests += 1; throw new Error("network_forbidden"); };
globalThis.Worker = class extends NativeWorker {
  constructor(...args) { super(...args); workersCreated += 1; }
  terminate() { workersTerminated += 1; super.terminate(); }
};
const urls = [];
function temporaryWorker(source) {
  const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
  urls.push(url);
  return new Worker(url, { type: "module" });
}
function document() {
  const file = new File([new TextEncoder().encode(content)], "synthetic.txt", { type: "text/plain" });
  return { file, format: "txt", byteLength: file.size };
}
function counts(before) {
  return { workers_created: workersCreated - before.created,
    workers_terminated: workersTerminated - before.terminated };
}
async function parserCrash() {
  const before = { created: workersCreated, terminated: workersTerminated };
  let attempts = 0; let sends = 0;
  const result = await runBrowserMission(document(), "full", ["text"], "token", () => undefined, {
    parseDocument: value => runParserWorker(value, () => temporaryWorker(++attempts === 1
      ? 'self.onmessage=()=>{throw new Error("' + privateCrash + '")}'
      : 'self.onmessage=()=>self.postMessage(' + JSON.stringify(parsed) + ')')),
    redact: async request => ({ schema_version: "1", sources: request.sources,
      placeholder_count: 0, must_redact_leaks: 0 }),
    send: async () => { sends += 1; return oracle; },
  });
  return { attempts, sends, outcome: "ok" in result.result ? result.result : "oracle", ...counts(before) };
}
async function redactorCrash() {
  const before = { created: workersCreated, terminated: workersTerminated };
  let parserAttempts = 0; let redactorAttempts = 0; let sends = 0;
  const result = await runBrowserMission(document(), "full", ["text"], "token", () => undefined, {
    parseDocument: value => runParserWorker(value, () => { parserAttempts += 1;
      return temporaryWorker('self.onmessage=()=>self.postMessage(' + JSON.stringify(parsed) + ')'); }),
    redact: request => runRedactionWorker(request, () => { redactorAttempts += 1;
      return temporaryWorker('self.onmessage=()=>{throw new Error("' + privateCrash + '")}'); }),
    send: async () => { sends += 1; return oracle; },
  });
  return { parser_attempts: parserAttempts, redactor_attempts: redactorAttempts,
    sends, outcome: result.result, ...counts(before) };
}
async function parserTimeout() {
  const before = { created: workersCreated, terminated: workersTerminated };
  const buffers = []; let attempts = 0; let redactions = 0; let sends = 0;
  const timeoutDocument = document();
  timeoutDocument.file = { arrayBuffer: async () => { const value = new TextEncoder().encode(content).buffer;
    buffers.push(value); return value; } };
  const started = performance.now();
  const result = await runBrowserMission(timeoutDocument, "full", ["text"], "token", () => undefined, {
    parseDocument: value => runParserWorker(value, () => { attempts += 1;
      return temporaryWorker("self.onmessage=()=>{while(true){}}"); }),
    redact: async () => { redactions += 1; throw new Error("redaction_forbidden"); },
    send: async () => { sends += 1; return oracle; },
  });
  const elapsedMs = Math.round(performance.now() - started);
  return { attempts, redactions, sends, elapsed_ms: elapsedMs,
    buffers_released: buffers.every(buffer => buffer.byteLength === 0),
    outcome: result.result, ...counts(before) };
}
export async function runProof() {
  try {
    const parser = await parserCrash();
    const redactor = await redactorCrash();
    const timeout = await parserTimeout();
    const expectedSafeMode = { schema_version: "1", ok: false, category: "privacy",
      code: "redaction_failed", message: "Private information could not be removed safely.", retry: "fresh_document" };
    const expectedParserMode = { schema_version: "1", ok: false, category: "client_resource",
      code: "parser_resource_failed", message: "This browser could not process the document safely.",
      retry: "fresh_document" };
    const result = { schema_version: "1", parser, redactor, timeout, external_requests: externalRequests };
    const crashDetailLeaked = JSON.stringify(result).includes(privateCrash);
    return { ...result, crash_detail_leaked: crashDetailLeaked,
      passed: parser.attempts === 2 && parser.sends === 1 && parser.outcome === "oracle"
        && parser.workers_created === 2 && parser.workers_terminated === 2
        && redactor.parser_attempts === 1 && redactor.redactor_attempts === 1 && redactor.sends === 0
        && redactor.workers_created === 2 && redactor.workers_terminated === 2
        && JSON.stringify(redactor.outcome) === JSON.stringify(expectedSafeMode)
        && timeout.attempts === 2 && timeout.redactions === 0 && timeout.sends === 0
        && timeout.workers_created === 2 && timeout.workers_terminated === 2 && timeout.buffers_released
        && timeout.elapsed_ms >= 180 && timeout.elapsed_ms <= 2_000
        && JSON.stringify(timeout.outcome) === JSON.stringify(expectedParserMode)
        && externalRequests === 0 && !crashDetailLeaked };
  } finally {
    for (const url of urls) URL.revokeObjectURL(url);
  }
}
`;

const modules = Object.freeze({
  "/lifecycle/mission.js": await bundle("frontend/analysis/browser-mission.ts"),
  "/lifecycle/parser-controller.js": await bundle("frontend/input/parsers/run-parser.ts", 100),
  "/lifecycle/redaction-controller.js": await bundle("frontend/input/redaction/run-redaction.ts"),
});
const results = [];
for (const browser of supportedBrowserExecutables()) {
  results.push({ browser: browser.name,
    ...await runBrowserPageProof(PAGE_SOURCE, browser.executable, modules) });
}
process.stdout.write(`${JSON.stringify({ status: "ok", results })}\n`);

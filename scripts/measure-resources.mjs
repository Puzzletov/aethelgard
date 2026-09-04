import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { gzipSync } from "node:zlib";

import publicWorker from "../src/index.ts";
import { createAnalyzeResponse } from "../workers/trusted-runtime/src/analyze-response.ts";

const execute = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptPath = fileURLToPath(import.meta.url);
const limits = Object.freeze({ initial: 307_200, asset: 26_214_400, worker: 2_516_582,
  cpu: 8, memory: 100_663_296, response: 8_388_608 });
const reportHtmlBytes = 1_048_576;
const signingArenaBytes = 8_388_608;

async function command(file, args) {
  const result = await execute(file, args, { cwd: root, timeout: 180_000, windowsHide: true });
  return `${result.stdout}\n${result.stderr}`;
}

async function files(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await files(target));
    if (entry.isFile()) output.push(target);
  }
  return output;
}

async function frontendSizes() {
  await command(process.execPath, ["frontend/node_modules/next/dist/bin/next", "build", "frontend"]);
  const output = path.join(root, "frontend", "out");
  const html = await readFile(path.join(output, "index.html"), "utf8");
  const sources = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((match) => match[1]))];
  let initial = 0;
  for (const source of sources) initial += gzipSync(await readFile(path.join(output, source.replace(/^\//, ""))), { level: 9 }).byteLength;
  const sizes = await Promise.all((await files(output)).map(async (file) => (await stat(file)).size));
  return { initial, asset: Math.max(...sizes) };
}

function gzipBytes(output) {
  const match = output.match(/gzip:\s*([0-9.]+)\s*KiB/iu);
  if (match === null) throw new Error("worker_bundle_measurement_missing");
  return Math.ceil(Number(match[1]) * 1_024);
}

async function workerSizes() {
  const wrangler = "node_modules/wrangler/bin/wrangler.js";
  const publicOutput = await command(process.execPath, [wrangler, "deploy", "--dry-run"]);
  const trustedOutput = await command(process.execPath,
    [wrangler, "deploy", "--dry-run", "--config", "workers/trusted-runtime/wrangler.toml"]);
  return { public: gzipBytes(publicOutput), trusted: gzipBytes(trustedOutput) };
}

async function publicCpuP99() {
  const env = { ALLOWED_ORIGIN: "https://aethelgard-3j9.pages.dev",
    ANALYZE_RATE_LIMIT: { limit: async () => ({ success: true }) },
    TRUSTED_RUNTIME: { getByName: () => ({ fetch: async () => new Response("{}") }) } };
  const timings = [];
  for (let index = 0; index < 1_000; index += 1) {
    const started = performance.now();
    const response = await publicWorker.fetch(new Request("https://edge.invalid/health"), env);
    if (response.status !== 200) throw new Error("public_cpu_fixture_failed");
    timings.push(performance.now() - started);
  }
  timings.sort((left, right) => left - right);
  return Number(timings[Math.ceil(timings.length * 0.99) - 1].toFixed(3));
}

const reference = Object.freeze({ kind: "pdf_page", page: 1 });
function dashboard() {
  return { schema_version: "1", focus: "full", title: "Independent review", executive_summary: "Summary.",
    findings: [{ id: "f1", title: "Finding", analysis: "Analysis.", confidence: "high", evidence: [reference] }],
    recommendations: [{ id: "r1", title: "Act", action: "Review.", priority: "high", confidence: "high",
      evidence: [reference] }], risks: [], charts: [], verification: {
      ed25519_key_id: `ed25519:${"a".repeat(32)}`, mldsa65_key_id: `mldsa65:${"b".repeat(32)}` } };
}

function signedPdf(size) {
  const bytes = new Uint8Array(size); bytes.set(new TextEncoder().encode("%PDF-1.7"));
  bytes.set(new TextEncoder().encode("%%EOF"), size - 5);
  return { bytes, signature_manifest: { schema_version: "1",
    pdf_sha256: createHash("sha256").update(bytes).digest("hex"), ed25519_algorithm: "Ed25519",
    ed25519_public_key_id: `ed25519:${"a".repeat(32)}`, ed25519_signature_b64: btoa("e".repeat(64)),
    mldsa65_algorithm: "ML-DSA-65", mldsa65_public_key_id: `mldsa65:${"b".repeat(32)}`,
    mldsa65_signature_b64: btoa("m".repeat(3_309)) } };
}

function responseInput(kind, variableSize) {
  const pdfSize = kind === "pdf" ? variableSize : 2_000_000;
  const input = { dashboard: dashboard(), requested_outputs: kind === "pdf" ? ["pdf"] : ["pdf", "xlsx", "text"],
    pdf: signedPdf(pdfSize) };
  if (kind === "mixed") {
    input.xlsx = new Uint8Array(variableSize); input.xlsx.set(new TextEncoder().encode("PK"));
    input.text = new TextEncoder().encode("T".repeat(1_040_000));
  }
  return input;
}

async function searchResponse(kind) {
  let low = 8; let high = kind === "pdf" ? 6_300_000 : 4_194_304; let acceptedSize = 0;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const candidate = createAnalyzeResponse(responseInput(kind, middle));
    if (candidate === undefined) high = middle - 1;
    else { acceptedSize = middle; low = middle + 1; }
    await candidate?.body?.cancel();
  }
  const accepted = createAnalyzeResponse(responseInput(kind, acceptedSize));
  if (accepted === undefined) throw new Error("response_search_failed");
  return { kind, accepted_size: acceptedSize, response_bytes: (await accepted.arrayBuffer()).byteLength };
}

async function probeResponse(kind, acceptedSize) {
  global.gc?.();
  const baseline = process.memoryUsage();
  const input = responseInput(kind, acceptedSize);
  const raw = process.memoryUsage();
  const accepted = createAnalyzeResponse(input);
  if (accepted === undefined) throw new Error("response_measurement_failed");
  const constructed = process.memoryUsage();
  const responseBytes = (await accepted.arrayBuffer()).byteLength;
  const consumed = process.memoryUsage();
  const delta = (value) => Math.max(0, value.heapUsed - baseline.heapUsed)
    + Math.max(0, value.arrayBuffers - baseline.arrayBuffers);
  return { kind, response_bytes: responseBytes, raw_output_bytes: delta(raw),
    response_constructed_bytes: delta(constructed), response_consumed_bytes: delta(consumed),
    measured_peak_bytes: Math.max(delta(raw), delta(constructed), delta(consumed)) };
}

async function jsonChild(args) {
  const result = await execute(process.execPath, ["--expose-gc", scriptPath, ...args],
    { cwd: root, timeout: 60_000, windowsHide: true });
  return JSON.parse(result.stdout);
}

async function trustedMemory() {
  const cases = [];
  for (const kind of ["pdf", "mixed"]) {
    const search = await jsonChild(["--memory-search", kind]);
    cases.push({ ...search, ...await jsonChild(["--memory-probe", kind, String(search.accepted_size)]) });
  }
  const responsePeak = Math.max(...cases.map((item) => item.measured_peak_bytes));
  return { cases, report_html_bound_bytes: reportHtmlBytes, signing_arena_bound_bytes: signingArenaBytes,
    trusted_peak_memory_bytes: responsePeak + reportHtmlBytes + signingArenaBytes,
    response_max_bytes: Math.max(...cases.map((item) => item.response_bytes)) };
}

async function fullReport() {
  const frontend = await frontendSizes();
  const workers = await workerSizes();
  const cpu = await publicCpuP99();
  const trusted = await trustedMemory();
  const report = { schema_version: "1", initial_js_gzip_bytes: frontend.initial,
    static_asset_max_bytes: frontend.asset, public_worker_gzip_bytes: workers.public,
    trusted_worker_gzip_bytes: workers.trusted, public_cpu_p99_ms: cpu,
    trusted_peak_memory_bytes: trusted.trusted_peak_memory_bytes,
    response_max_bytes: trusted.response_max_bytes, passed: false };
  report.passed = report.initial_js_gzip_bytes < limits.initial && report.static_asset_max_bytes < limits.asset
    && report.public_worker_gzip_bytes < limits.worker && report.trusted_worker_gzip_bytes < limits.worker
    && report.public_cpu_p99_ms < limits.cpu && report.trusted_peak_memory_bytes < limits.memory
    && report.response_max_bytes <= limits.response;
  return report;
}

const [mode, kind, size] = process.argv.slice(2);
let result;
if (mode === "--memory-search") result = await searchResponse(kind);
else if (mode === "--memory-probe") result = await probeResponse(kind, Number(size));
else if (mode === "--memory-only") result = { schema_version: "1", ...await trustedMemory() };
else result = await fullReport();
process.stdout.write(`${JSON.stringify(result)}\n`);
if (mode === undefined && !result.passed) process.exitCode = 1;

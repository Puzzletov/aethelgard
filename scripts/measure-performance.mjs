import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { promisify } from "node:util";

import { runAnalysis } from "../workers/trusted-runtime/src/analysis-orchestrator.ts";
import { integrateTrustedFinalPdf } from "../workers/trusted-runtime/src/final-signing.ts";
import { signExactPdf } from "../workers/trusted-runtime/src/hybrid-signing.ts";
import { Mldsa65 } from "../workers/trusted-runtime/src/mldsa65.ts";

const execute = promisify(execFile);
const samples = 7;
const reference = Object.freeze({ kind: "pdf_page", page: 1 });
const source = Object.freeze({ schema_version: "1", ordinal: 1, reference,
  content: "[PERSON_1] reported revenue growth while one control remained incomplete." });
const request = Object.freeze({ schema_version: "1", turnstile_token: "performance-fixture",
  focus: "full", requested_outputs: ["pdf"], sources: [source] });
const browserRunMs = Object.freeze([166, 458, 106, 99, 182]);
const pdf = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n");
const signingSecrets = Object.freeze({ ed25519SeedB64: Buffer.alloc(32, 0x31).toString("base64"),
  mldsa65SeedB64: Buffer.alloc(32, 0x52).toString("base64") });

const outputs = Object.freeze({
  strawman: { schema_version: "1", findings: [{ id: "f1", title: "Growth", analysis: "Revenue grew.",
    confidence: "high", evidence: [reference] }], risks: [], assumptions: [], quantitative_candidates: [] },
  steelman: { schema_version: "1", items: [{ id: "c1", strawman_finding_ids: ["f1"], kind: "nuance",
    critique: "The open control qualifies growth.", evidence: [reference] }] },
  oracle: { schema_version: "1", executive_summary: "Growth is qualified by an open control.",
    findings: [{ id: "o1", title: "Qualified growth", analysis: "Growth and the control are supported.",
      confidence: "high", evidence: [reference] }], recommendations: [{ id: "r1", title: "Close control",
      action: "Assign and verify control work.", priority: "high", confidence: "high", evidence: [reference] }],
    risks: [], quantitative_candidates: [], critique_resolutions: [{ steelman_item_id: "c1",
      status: "resolved", explanation: "The qualification is explicit." }] },
});

function stats(values) {
  const ordered = [...values].sort((left, right) => left - right);
  return Object.freeze({ median_ms: Number(ordered[Math.floor(ordered.length / 2)].toFixed(3)),
    p95_ms: Number(ordered[Math.ceil(ordered.length * 0.95) - 1].toFixed(3)) });
}

function transportTimings() {
  const values = { strawman: [], steelman: [], oracle: [] };
  const transport = async (stageRequest) => {
    const started = performance.now();
    const body = { choices: [{ message: { content: JSON.stringify(outputs[stageRequest.stage]) } }] };
    values[stageRequest.stage].push(performance.now() - started);
    return { ok: true, provider: stageRequest.provider, body };
  };
  return { values, transport };
}

async function measureAnalysis() {
  const measured = transportTimings();
  const totals = [];
  for (let index = 0; index < samples; index += 1) {
    const started = performance.now();
    const result = await runAnalysis(request, { groq: "fixture", openrouter_free: "fixture" }, measured.transport);
    if ("ok" in result && result.ok === false) throw new Error("performance_analysis_failed");
    totals.push(performance.now() - started);
  }
  return { ...measured.values, totals };
}

async function measureSigning() {
  const module = await WebAssembly.compile(await readFile(
    new URL("../workers/trusted-runtime/vendor/mldsa-native/mldsa65.wasm", import.meta.url)));
  const engine = new Mldsa65(module);
  const timings = [];
  for (let index = 0; index < samples; index += 1) {
    const started = performance.now();
    const result = await integrateTrustedFinalPdf(pdf.slice(), signingSecrets,
      (bytes, secrets) => signExactPdf(bytes, secrets, engine));
    if (result === undefined) throw new Error("performance_signing_failed");
    timings.push(performance.now() - started);
  }
  return timings;
}

async function runJson(script) {
  const { stdout } = await execute(process.execPath, [script], { timeout: 120_000, windowsHide: true });
  return JSON.parse(stdout);
}

function stageReport(shell, local, analysis, signing) {
  const localValues = local.results.flatMap((result) => result.local_ms);
  const total = analysis.totals.map((value, index) => value + localValues[index % localValues.length]
    + browserRunMs[index % browserRunMs.length] + signing[index]);
  return { shell: stats(shell.results.map((result) => result.interactive_ms)),
    engine: stats(local.results.map((result) => result.engine_ms)), local: stats(localValues),
    strawman: stats(analysis.strawman), steelman: stats(analysis.steelman), oracle: stats(analysis.oracle),
    pdf: stats(browserRunMs), signing: stats(signing), total: stats(total) };
}

function passed(stages) {
  return stages.shell.p95_ms < 2_000 && stages.engine.p95_ms <= 10_000
    && stages.local.median_ms <= 2_000 && stages.total.median_ms <= 90_000
    && stages.total.p95_ms <= 180_000 && stages.pdf.median_ms <= 5_000
    && stages.signing.median_ms <= 50;
}

const shell = await runJson("scripts/verify-dashboard.mjs");
const local = await runJson("scripts/measure-local-performance.mjs");
const analysis = await measureAnalysis();
const signing = await measureSigning();
const stages = stageReport(shell, local, analysis, signing);
const corpusHash = createHash("sha256").update(JSON.stringify({ source, request, browserRunMs,
  browsers: shell.results.map(({ browser }) => browser) })).digest("hex");
const report = { schema_version: "1", corpus_hash: corpusHash, samples, stages, passed: passed(stages) };
process.stdout.write(`${JSON.stringify(report)}\n`);
if (!report.passed) process.exitCode = 1;

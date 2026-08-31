import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

import { buildFrozenCorpus } from "../tests/fixtures/pii-corpus.mjs";

const EXPECTED_CORPUS_SHA256 = "0c777c5fc3300eb0b00a29cf583b23ea6455a12a43d990531b88990d1d679467";
const STRUCTURED = new Set(["ADDRESS", "EMAIL", "PHONE", "CUSTOMER_ID", "PAYMENT_CARD"]);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadRedactor() {
  const built = await build({ absWorkingDir: root, entryPoints: ["frontend/input/redaction/redactor.ts"], bundle: true,
    write: false, format: "esm", platform: "browser", target: ["chrome120"], logLevel: "silent" });
  if (built.outputFiles.length !== 1) throw new Error("redactor_bundle_invalid");
  const url = `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].contents).toString("base64")}`;
  return import(url);
}

function request(text) {
  return Object.freeze({ schema_version: "1", sources: Object.freeze([Object.freeze({
    schema_version: "1", ordinal: 1,
    reference: Object.freeze({ kind: "txt_lines", line_start: 1, line_end: 1 }), content: text,
  })]) });
}

function detectedTypes(content) {
  return new Set([...content.matchAll(/\[([A-Z_]+)_[0-9]+\]/gu)].map((match) => match[1]));
}

function caseMetrics(testCase, redactRequest) {
  const result = redactRequest(request(testCase.text));
  const content = result.sources[0].content;
  const types = detectedTypes(content);
  let structuredExpected = 0;
  let structuredFound = 0;
  let namedExpected = 0;
  let namedFound = 0;
  for (const label of testCase.labels) {
    const found = !content.includes(label.value) && types.has(label.type);
    if (STRUCTURED.has(label.type)) {
      structuredExpected += 1;
      if (found) structuredFound += 1;
    } else {
      namedExpected += 1;
      if (found) namedFound += 1;
    }
  }
  const mustLeaks = testCase.mustRedact.filter((value) => content.includes(value)).length;
  return { structuredExpected, structuredFound, namedExpected, namedFound,
    predicted: result.placeholder_count, mustLeaks };
}

function ratio(numerator, denominator) {
  return denominator === 0 ? 1 : numerator / denominator;
}

function summarize(corpus, metrics, corpusSha256) {
  const totals = metrics.reduce((sum, value) => ({
    structuredExpected: sum.structuredExpected + value.structuredExpected,
    structuredFound: sum.structuredFound + value.structuredFound,
    namedExpected: sum.namedExpected + value.namedExpected,
    namedFound: sum.namedFound + value.namedFound,
    predicted: sum.predicted + value.predicted,
    mustLeaks: sum.mustLeaks + value.mustLeaks,
  }), { structuredExpected: 0, structuredFound: 0, namedExpected: 0,
    namedFound: 0, predicted: 0, mustLeaks: 0 });
  const entities = totals.structuredExpected + totals.namedExpected;
  const found = totals.structuredFound + totals.namedFound;
  const namedPrecision = ratio(totals.namedFound,
    Math.max(totals.namedFound, totals.predicted - totals.structuredFound));
  const report = { schema_version: "1", corpus_sha256: corpusSha256, cases: corpus.length, entities,
    structured_recall: ratio(totals.structuredFound, totals.structuredExpected),
    named_recall: ratio(totals.namedFound, totals.namedExpected), named_precision: namedPrecision,
    overall_recall: ratio(found, entities), overall_precision: ratio(found, totals.predicted),
    must_redact_leaks: totals.mustLeaks };
  return Object.freeze({ ...report, passed: corpusSha256 === EXPECTED_CORPUS_SHA256
    && corpus.length === 84 && entities === 576 && report.structured_recall === 1
    && report.named_recall >= 0.95 && report.named_precision >= 0.8
    && report.overall_recall >= 0.97 && report.overall_precision >= 0.85
    && report.must_redact_leaks === 0 });
}

const corpus = buildFrozenCorpus();
const corpusSha256 = createHash("sha256").update(JSON.stringify(corpus)).digest("hex");
const { redactRequest } = await loadRedactor();
const report = summarize(corpus, corpus.map((testCase) => caseMetrics(testCase, redactRequest)), corpusSha256);
process.stdout.write(`${JSON.stringify(report)}\n`);
if (!report.passed) process.exitCode = 1;

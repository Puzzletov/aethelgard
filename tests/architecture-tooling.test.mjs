import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { lintArchitecture, taskContext } from "../scripts/architecture-spec.mjs";

const architecture = await readFile(new URL("../ARCHITECTURE.md", import.meta.url), "utf8");
const implementation = Object.fromEntries(await Promise.all([
  "src/public-edge/config.ts",
  "frontend/input/document-input.ts",
  "frontend/input/preflight/zip.ts",
  "frontend/input/preflight/run-preflight.ts",
  "frontend/input/parsers/pdf-parser.ts",
  "frontend/input/parsers/docx-parser.ts",
  "frontend/input/parsers/pptx-parser.ts",
  "frontend/input/parsers/xlsx-parser.ts",
  "workers/trusted-runtime/src/browser-quota.ts",
  "workers/trusted-runtime/src/pdf-queue.ts",
  "workers/trusted-runtime/src/browser-pdf.ts",
  "workers/trusted-runtime/src/hybrid-signing.ts",
].map(async (path) => [path, await readFile(new URL(`../${path}`, import.meta.url), "utf8")])));

test("authoritative architecture passes deterministic lint", () => {
  assert.deepEqual(lintArchitecture(architecture), []);
});

test("lint detects structural, contract, registry and authorization defects", () => {
  const mutations = [
    architecture.replace("# 21. CANONICAL FAILURE REGISTRY", "# 20. CANONICAL FAILURE REGISTRY"),
    architecture.replace("| 42 | Active |", "| 41 | Active |"),
    architecture.replace("## Task 5.3", "## Task 5.2"),
    architecture.replace("Purpose: Preserve the local identity map", "Intent: Preserve the local identity map"),
    architecture.replace("`B-IDENTITY-MAP-ENTRIES`", "`B-UNKNOWN-BOUND`"),
    architecture.replace("`S-IDENTITY-MAP`", "`S-UNKNOWN-SCHEMA`"),
    architecture.replace("`F-REDACTION-FAILURE`", "`F-UNKNOWN-FAILURE`"),
    architecture.replace("| B-SOURCE-BYTES |", "| B-SOURCE-BYTES |\n| B-SOURCE-BYTES |"),
    architecture.replace("### S-SOURCE-REFERENCE", "### S-SOURCE-REFERENCE\n### S-SOURCE-REFERENCE"),
    architecture.replace("## PHASE 5 EXIT GATE", "## PHASE 5 REVIEW"),
    architecture.replace("Owner-reviewed production promotion", "Release"),
    architecture.replace("The remaining tasks are a strict chain", "Suggested task sequence"),
    architecture.replace("The remaining tasks are a strict chain", "Phase 6 is unauthorized. The remaining tasks are a strict chain"),
    architecture.replace("Exact object `{schema_version:\"2\",turnstile_token", "Exact object TBD `{schema_version:\"2\",turnstile_token"),
  ];
  for (const mutated of mutations) assert.notDeepEqual(lintArchitecture(mutated), []);
});

test("task context contains only the task and its referenced registry entries", () => {
  const context = taskContext(architecture, "5.1");
  assert.match(context, /Task 5\.1 — Browser-private identity map handoff/);
  assert.match(context, /### B-IDENTITY-MAP-ENTRIES/);
  assert.match(context, /### S-IDENTITY-MAP/);
  assert.match(context, /### F-REDACTION-FAILURE/);
  assert.doesNotMatch(context, /Task 5\.2 — Exact local restoration/);
  assert.doesNotMatch(context, /### B-RESTORATION-TOKENS/);
});

test("task context rejects unknown tasks", () => {
  assert.throws(() => taskContext(architecture, "9.9"), /Unknown task/);
});

test("architecture hash command uses exact staged Git blob bytes", () => {
  const options = { cwd: new URL("..", import.meta.url), encoding: "buffer" };
  const blob = execFileSync("git", ["cat-file", "blob", ":ARCHITECTURE.md"], options);
  const output = execFileSync(process.execPath, ["scripts/architecture-hash.mjs", "--index"], options);
  assert.equal(output.toString("utf8").trim(), createHash("sha256").update(blob).digest("hex"));
});

test("Architecture 2.2 preserves proven platform contracts as evidence", () => {
  assert.match(architecture, /GBP 0\.00[\s\S]*USD 0\.00/);
  assert.match(architecture, /a literally secret-free public edge/);
  assert.match(architecture, /There is no dispatcher Worker/);
  assert.match(implementation["src/public-edge/config.ts"], /MAX_ANALYSIS_BODY_BYTES = 512 \* 1024/);
  assert.match(implementation["workers/trusted-runtime/src/browser-quota.ts"], /8 \* 60 \* 1_000/);
  assert.match(implementation["workers/trusted-runtime/src/pdf-queue.ts"], /MAX_FINAL_PDF_QUEUE_DEPTH = 2/);
  assert.match(implementation["workers/trusted-runtime/src/browser-pdf.ts"], /MAX_FINAL_PDF_BYTES = 8 \* 1024 \* 1024/);
  assert.match(implementation["workers/trusted-runtime/src/hybrid-signing.ts"], /ed25519_algorithm: "Ed25519"[\s\S]*mldsa65_algorithm: "ML-DSA-65"/);
});

test("Architecture 2.2 preserves proven parser bounds without drift", () => {
  assert.match(implementation["frontend/input/document-input.ts"], /MAX_SOURCE_BYTES = 15 \* 1024 \* 1024/);
  assert.match(implementation["frontend/input/preflight/run-preflight.ts"], /PREFLIGHT_TIMEOUT_MS = 10_000/);
  assert.match(implementation["frontend/input/preflight/zip.ts"], /MAX_ARCHIVE_ENTRIES = 512[\s\S]*MAX_ARCHIVE_TOTAL_BYTES = 64 \* 1024 \* 1024[\s\S]*MAX_ARCHIVE_RATIO = 100/);
  assert.match(implementation["frontend/input/parsers/pdf-parser.ts"], /MAX_PDF_PAGES = 500[\s\S]*MAX_PDF_DOCUMENT_CODE_POINTS = 2_000_000/);
  assert.match(implementation["frontend/input/parsers/docx-parser.ts"], /MAX_DOCX_SOURCES = 20_000/);
  assert.match(implementation["frontend/input/parsers/pptx-parser.ts"], /MAX_PPTX_SLIDES = 500/);
  assert.match(implementation["frontend/input/parsers/xlsx-parser.ts"], /MAX_XLSX_SHEETS = 200[\s\S]*MAX_XLSX_SOURCES = 100_000/);
});

test("Architecture 2.2 preserves the English-first rule and records EDR 42", () => {
  assert.match(architecture, /accept only valid top-ranked\s+`eng`/);
  assert.doesNotMatch(architecture, /\| B-LANGUAGE-MARGIN \||round\(\(eng_score - runner_up_score\)/);
  assert.match(architecture, /\| 39 \| Active \| English-first language rule \|/);
  assert.match(architecture, /\| 40 \| Active \| Ten-second Siteverify timeout \|/);
  assert.match(architecture, /\| 41 \| Active \| One-call MVP golden spine \|/);
  assert.match(architecture, /\| 42 \| Active \| Privacy-gateway mission and local identity restoration \|/);
});

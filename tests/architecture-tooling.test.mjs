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
    architecture.replace("# 55. CANONICAL FAILURE REGISTRY", "# 54. CANONICAL FAILURE REGISTRY"),
    architecture.replace("| 37 | Active |", "| 36 | Active |"),
    architecture.replace("## Task 1.22", "## Task 1.21"),
    architecture.replace("Purpose: Accept one supported", "Intent: Accept one supported"),
    architecture.replace("`B-SOURCE-BYTES`", "`B-UNKNOWN-BOUND`"),
    architecture.replace("`S-BROWSER-INPUT-RESULT`", "`S-UNKNOWN-SCHEMA`"),
    architecture.replace("`F-UNSUPPORTED-FORMAT`", "`F-UNKNOWN-FAILURE`"),
    architecture.replace("| B-SOURCE-BYTES |", "| B-SOURCE-BYTES |\n| B-SOURCE-BYTES |"),
    architecture.replace("### S-BROWSER-INPUT-RESULT", "### S-BROWSER-INPUT-RESULT\n### S-BROWSER-INPUT-RESULT"),
    architecture.replace("## PHASE 1 EXIT GATE", "## PHASE 1 REVIEW"),
    architecture.replace("## Task 4.12 — Final production release and live verification", "## Task 4.12 — Release"),
    architecture.replace("Implement only after explicit owner authorization", "Suggested task sequence"),
    architecture.replace("Tasks are binding", "Phase 2 is not authorized. Tasks are binding"),
    architecture.replace("The public analysis request is exactly", "The public analysis request is TBD and"),
  ];
  for (const mutated of mutations) assert.notDeepEqual(lintArchitecture(mutated), []);
});

test("task context contains only the task and its referenced registry entries", () => {
  const context = taskContext(architecture, "1.3");
  assert.match(context, /Task 1\.3 — PDF parser/);
  assert.match(context, /### B-PARSER-TIMEOUT-MS/);
  assert.match(context, /### S-PARSER-REQUEST/);
  assert.match(context, /### F-PARSER-CRASH/);
  assert.doesNotMatch(context, /Task 1\.4 — DOCX parser/);
  assert.doesNotMatch(context, /### B-DOCX-PARAGRAPHS/);
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

test("hardening preserves completed Phase 0 contracts", () => {
  assert.match(architecture, /GBP 0\.00[\s\S]*USD 0\.00/);
  assert.match(architecture, /public edge Worker has \*\*zero secret bindings\*\*/);
  assert.match(architecture, /Do not add a Service Binding dispatcher/);
  assert.match(implementation["src/public-edge/config.ts"], /MAX_ANALYSIS_BODY_BYTES = 512 \* 1024/);
  assert.match(implementation["workers/trusted-runtime/src/browser-quota.ts"], /8 \* 60 \* 1_000/);
  assert.match(implementation["workers/trusted-runtime/src/pdf-queue.ts"], /MAX_FINAL_PDF_QUEUE_DEPTH = 2/);
  assert.match(implementation["workers/trusted-runtime/src/browser-pdf.ts"], /MAX_FINAL_PDF_BYTES = 8 \* 1024 \* 1024/);
  assert.match(implementation["workers/trusted-runtime/src/hybrid-signing.ts"], /ed25519_algorithm: "Ed25519"[\s\S]*mldsa65_algorithm: "ML-DSA-65"/);
});

test("hardening promotes passing Phase 1.1 through 1.6 bounds without drift", () => {
  assert.match(implementation["frontend/input/document-input.ts"], /MAX_SOURCE_BYTES = 15 \* 1024 \* 1024/);
  assert.match(implementation["frontend/input/preflight/run-preflight.ts"], /PREFLIGHT_TIMEOUT_MS = 10_000/);
  assert.match(implementation["frontend/input/preflight/zip.ts"], /MAX_ARCHIVE_ENTRIES = 512[\s\S]*MAX_ARCHIVE_TOTAL_BYTES = 64 \* 1024 \* 1024[\s\S]*MAX_ARCHIVE_RATIO = 100/);
  assert.match(implementation["frontend/input/parsers/pdf-parser.ts"], /MAX_PDF_PAGES = 500[\s\S]*MAX_PDF_DOCUMENT_CODE_POINTS = 2_000_000/);
  assert.match(implementation["frontend/input/parsers/docx-parser.ts"], /MAX_DOCX_SOURCES = 20_000/);
  assert.match(implementation["frontend/input/parsers/pptx-parser.ts"], /MAX_PPTX_SLIDES = 500/);
  assert.match(implementation["frontend/input/parsers/xlsx-parser.ts"], /MAX_XLSX_SHEETS = 200[\s\S]*MAX_XLSX_SOURCES = 100_000/);
});

import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

import { runBrowserParserProof, supportedBrowserExecutables } from "./browser-parser-proof.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sampleText = "Alice Johnson leads the Northstar programme in London and reviews delivery controls every week with the finance team.";

function pdfObject(identifier, body) {
  return Buffer.from(`${identifier} 0 obj\n${body}\nendobj\n`, "ascii");
}

function fixturePdf() {
  const stream = `BT /F1 12 Tf 72 720 Td (${sampleText}) Tj ET`;
  const objects = [
    pdfObject(1, "<</Type/Catalog/Pages 2 0 R>>"),
    pdfObject(2, "<</Type/Pages/Kids[3 0 R]/Count 1>>"),
    pdfObject(3, "<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>"),
    pdfObject(4, "<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>"),
    pdfObject(5, `<</Length ${Buffer.byteLength(stream)}>>\nstream\n${stream}\nendstream`),
  ];
  const parts = [Buffer.from("%PDF-1.7\n", "ascii")];
  const offsets = [];
  let length = parts[0].byteLength;
  for (const object of objects) { offsets.push(length); parts.push(object); length += object.byteLength; }
  const rows = offsets.map((value) => `${value.toString().padStart(10, "0")} 00000 n `);
  parts.push(Buffer.from(`xref\n0 6\n0000000000 65535 f \n${rows.join("\n")}\ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n${length}\n%%EOF\n`, "ascii"));
  return Buffer.concat(parts);
}

async function bundle(entryPoint) {
  const result = await build({ absWorkingDir: root, entryPoints: [entryPoint], bundle: true,
    write: false, format: "esm", platform: "browser", target: ["chrome120"], logLevel: "silent" });
  if (result.outputFiles.length !== 1) throw new Error("performance_bundle_invalid");
  return result.outputFiles[0].text;
}

function proofWorker() {
  return `
import { loadPyodide } from "/pyodide/pyodide.mjs";
import { evaluateEnglishLanguage } from "/performance/language.js";
import { redactRequest } from "/performance/redactor.js";
const coldStarted = performance.now();
const pyodide = await loadPyodide({ indexURL: new URL("/pyodide/", location.origin).href,
  packages: ["cryptography", "charset-normalizer"], stdout: () => undefined, stderr: () => undefined });
const [wheelResponse, parserResponse, fixtureResponse] = await Promise.all([
  fetch("/pyodide/pdfminer_six-20260107-py3-none-any.whl"), fetch("/parser/pdf_parser.py"), fetch("/fixture")]);
if (!wheelResponse.ok || !parserResponse.ok || !fixtureResponse.ok) throw new Error("asset_fetch_failed");
const wheel = new Uint8Array(await wheelResponse.arrayBuffer());
const parserSource = await parserResponse.text();
const fixture = new Uint8Array(await fixtureResponse.arrayBuffer());
pyodide.unpackArchive(wheel, "wheel"); wheel.fill(0);
const engineMs = performance.now() - coldStarted;
async function localJourney() {
  const started = performance.now();
  const bytes = fixture.slice(); pyodide.FS.writeFile("/tmp/aethelgard-source.pdf", bytes);
  let parsed;
  try { parsed = JSON.parse(await pyodide.runPythonAsync(parserSource)); }
  finally { pyodide.FS.unlink("/tmp/aethelgard-source.pdf"); bytes.fill(0); }
  const sources = parsed.pages.map((page, index) => ({ schema_version: "1", ordinal: index + 1,
    reference: { kind: "pdf_page", page: page.page }, content: page.content }));
  if (!evaluateEnglishLanguage(sources).accepted) throw new Error("language_gate_failed");
  const redacted = redactRequest({ schema_version: "1", sources });
  if (redacted.must_redact_leaks !== 0 || redacted.placeholder_count < 1) throw new Error("redaction_failed");
  return performance.now() - started;
}
await localJourney();
const localMs = [];
for (let index = 0; index < 5; index += 1) localMs.push(await localJourney());
fixture.fill(0);
self.postMessage({ status: "ok", engine_ms: engineMs, local_ms: localMs });
`;
}

const modules = Object.freeze({
  "/performance/language.js": await bundle("frontend/input/validation/language-gate.ts"),
  "/performance/redactor.js": await bundle("frontend/input/redaction/redactor.ts"),
});
const results = [];
for (const browser of supportedBrowserExecutables()) {
  results.push({ browser: browser.name,
    ...await runBrowserParserProof(fixturePdf(), proofWorker(), browser.executable, modules) });
}
if (results.some((result) => result.status !== "ok")) throw new Error(JSON.stringify(results));
process.stdout.write(`${JSON.stringify({ status: "ok", results })}\n`);

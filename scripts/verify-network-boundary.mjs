import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

import { runBrowserPageProof, supportedBrowserExecutables } from "./browser-parser-proof.mjs";
import { buildZip } from "../frontend/tests/zip-fixture.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function bundle(entryPoint, stubPyodide = false) {
  const plugins = stubPyodide ? [{ name: "unreached-pyodide-parser-path",
    setup(pluginBuild) {
      pluginBuild.onResolve({ filter: /^pyodide$/ }, () => ({ path: "pyodide", namespace: "proof" }));
      pluginBuild.onLoad({ filter: /.*/, namespace: "proof" }, () => ({
        contents: "export async function loadPyodide(){throw new Error('parse_path_not_executed')}"
      }));
    } }] : [];
  const result = await build({ absWorkingDir: root, entryPoints: [entryPoint], bundle: true,
    write: false, format: "esm", platform: "browser", target: ["chrome120"], logLevel: "silent", plugins });
  if (result.outputFiles.length !== 1) throw new Error("boundary_bundle_invalid");
  return result.outputFiles[0].text;
}

function office(format, marker) {
  const contentTypes = {
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml",
  };
  const parts = { docx: "word/document.xml", pptx: "ppt/presentation.xml", xlsx: "xl/workbook.xml" };
  return buildZip([
    { name: "[Content_Types].xml", content: `<Types><Override ContentType="${contentTypes[format]}"/></Types>`, store: true },
    { name: "_rels/.rels", content: "<Relationships/>", store: true },
    { name: parts[format], content: `<document><p>${marker}</p></document>`, store: true },
  ]);
}

function fixtures() {
  const values = [
    ["pdf", "private-proof.pdf", Buffer.from("%PDF-1.7\n%RAW-PDF-5811\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF")],
    ["docx", "private-proof.docx", office("docx", "RAW-DOCX-5812")],
    ["pptx", "private-proof.pptx", office("pptx", "RAW-PPTX-5813")],
    ["xlsx", "private-proof.xlsx", office("xlsx", "RAW-XLSX-5814")],
    ["csv", "private-proof.csv", Buffer.from("name,value\nRAW-CSV-5815,1\n")],
    ["txt", "private-proof.txt", Buffer.from("RAW-TXT-5816 private proof text")],
  ];
  return values.map(([format, name, bytes]) => ({ format, name, bytes: bytes.toString("base64") }));
}

const PAGE_PROOF_SOURCE = `
import { runDocumentPreflight } from "/boundary/preflight-controller.js";
import { runRedactionWorker } from "/boundary/redaction-controller.js";
const fixtures = __AETHELGARD_FIXTURES__;
const privateText = "Alice Zhang works at Northstar Analytics in London. Email: alice.zhang@example.test. Customer ID: CUST-100001. Payment card: 4111111111111111.";
const references = [
  { kind: "pdf_page", page: 1 }, { kind: "docx_paragraph", paragraph: 1 },
  { kind: "pptx_slide", slide: 1 }, { kind: "xlsx_cell", sheet: 1, cell: "A1" },
  { kind: "csv_field", row: 1, column: 1 }, { kind: "txt_lines", line_start: 1, line_end: 1 },
];
const requests = [];
let storageWrites = 0;
const nativeFetch = globalThis.fetch.bind(globalThis);
const nativeSetItem = Storage.prototype.setItem;
const nativeRemoveItem = Storage.prototype.removeItem;
const nativeClear = Storage.prototype.clear;
Storage.prototype.setItem = function(...args) { storageWrites += 1; return nativeSetItem.apply(this, args); };
Storage.prototype.removeItem = function(...args) { storageWrites += 1; return nativeRemoveItem.apply(this, args); };
Storage.prototype.clear = function(...args) { storageWrites += 1; return nativeClear.apply(this, args); };
const nativeIndexedDbOpen = indexedDB.open.bind(indexedDB);
const nativeIndexedDbDelete = indexedDB.deleteDatabase.bind(indexedDB);
indexedDB.open = (...args) => { storageWrites += 1; return nativeIndexedDbOpen(...args); };
indexedDB.deleteDatabase = (...args) => { storageWrites += 1; return nativeIndexedDbDelete(...args); };
const nativeCacheOpen = caches.open.bind(caches);
const nativeCacheDelete = caches.delete.bind(caches);
caches.open = (...args) => { storageWrites += 1; return nativeCacheOpen(...args); };
caches.delete = (...args) => { storageWrites += 1; return nativeCacheDelete(...args); };
const cookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");
if (cookieDescriptor?.set) Object.defineProperty(Document.prototype, "cookie", { ...cookieDescriptor,
  set(value) { storageWrites += 1; cookieDescriptor.set.call(this, value); } });
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(input instanceof Request ? input.url : String(input), location.href).href;
  const body = typeof init.body === "string" ? init.body : "";
  requests.push({ url, method: init.method ?? "GET", body });
  return nativeFetch(input, init);
};
function trackedWorker(url) {
  const worker = new Worker(url, { type: "module" });
  workersCreated += 1;
  const nativeTerminate = worker.terminate.bind(worker);
  let terminated = false;
  worker.terminate = () => { if (!terminated) { terminated = true; workersTerminated += 1; } nativeTerminate(); };
  return worker;
}
function strictAnalyze(value, body) {
  if (Object.keys(value).sort().join("|") !== "focus|requested_outputs|schema_version|sources|turnstile_token") return false;
  if (value.schema_version !== "1" || value.focus !== "full"
    || JSON.stringify(value.requested_outputs) !== '["pdf"]' || value.sources.length !== 6) return false;
  if (new TextEncoder().encode(body).byteLength > 524288) return false;
  return value.sources.every((source, index) => Object.keys(source).sort().join("|") === "content|ordinal|reference|schema_version"
    && source.schema_version === "1" && source.ordinal === index + 1
    && typeof source.content === "string" && source.content.includes("[")
    && typeof source.reference.kind === "string");
}
function countLeaks(observed, needles) {
  return needles.filter((needle) => observed.includes(needle)).length;
}
let workersCreated = 0;
let workersTerminated = 0;
export async function runProof() {
  const selectionStarted = performance.now();
  await fetch("/proof-asset.js");
  await fetch("/turnstile-proof", { method: "POST", body: "synthetic-turnstile-token" });
  for (const fixture of fixtures) {
    const bytes = Uint8Array.from(atob(fixture.bytes), (value) => value.charCodeAt(0));
    const file = new File([bytes], fixture.name, { type: "application/octet-stream" });
    const result = await runDocumentPreflight({ file, format: fixture.format, byteLength: bytes.byteLength },
      () => trackedWorker("/boundary/parser-worker.js"));
    bytes.fill(0);
    if (!result.ok) throw new Error("preflight_failed:" + fixture.format);
  }
  const sources = references.map((reference, index) => ({ schema_version: "1", ordinal: index + 1,
    reference, content: privateText }));
  const redacted = await runRedactionWorker({ schema_version: "1", sources },
    () => trackedWorker("/boundary/redaction-worker.js"));
  if ("ok" in redacted && redacted.ok === false) throw new Error("redaction_failed");
  const analyze = { schema_version: "1", turnstile_token: "synthetic-turnstile-token",
    focus: "full", requested_outputs: ["pdf"], sources: redacted.sources };
  const analyzeBody = JSON.stringify(analyze);
  if (!strictAnalyze(analyze, analyzeBody)) throw new Error("analyze_schema_invalid");
  await fetch("/analyze-proof", { method: "POST", headers: { "content-type": "application/json" }, body: analyzeBody });
  const resourceUrls = performance.getEntriesByType("resource").filter((entry) => entry.startTime >= selectionStarted)
    .map((entry) => entry.name).filter((url) => !requests.some((request) => request.url === url));
  const observed = JSON.stringify(requests) + JSON.stringify(resourceUrls);
  const rawMarkers = ["RAW-PDF-5811", "RAW-DOCX-5812", "RAW-PPTX-5813", "RAW-XLSX-5814", "RAW-CSV-5815", "RAW-TXT-5816"];
  const filenames = fixtures.map((fixture) => fixture.name);
  const rawPii = [privateText, "Alice Zhang", "Northstar Analytics", "alice.zhang@example.test",
    "CUST-100001", "4111111111111111"];
  const rawSourceEgress = countLeaks(observed, [...rawMarkers, ...fixtures.map((fixture) => fixture.bytes)]);
  const unredactedEgress = countLeaks(observed, rawPii);
  const filenameEgress = countLeaks(observed, filenames);
  const mappingEgress = /mapping|\\u0000PERSON|\\u0000EMAIL/iu.test(observed) ? 1 : 0;
  const objectUrlEgress = observed.includes("blob:") ? 1 : 0;
  const analysisIndex = requests.findIndex((request) => request.url.endsWith("/analyze-proof"));
  const priorDocumentEgress = requests.slice(0, analysisIndex).some((request) => request.body.includes("[PERSON_"));
  const turnstileSafe = requests.find((request) => request.url.endsWith("/turnstile-proof"))?.body === "synthetic-turnstile-token";
  const result = { schema_version: "1", requests_observed: requests.length + resourceUrls.length,
    storage_writes: storageWrites, raw_source_egress: rawSourceEgress,
    unredacted_text_egress: unredactedEgress, filename_egress: filenameEgress,
    mapping_egress: mappingEgress, workers_terminated: workersCreated === workersTerminated,
    passed: false };
  result.passed = result.requests_observed <= 128 && result.storage_writes === 0
    && rawSourceEgress === 0 && unredactedEgress === 0 && filenameEgress === 0
    && mappingEgress === 0 && objectUrlEgress === 0 && !priorDocumentEgress
    && analysisIndex >= 0 && turnstileSafe && result.workers_terminated;
  return result;
}
`;

function pageProof(fixtureJson) {
  return PAGE_PROOF_SOURCE.replace("__AETHELGARD_FIXTURES__", fixtureJson);
}

const modules = Object.freeze({
  "/boundary/preflight-controller.js": await bundle("frontend/input/preflight/run-preflight.ts"),
  "/boundary/parser-worker.js": await bundle("frontend/workers/parser.worker.ts", true),
  "/boundary/redaction-controller.js": await bundle("frontend/input/redaction/run-redaction.ts"),
  "/boundary/redaction-worker.js": await bundle("frontend/input/redaction/redaction-worker.ts"),
  "/proof-asset.js": "export const asset = true;",
  "/turnstile-proof": "ok",
  "/analyze-proof": "ok",
});
const results = [];
for (const browser of supportedBrowserExecutables()) {
  results.push({ browser: browser.name,
    ...await runBrowserPageProof(pageProof(JSON.stringify(fixtures())), browser.executable, modules) });
}
process.stdout.write(`${JSON.stringify({ status: "ok", results })}\n`);

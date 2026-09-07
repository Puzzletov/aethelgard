import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { runBrowserPageProof, supportedBrowserExecutables } from "./browser-parser-proof.mjs";
import { buildZip } from "../frontend/tests/zip-fixture.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function bundle(entry) {
  const result = await build({ absWorkingDir: root, entryPoints: [entry], bundle: true, write: false,
    format: "esm", platform: "browser", target: ["chrome120"], logLevel: "silent" });
  return result.outputFiles[0].text;
}

function fixtures() {
  const docx = buildZip([
    { name: "[Content_Types].xml", content: '<Types><Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>' },
    { name: "_rels/.rels", content: "<Relationships/>" },
    { name: "word/document.xml", content: "<document><p>Plain English paragraph.</p></document>" },
  ]);
  return [["txt", "minimal.txt", Buffer.from("A few plain English words.")],
    ["csv", "minimal.csv", Buffer.from("name,value\nalpha,1\n")],
    ["pdf", "minimal.pdf", Buffer.from("%PDF-1.7\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF")],
    ["docx", "minimal.docx", docx]].map(([format, name, bytes]) => ({
      format, name, bytes: bytes.toString("base64"), byteLength: bytes.byteLength,
    }));
}

const page = `
import { selectBrowserDocument } from "/input/select.js";
import { runDocumentPreflight } from "/input/preflight.js";
import { runParserWorker } from "/input/parser-controller.js";
const fixtures = ${JSON.stringify(fixtures())};
let externalRequests = 0; let storageWrites = 0;
const nativeFetch = fetch.bind(globalThis);
globalThis.fetch = (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input), location.href);
  if (url.origin !== location.origin) externalRequests += 1;
  return nativeFetch(input, init);
};
for (const method of ["setItem", "removeItem", "clear"]) {
  const native = Storage.prototype[method];
  Storage.prototype[method] = function(...args) { storageWrites += 1; return native.apply(this, args); };
}
function worker(url, kinds) {
  const value = new Worker(url, { type: "module" });
  const native = value.postMessage.bind(value);
  value.postMessage = (message, transfer) => { kinds.push(message.kind); native(message, transfer); };
  return value;
}
export async function runProof() {
  const rows = [];
  for (const fixture of fixtures) {
    const bytes = Uint8Array.from(atob(fixture.bytes), value => value.charCodeAt(0));
    const selection = selectBrowserDocument([new File([bytes], fixture.name)]);
    if (!selection.ok) throw new Error("selection:" + fixture.format);
    const kinds = [];
    const preflight = await runDocumentPreflight(selection.document,
      () => worker("/input/preflight-worker.js", kinds));
    const parser = preflight.ok ? await runParserWorker(selection.document,
      () => worker("/input/parser-entry-worker.js", kinds)) : { ok: false };
    rows.push({ format: fixture.format, selected_bytes: bytes.byteLength,
      detected_format: selection.document.format, preflight_request_kind: kinds[0],
      preflight_result: preflight.ok ? "pass" : "fail", internal_code: preflight.code ?? null,
      visible_message: preflight.message ?? null, parser_request_kind: kinds[1] ?? null,
      parser_entry: parser.ok });
    bytes.fill(0);
  }
  const passed = rows.every(row => row.preflight_result === "pass" && row.internal_code === null
    && row.visible_message === null && row.preflight_request_kind === "preflight"
    && row.parser_request_kind === "parse_" + row.format && row.parser_entry);
  return { status: passed && externalRequests === 0 && storageWrites === 0 ? "ok" : "failed",
    rows, external_requests: externalRequests, storage_writes: storageWrites };
}`;

const modules = {
  "/input/select.js": await bundle("frontend/input/document-input.ts"),
  "/input/preflight.js": await bundle("frontend/input/preflight/run-preflight.ts"),
  "/input/parser-controller.js": await bundle("frontend/input/parsers/run-parser.ts"),
  "/input/preflight-worker.js": await bundle("frontend/workers/preflight.worker.ts"),
  "/input/parser-entry-worker.js": "self.onmessage=(event)=>self.postMessage({schema_version:'1',format:event.data.format,sources:[{content:'entry'}]});",
};
const results = [];
for (const browser of supportedBrowserExecutables()) {
  results.push({ browser: browser.name, ...await runBrowserPageProof(page, browser.executable, modules) });
}
if (results.some((result) => result.status !== "ok")) throw new Error(JSON.stringify(results));
process.stdout.write(`${JSON.stringify({ status: "ok", results })}\n`);

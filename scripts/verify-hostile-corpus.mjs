import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

import { runBrowserPageProof, supportedBrowserExecutables } from "./browser-parser-proof.mjs";
import { hostileCorpusCases, MAX_SOURCE_BYTES } from "../tests/fixtures/hostile/corpus.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(new URL("../tests/fixtures/hostile/manifest.json", import.meta.url), "utf8"));

async function bundle(entryPoint, stubPyodide = false) {
  const plugins = stubPyodide ? [{
    name: "unreached-hostile-parser-path",
    setup(pluginBuild) {
      pluginBuild.onResolve({ filter: /^pyodide$/ }, () => ({ path: "pyodide", namespace: "proof" }));
      pluginBuild.onLoad({ filter: /.*/, namespace: "proof" }, () => ({
        contents: "export async function loadPyodide(){throw new Error('hostile_parse_path_reached')}",
      }));
    },
  }] : [];
  const result = await build({ absWorkingDir: root, entryPoints: [entryPoint], bundle: true,
    write: false, format: "esm", platform: "browser", target: ["chrome120"], logLevel: "silent", plugins });
  if (result.outputFiles.length !== 1) throw new Error("hostile_bundle_invalid");
  return result.outputFiles[0].text;
}

function browserCases() {
  return hostileCorpusCases().map((fixture, index) => {
    const expected = manifest.cases[index];
    if (expected?.id !== fixture.id) throw new Error(`hostile_manifest_order:${fixture.id}`);
    const common = { id: fixture.id, filename: fixture.filename, format: fixture.format,
      expected_code: fixture.expectedCode, sha256: expected.sha256 };
    if (fixture.bytes.byteLength > MAX_SOURCE_BYTES) {
      return { ...common, byte_length: fixture.bytes.byteLength,
        prefix: fixture.bytes.subarray(0, 128).toString("base64") };
    }
    return { ...common, bytes: fixture.bytes.toString("base64") };
  });
}

const PAGE_SOURCE = `
import { selectBrowserDocument } from "/hostile/document-input.js";
import { runDocumentPreflight } from "/hostile/preflight-controller.js";
const fixtures = __HOSTILE_CASES__;
const externalRequests = [];
const nativeFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input), location.href);
  if (url.origin !== location.origin) { externalRequests.push(url.href); throw new Error("external_request"); }
  return nativeFetch(input, init);
};
function bytesFor(fixture) {
  if (fixture.bytes !== undefined) return Uint8Array.from(atob(fixture.bytes), value => value.charCodeAt(0));
  const bytes = new Uint8Array(fixture.byte_length);
  bytes.set(Uint8Array.from(atob(fixture.prefix), value => value.charCodeAt(0)));
  return bytes;
}
async function digest(bytes) {
  const value = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(value)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}
async function execute(fixture) {
  const bytes = bytesFor(fixture);
  if (await digest(bytes) !== fixture.sha256) throw new Error("hash_mismatch:" + fixture.id);
  const file = new File([bytes], fixture.filename, { type: "application/octet-stream" });
  const selection = selectBrowserDocument([file]);
  let actual;
  if (!selection.ok) actual = selection.code;
  else {
    const result = await runDocumentPreflight(selection.document,
      () => new Worker("/hostile/parser-worker.js", { type: "module" }));
    actual = result.ok ? "unexpected_pass" : result.code;
  }
  bytes.fill(0);
  return { id: fixture.id, expected: fixture.expected_code, actual };
}
export async function runProof() {
  const results = [];
  for (const fixture of fixtures) results.push(await execute(fixture));
  const resources = performance.getEntriesByType("resource").map(item => new URL(item.name, location.href));
  const externalResources = resources.filter(url => url.origin !== location.origin).map(url => url.href);
  const mismatches = results.filter(item => item.actual !== item.expected);
  return { schema_version: "1", corpus_version: 1, case_count: results.length,
    mismatches, external_requests: externalRequests.length + externalResources.length,
    passed: results.length === 47 && mismatches.length === 0
      && externalRequests.length === 0 && externalResources.length === 0 };
}
`;

const modules = Object.freeze({
  "/hostile/document-input.js": await bundle("frontend/input/document-input.ts"),
  "/hostile/preflight-controller.js": await bundle("frontend/input/preflight/run-preflight.ts"),
  "/hostile/parser-worker.js": await bundle("frontend/workers/parser.worker.ts", true),
});
const pageSource = PAGE_SOURCE.replace("__HOSTILE_CASES__", JSON.stringify(browserCases()));
const results = [];
for (const browser of supportedBrowserExecutables()) {
  results.push({ browser: browser.name, ...await runBrowserPageProof(pageSource, browser.executable, modules) });
}
process.stdout.write(`${JSON.stringify({ status: "ok", results })}\n`);

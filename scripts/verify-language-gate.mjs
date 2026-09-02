import { readFile } from "node:fs/promises";

import ts from "typescript";

import { runBrowserParserProof, supportedBrowserExecutables } from "./browser-parser-proof.mjs";

const frontend = new URL("../frontend/", import.meta.url);
const fixtures = JSON.parse(await readFile(new URL("../tests/fixtures/language.json", import.meta.url), "utf8"));

async function text(relative) {
  return readFile(new URL(relative, frontend), "utf8");
}

function replaceImport(source, dependency, target) {
  const single = `from '${dependency}'`;
  const double = `from "${dependency}"`;
  if (!source.includes(single) && !source.includes(double)) throw new Error(`missing_import:${dependency}`);
  return source.replaceAll(single, `from "${target}"`).replaceAll(double, `from "${target}"`);
}

async function browserModules() {
  const gate = ts.transpileModule(await text("input/validation/language-gate.ts"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const franc = replaceImport(await text("node_modules/franc-min/index.js"),
    "trigram-utils", "/language/trigram-utils/index.js");
  let trigrams = replaceImport(await text("node_modules/trigram-utils/index.js"),
    "n-gram", "/language/n-gram/index.js");
  trigrams = replaceImport(trigrams, "collapse-white-space", "/language/collapse-white-space/index.js");
  return Object.freeze({
    "/language/language-gate.js": replaceImport(gate, "franc-min", "/language/franc-min/index.js"),
    "/language/franc-min/index.js": franc,
    "/language/franc-min/data.js": await text("node_modules/franc-min/data.js"),
    "/language/franc-min/expressions.js": await text("node_modules/franc-min/expressions.js"),
    "/language/trigram-utils/index.js": trigrams,
    "/language/n-gram/index.js": await text("node_modules/n-gram/index.js"),
    "/language/collapse-white-space/index.js": await text("node_modules/collapse-white-space/index.js"),
  });
}

function proofWorker() {
  return `
import { evaluateEnglishLanguage } from "/language/language-gate.js";
const fixtures = __LANGUAGE_FIXTURES__;
let languageDataRequests = 0;
globalThis.fetch = async () => { languageDataRequests += 1; throw new Error("language_network_forbidden"); };
function record(fixture) {
  const reference = fixture.reference === "xlsx"
    ? { kind: "xlsx_cell", sheet: 1, cell: "A1" }
    : { kind: "txt_lines", line_start: 1, line_end: 1 };
  return [{ schema_version: "1", ordinal: 1, reference, content: fixture.content }];
}
const decisions = fixtures.fixtures.map(fixture => ({ id: fixture.id,
  decision: evaluateEnglishLanguage(record(fixture)) }));
const mismatches = decisions.filter((item, index) =>
  JSON.stringify(item.decision) !== JSON.stringify(fixtures.fixtures[index].expected));
self.postMessage({ status: "ok", schema_version: "1", fixture_count: decisions.length,
  decisions, mismatches, language_data_requests: languageDataRequests,
  passed: decisions.length === 9 && mismatches.length === 0 && languageDataRequests === 0 });
`;
}

const modules = await browserModules();
const workerSource = proofWorker().replace("__LANGUAGE_FIXTURES__", JSON.stringify(fixtures));
const results = [];
for (const browser of supportedBrowserExecutables()) {
  const result = await runBrowserParserProof(Buffer.alloc(0), workerSource, browser.executable, modules);
  results.push({ browser: browser.name, ...result });
}
process.stdout.write(`${JSON.stringify({ status: "ok", results })}\n`);

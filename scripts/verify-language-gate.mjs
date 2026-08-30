import { readFile } from "node:fs/promises";

import ts from "typescript";

import { runBrowserParserProof, supportedBrowserExecutables } from "./browser-parser-proof.mjs";

const frontend = new URL("../frontend/", import.meta.url);

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
const record = (content) => [{ schema_version: "1", ordinal: 1,
  reference: { kind: "txt_lines", line_start: 1, line_end: 1 }, content }];
const english = evaluateEnglishLanguage(record("This project provides a clear independent analysis of the evidence and explains every recommendation in plain English for careful review."));
const names = evaluateEnglishLanguage(record("This project provides a clear independent analysis of the evidence and explains every recommendation in plain English for careful review with Renée Dubois and José Álvarez named as reviewers."));
const french = evaluateEnglishLanguage(record("Cette analyse indépendante explique les preuves, identifie chaque risque important et présente des recommandations pratiques pour aider l'équipe à prendre une décision prudente."));
const mixed = evaluateEnglishLanguage(record("The review explains the evidence and material risks for the project. Cette analyse explique aussi les preuves et les risques importants pour le projet."));
const short = evaluateEnglishLanguage(record("This text is too short."));
const valid = english.accepted && names.accepted && english.margin >= 2000 && names.margin >= 2000
  && !french.accepted && french.reason === "non_english"
  && !mixed.accepted && mixed.reason === "mixed_or_uncertain"
  && !short.accepted && short.reason === "insufficient";
if (!valid) throw new Error("language_gate_invalid");
self.postMessage({ status: "ok", english_margin: english.margin, names_margin: names.margin,
  failures: [french.reason, mixed.reason, short.reason], external_network_requests: 0 });
`;
}

const modules = await browserModules();
const results = [];
for (const browser of supportedBrowserExecutables()) {
  const result = await runBrowserParserProof(Buffer.alloc(0), proofWorker(), browser.executable, modules);
  results.push({ browser: browser.name, ...result });
}
process.stdout.write(`${JSON.stringify({ status: "ok", results })}\n`);

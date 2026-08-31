import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../input/validation/language-gate.ts", import.meta.url), "utf8");
const francUrl = new URL("../node_modules/franc-min/index.js", import.meta.url).href;
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText.replace('from "franc-min"', `from ${JSON.stringify(francUrl)}`);
const { evaluateEnglishLanguage } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

function records(content) {
  return Object.freeze([Object.freeze({
    schema_version: "1",
    ordinal: 1,
    reference: Object.freeze({ kind: "txt_lines", line_start: 1, line_end: 1 }),
    content,
  })]);
}

const clearEnglish = "This project provides a clear independent analysis of the evidence and explains every recommendation in plain English for careful review.";
const internationalNames = "This project provides a clear independent analysis of the evidence and explains every recommendation in plain English for careful review with Renée Dubois and José Álvarez named as reviewers.";
const clearFrench = "Cette analyse indépendante explique les preuves, identifie chaque risque important et présente des recommandations pratiques pour aider l'équipe à prendre une décision prudente.";
const mixed = "The review explains the evidence and material risks for the project. Cette analyse explique aussi les preuves et les risques importants pour le projet.";

test("clear English and English with international names pass", () => {
  for (const content of [clearEnglish, internationalNames]) {
    const result = evaluateEnglishLanguage(records(content));
    assert.equal(result.accepted, true);
    assert.equal(result.language, "eng");
    assert.ok(result.margin >= 2_000);
  }
});

test("non-English, mixed or uncertain, and insufficient samples fail closed", () => {
  assert.deepEqual(evaluateEnglishLanguage(records(clearFrench)), {
    schema_version: "1", accepted: false, reason: "non_english",
  });
  assert.deepEqual(evaluateEnglishLanguage(records(mixed)), {
    schema_version: "1", accepted: false, reason: "mixed_or_uncertain",
  });
  assert.deepEqual(evaluateEnglishLanguage(records("This text is too short.")), {
    schema_version: "1", accepted: false, reason: "insufficient",
  });
});

test("whitespace normalization and the leading 20,000-code-point sample are deterministic", () => {
  const spaced = clearEnglish.replaceAll(" ", "\n\t");
  assert.deepEqual(evaluateEnglishLanguage(records(spaced)), evaluateEnglishLanguage(records(clearEnglish)));
  const prefix = clearEnglish.repeat(200);
  assert.deepEqual(evaluateEnglishLanguage(records(`${prefix} ${clearFrench.repeat(200)}`)),
    evaluateEnglishLanguage(records(prefix)));
});

test("language gate source is local-only and has no persistence or fallback", () => {
  assert.doesNotMatch(source, /fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB/i);
  assert.doesNotMatch(source, /translate|fallback|multilingual model/i);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../input/redaction/redactor.ts", import.meta.url), "utf8");
const compromiseUrl = new URL("../node_modules/compromise/src/three.js", import.meta.url).href;
const normalizationSource = await readFile(new URL("../input/normalization/source-record.ts", import.meta.url), "utf8");
const normalizationCompiled = ts.transpileModule(normalizationSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const normalizationUrl = `data:text/javascript;base64,${Buffer.from(normalizationCompiled).toString("base64")}`;
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText.replace('from "compromise"', `from ${JSON.stringify(compromiseUrl)}`)
  .replace('from "../normalization/source-record"', `from ${JSON.stringify(normalizationUrl)}`);
const { redactRequest } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

function sourceRecord(content, ordinal = 1) {
  return Object.freeze({ schema_version: "1", ordinal,
    reference: Object.freeze({ kind: "txt_lines", line_start: ordinal, line_end: ordinal }), content });
}

function request(...content) {
  return Object.freeze({ schema_version: "1",
    sources: Object.freeze(content.map((value, index) => sourceRecord(value, index + 1))) });
}

test("structured, context, and Compromise matches use typed stable placeholders", () => {
  const result = redactRequest(request(
    "Alice Zhang works at Northstar Analytics in London. Address: 14 Cedar Lane. "
      + "Email: alice.zhang@example.test. Phone: +44 20 7946 0958. "
      + "Customer ID: CUST-100001. Payment card: 4111111111111111.",
  ));
  const content = result.sources[0].content;
  for (const placeholder of ["[PERSON_1]", "[ORGANIZATION_1]", "[LOCATION_1]", "[ADDRESS_1]",
    "[EMAIL_1]", "[PHONE_1]", "[CUSTOMER_ID_1]", "[PAYMENT_CARD_1]"]) {
    assert.match(content, new RegExp(placeholder.replace(/[\[\]]/gu, "\\$&")));
  }
  assert.equal(result.placeholder_count, 8);
  assert.equal(result.must_redact_leaks, 0);
  assert.equal("mapping" in result, false);
});

test("higher-priority address context suppresses nested place NER", () => {
  const result = redactRequest(request("Address: 14 Cedar Lane."));
  assert.equal(result.sources[0].content, "Address: [ADDRESS_1].");
  assert.equal(result.placeholder_count, 1);
});

test("equal exact values reuse stable counters and distinct values advance them", () => {
  const result = redactRequest(request(
    "Email: one@example.test. Again: one@example.test. Other: two@example.test.",
  ));
  assert.equal(result.sources[0].content.match(/\[EMAIL_1\]/gu)?.length, 2);
  assert.equal(result.sources[0].content.match(/\[EMAIL_2\]/gu)?.length, 1);
  assert.equal(result.placeholder_count, 2);
});

test("unknown request fields, invalid records, and the mapping bound fail closed", () => {
  assert.throws(() => redactRequest({ ...request("safe text"), extra: true }), /invalid_redaction_request/);
  assert.throws(() => redactRequest({ schema_version: "1", sources: [sourceRecord("text", 2)] }),
    /invalid_redaction_request/);
  const identifiers = Array.from({ length: 10_001 }, (_, index) =>
    `CUST-${String(index).padStart(6, "0")}`).join(" ");
  assert.throws(() => redactRequest(request(identifiers.slice(0, 90_000), identifiers.slice(90_000))),
    /mapping_limit/);
});

test("mapping lifetime is internal and cleared on every path", () => {
  assert.match(source, /finally\s*\{[\s\S]*state\.values\.clear\(\)/u);
  assert.doesNotMatch(source, /fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB/i);
  assert.doesNotMatch(source, /rehydrat|postMessage/u);
});

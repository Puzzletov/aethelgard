import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const sourceUrl = new URL("../input/validation/word-limit.ts", import.meta.url);
const source = await readFile(sourceUrl, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { enforceWordLimit } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

function records(content) {
  return Object.freeze([Object.freeze({
    schema_version: "1",
    ordinal: 1,
    reference: Object.freeze({ kind: "txt_lines", line_start: 1, line_end: 1 }),
    content,
  })]);
}

function words(count) {
  return count === 0 ? "!?" : Array.from({ length: count }, () => "word").join(" ");
}

test("Unicode letter and number runs have exact small counts", () => {
  const cases = [[0, "!?"], [1, "Renée"], [4, "Renée 42 東京 test"]];
  for (const [expected, content] of cases) {
    const result = enforceWordLimit(records(content));
    assert.equal(result.ok, true);
    assert.equal(result.word_count, expected);
  }
});

test("7,999 and 8,000 words pass without truncation", () => {
  for (const count of [7_999, 8_000]) {
    const input = records(words(count));
    const result = enforceWordLimit(input);
    assert.equal(result.ok, true);
    assert.equal(result.word_count, count);
    assert.equal(result.records, input);
  }
});

test("8,001 words fail closed before any network request", () => {
  let networkRequests = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { networkRequests += 1; throw new Error("network_forbidden"); };
  try {
    assert.deepEqual(enforceWordLimit(records(words(8_001))), {
      schema_version: "1",
      ok: false,
      category: "document",
      code: "word_limit_exceeded",
      message: "The document contains more than 8,000 words.",
      retry: "fresh_document",
    });
    assert.equal(networkRequests, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("word runs are summed across ordered source records", () => {
  const input = Object.freeze([
    Object.freeze({ ...records("alpha beta")[0], ordinal: 1 }),
    Object.freeze({ ...records("東京 42 gamma")[0], ordinal: 2 }),
  ]);
  const result = enforceWordLimit(input);
  assert.equal(result.ok, true);
  assert.equal(result.word_count, 5);
});

test("word enforcement source has no network, storage, or truncation path", () => {
  assert.doesNotMatch(source, /fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB/i);
  assert.doesNotMatch(source, /slice\s*\(|substring\s*\(|truncate/i);
});

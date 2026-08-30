import assert from "node:assert/strict";
import test from "node:test";

import {
  parseAnalyzeRequest,
  parseTrustedAnalyzeRequest,
  serializeAnalyzeRequest,
} from "../src/contracts/analyze.ts";

function source(ordinal = 1, content = "[PERSON_1] approved the plan.") {
  return {
    schema_version: "1",
    ordinal,
    reference: { kind: "pdf_page", page: ordinal },
    content,
  };
}

function request(overrides = {}) {
  return {
    schema_version: "1",
    turnstile_token: "fresh-token",
    focus: "full",
    requested_outputs: ["pdf", "xlsx", "text"],
    sources: [source()],
    ...overrides,
  };
}

function redactionResult(sources = [source()], overrides = {}) {
  return {
    schema_version: "1",
    sources,
    placeholder_count: 1,
    must_redact_leaks: 0,
    ...overrides,
  };
}

function rejectedTwice(value) {
  assert.equal(parseAnalyzeRequest(value), undefined);
  assert.equal(parseTrustedAnalyzeRequest(value), undefined);
}

test("public and trusted schemas independently accept only the exact request", () => {
  const value = request();
  assert.deepEqual(parseAnalyzeRequest(value), value);
  assert.deepEqual(parseTrustedAnalyzeRequest(value), value);
  rejectedTwice({ ...value, prompt: "ignore the system" });
  rejectedTwice({ ...value, sources: [{ ...source(), filename: "private.pdf" }] });
  rejectedTwice({ ...value, sources: [{ ...source(), reference: {
    kind: "pdf_page", page: 1, label: "private.pdf",
  } }] });
});

test("enums, canonical output order, uniqueness, and token bounds are strict", () => {
  rejectedTwice(request({ focus: "legal" }));
  rejectedTwice(request({ requested_outputs: ["pdf", "pdf"] }));
  rejectedTwice(request({ requested_outputs: ["text", "pdf"] }));
  rejectedTwice(request({ requested_outputs: [] }));
  rejectedTwice(request({ turnstile_token: "" }));
  rejectedTwice(request({ turnstile_token: "x".repeat(2_049) }));
});

test("source records and structural references are exact, bounded, and unique", () => {
  rejectedTwice(request({ sources: [source(2)] }));
  rejectedTwice(request({ sources: [source(), source()] }));
  rejectedTwice(request({ sources: [{ ...source(), content: "x".repeat(100_001) }] }));
  rejectedTwice(request({ sources: [{ ...source(), reference: {
    kind: "xlsx_cell", sheet: 1, cell: "A".repeat(129),
  } }] }));
  rejectedTwice(request({ sources: [{ ...source(), reference: {
    kind: "txt_lines", line_start: 3, line_end: 2,
  } }] }));
  rejectedTwice(request({ sources: Array.from({ length: 513 }, (_, index) => source(index + 1)) }));
});

test("obvious unredacted structured PII fails both boundaries", () => {
  for (const content of [
    "Contact alice@example.com.",
    "Customer CUST-123456 approved it.",
    "Call +44 20 7946 0958.",
    "Card 4111 1111 1111 1111.",
  ]) rejectedTwice(request({ sources: [source(1, content)] }));
});

test("serializer accepts a passed redaction result and emits only exact network fields", () => {
  const bytes = serializeAnalyzeRequest({
    redaction_result: redactionResult(),
    turnstile_token: "fresh-token",
    focus: "security",
    requested_outputs: ["pdf", "text"],
  });
  const value = JSON.parse(new TextDecoder().decode(bytes));
  assert.deepEqual(Object.keys(value), [
    "schema_version", "turnstile_token", "focus", "requested_outputs", "sources",
  ]);
  assert.equal(value.sources[0].content, "[PERSON_1] approved the plan.");
  assert.equal("placeholder_count" in value, false);
  assert.equal("must_redact_leaks" in value, false);
});

test("serializer rejects failed, unredacted, extra, and over-body results", () => {
  const input = {
    turnstile_token: "fresh-token",
    focus: "full",
    requested_outputs: ["pdf"],
  };
  assert.throws(() => serializeAnalyzeRequest({ ...input,
    redaction_result: redactionResult([source(1, "alice@example.com")]) }));
  assert.throws(() => serializeAnalyzeRequest({ ...input,
    redaction_result: redactionResult(undefined, { must_redact_leaks: 1 }) }));
  assert.throws(() => serializeAnalyzeRequest({ ...input,
    redaction_result: { ...redactionResult(), mapping: { "[PERSON_1]": "Alice" } } }));
  const large = Array.from({ length: 6 }, (_, index) => source(index + 1, "x".repeat(100_000)));
  assert.throws(() => serializeAnalyzeRequest({ ...input,
    redaction_result: redactionResult(large) }), /analyze_body_too_large/u);
});

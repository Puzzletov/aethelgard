import assert from "node:assert/strict";
import test from "node:test";

import { analyzeResponseSchema } from "../src/contracts/analyze-response.ts";
import { parseAnalyzeRequest, parseTrustedAnalyzeRequest } from "../src/contracts/analyze.ts";
import { parseOracleOutput } from "../src/contracts/oracle.ts";
import { parseSteelmanOutput } from "../src/contracts/steelman.ts";
import { parseStrawmanOutput } from "../src/contracts/strawman.ts";

const reference = Object.freeze({ kind: "pdf_page", page: 1 });
const sources = Object.freeze([{ schema_version: "1", ordinal: 1, reference,
  content: "[PERSON_1] approved revenue growth of 12 percent." }]);
const finding = Object.freeze({ id: "finding-1", title: "Revenue", analysis: "Revenue rose.",
  confidence: "high", evidence: [reference] });
const strawman = Object.freeze({ schema_version: "1", findings: [finding], risks: [], assumptions: [],
  quantitative_candidates: [] });
const critique = Object.freeze({ id: "critique-1", strawman_finding_ids: ["finding-1"], kind: "nuance",
  critique: "The evidence needs qualification.", evidence: [reference] });
const steelman = Object.freeze({ schema_version: "1", items: [critique] });
const recommendation = Object.freeze({ id: "recommendation-1", title: "Review", action: "Review controls.",
  priority: "high", confidence: "high", evidence: [reference] });
const oracle = Object.freeze({ schema_version: "1", executive_summary: "Qualified conclusion.",
  findings: [finding], recommendations: [recommendation], risks: [], quantitative_candidates: [],
  critique_resolutions: [{ steelman_item_id: "critique-1", status: "resolved", explanation: "Qualified." }] });
const analyze = Object.freeze({ schema_version: "1", turnstile_token: "fresh-token", focus: "full",
  requested_outputs: ["pdf"], sources });
const dashboard = Object.freeze({ schema_version: "1", focus: "full", title: "Review",
  executive_summary: "Qualified conclusion.", findings: [finding], recommendations: [recommendation],
  risks: [], charts: [], verification: { ed25519_key_id: `ed25519:${"a".repeat(32)}`,
    mldsa65_key_id: `mldsa65:${"b".repeat(32)}` } });

function without(value, key) {
  const copy = structuredClone(value); delete copy[key]; return copy;
}

const analyzeMutations = Object.freeze([
  ["missing", without(analyze, "sources")],
  ["extra", { ...analyze, prompt: "forbidden" }],
  ["wrong_type", { ...analyze, turnstile_token: 7 }],
  ["invalid_enum", { ...analyze, focus: "legal" }],
  ["invalid_reference", { ...analyze, sources: [{ ...sources[0], reference: { kind: "pdf_page", page: 0 } }] }],
  ["over_bound", { ...analyze, turnstile_token: "x".repeat(2_049) }],
]);

const strawmanMutations = Object.freeze([
  ["missing", without(strawman, "risks")], ["extra", { ...strawman, report: true }],
  ["wrong_type", { ...strawman, findings: "one" }],
  ["invalid_enum", { ...strawman, findings: [{ ...finding, confidence: "certain" }] }],
  ["invalid_reference", { ...strawman, findings: [{ ...finding, evidence: [{ ...reference, page: 2 }] }] }],
  ["over_bound", { ...strawman, findings: Array.from({ length: 25 }, (_, id) => ({ ...finding, id: `f-${id}` })) }],
]);

const steelmanMutations = Object.freeze([
  ["missing", without(steelman, "items")], ["extra", { ...steelman, report: true }],
  ["wrong_type", { ...steelman, items: "one" }],
  ["invalid_enum", { ...steelman, items: [{ ...critique, kind: "agreement" }] }],
  ["invalid_reference", { ...steelman, items: [{ ...critique, evidence: [{ ...reference, page: 2 }] }] }],
  ["over_bound", { ...steelman, items: Array.from({ length: 25 }, (_, id) => ({ ...critique, id: `c-${id}` })) }],
]);

const oracleMutations = Object.freeze([
  ["missing", without(oracle, "recommendations")], ["extra", { ...oracle, html: "forbidden" }],
  ["wrong_type", { ...oracle, executive_summary: 7 }],
  ["invalid_enum", { ...oracle, recommendations: [{ ...recommendation, priority: "urgent" }] }],
  ["invalid_reference", { ...oracle, findings: [{ ...finding, evidence: [{ ...reference, page: 2 }] }] }],
  ["over_bound", { ...oracle, recommendations: Array.from({ length: 17 }, (_, id) =>
    ({ ...recommendation, id: `r-${id}` })) }],
]);

const responseMutations = Object.freeze([
  ["missing", without({ schema_version: "1", dashboard }, "dashboard")],
  ["extra", { schema_version: "1", dashboard, token: "forbidden" }],
  ["wrong_type", { schema_version: 1, dashboard }],
  ["invalid_enum", { schema_version: "1", dashboard: { ...dashboard, focus: "legal" } }],
  ["invalid_reference", { schema_version: "1", dashboard: { ...dashboard,
    findings: [{ ...finding, evidence: [{ ...reference, page: 0 }] }] } }],
  ["over_bound", { schema_version: "1", dashboard, text_utf8: "x".repeat(1_048_577) }],
]);

test("Analyze request mutations fail independently at public and trusted boundaries", () => {
  for (const [name, value] of analyzeMutations) {
    assert.equal(parseAnalyzeRequest(value), undefined, `public:${name}`);
    assert.equal(parseTrustedAnalyzeRequest(value), undefined, `trusted:${name}`);
  }
});

test("all AI and response schema mutation classes fail closed", () => {
  const matrices = [
    ["strawman", strawmanMutations, (value) => parseStrawmanOutput(value, sources)],
    ["steelman", steelmanMutations, (value) => parseSteelmanOutput(value, sources, strawman)],
    ["oracle", oracleMutations, (value) => parseOracleOutput(value, sources, strawman, steelman)],
    ["response", responseMutations, (value) => analyzeResponseSchema.safeParse(value).success ? value : undefined],
  ];
  for (const [schema, mutations, parse] of matrices) {
    for (const [name, value] of mutations) assert.equal(parse(value), undefined, `${schema}:${name}`);
  }
});

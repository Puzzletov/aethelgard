import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

import { baselineRequestSchema, baselineResponseSchema } from "../diagnostics/minimal-e2e/contracts.ts";

const redactorSource = await readFile(new URL("../frontend/input/redaction/redactor.ts", import.meta.url), "utf8");
const normalizationSource = await readFile(new URL("../frontend/input/normalization/source-record.ts", import.meta.url), "utf8");
const compile = (source) => ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022,
} }).outputText;
const normalizationUrl = `data:text/javascript;base64,${Buffer.from(compile(normalizationSource)).toString("base64")}`;
const compromiseUrl = new URL("../frontend/node_modules/compromise/src/three.js", import.meta.url).href;
const redactorCompiled = compile(redactorSource).replace('from "compromise"', `from ${JSON.stringify(compromiseUrl)}`)
  .replace('from "../normalization/source-record"', `from ${JSON.stringify(normalizationUrl)}`);
const { redactRequest } = await import(`data:text/javascript;base64,${Buffer.from(redactorCompiled).toString("base64")}`);

const originals = ["Evelyn Marlowe", "Northstar Lantern Ltd", "evelyn.marlowe@example.invalid",
  "+44 7700 900123", "42 Fiction Lane, Exampletown EX4 2ZZ", "CUST-654321"];
const fixture = [
  `Person | ${originals[0]}`,
  `Organization | ${originals[1]}`,
  `Address | ${originals[4]}`,
  `Email: ${originals[2]}`,
  `Telephone: ${originals[3]}`,
  `Customer: ${originals[5]}`,
  "Revenue increased by twelve percent while supplier concentration created delivery risk.",
].join("\n");

function redacted() {
  return redactRequest({ schema_version: "1", sources: [{ schema_version: "1", ordinal: 1,
    reference: { kind: "txt_lines", line_start: 1, line_end: 7 }, content: fixture }] });
}

test("minimal golden path removes every synthetic identifier before request creation", () => {
  const result = redacted();
  assert.ok(result.placeholder_count >= originals.length);
  const text = result.sources[0].content;
  for (const original of originals) assert.equal(text.includes(original), false, original);
  for (const placeholder of ["[PERSON_1]", "[ORGANIZATION_1]", "[ADDRESS_1]", "[EMAIL_1]",
    "[PHONE_1]", "[CUSTOMER_ID_1]"]) assert.match(text, new RegExp(placeholder.replaceAll("[", "\\[").replaceAll("]", "\\]")));
  const outbound = { schema_version: "baseline-1", turnstile_token: "XXXX.DUMMY.TOKEN.XXXX",
    focus: "full", redacted_text: text };
  assert.equal(baselineRequestSchema.safeParse(outbound).success, true);
  const serialized = JSON.stringify(outbound);
  for (const original of originals) assert.equal(serialized.includes(original), false, original);
  assert.doesNotMatch(serialized, /mapping|filename|raw_document/iu);
});

test("minimal response accepts only the useful four-field analysis", () => {
  const response = { schema_version: "baseline-1", analysis: {
    executive_summary: "The synthetic business is growing with manageable delivery risk.",
    findings: ["Revenue increased."], risks: ["Supplier concentration."],
    recommendations: ["Qualify a second supplier."],
  }, telemetry: { model: "openai/gpt-oss-20b", http_status: 200, latency_ms: 100,
    input_tokens: 50, output_tokens: 80, remaining_requests: "29", remaining_tokens: "7900",
    stages: ["TRUSTED_RUNTIME_RECEIVED", "TURNSTILE_VERIFIED", "GROQ_REQUESTED", "GROQ_RESPONDED",
      "AI_SCHEMA_VALID", "RESPONSE_SENT"].map((stage, elapsed_ms) => ({ stage, elapsed_ms })),
  }, edge_elapsed_ms: 120 };
  assert.equal(baselineResponseSchema.safeParse(response).success, true);
  assert.equal(baselineResponseSchema.safeParse({ ...response, analysis: { ...response.analysis,
    internal_reasoning: "forbidden" } }).success, false);
});

test("diagnostic topology keeps its public edge secret-free and cannot target production", async () => {
  const edge = await readFile(new URL("../diagnostics/minimal-e2e/wrangler.edge.toml", import.meta.url), "utf8");
  const trusted = await readFile(new URL("../diagnostics/minimal-e2e/wrangler.trusted.toml", import.meta.url), "utf8");
  const build = await readFile(new URL("../diagnostics/minimal-e2e/build.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(edge, /SECRET|API_KEY|SIGNING/iu);
  assert.match(edge, /aethelgard-minimal-runtime/u);
  assert.doesNotMatch(`${edge}\n${trusted}`, /aethelgard-trusted-runtime|aethelgard\.justbwas/iu);
  assert.match(build, /official_test_sitekey_required/u);
  assert.match(build, /minimal_edge_endpoint_required/u);
  assert.doesNotMatch(build, /0000000000000000000000000000000AA/u);
});

test("managed proof changes only Turnstile configuration and remains isolated", async () => {
  const edge = await readFile(new URL("../diagnostics/minimal-e2e/wrangler.managed-edge.toml", import.meta.url), "utf8");
  const trusted = await readFile(new URL("../diagnostics/minimal-e2e/wrangler.managed-trusted.toml", import.meta.url), "utf8");
  const build = await readFile(new URL("../diagnostics/minimal-e2e/build-managed.mjs", import.meta.url), "utf8");
  const runtime = await readFile(new URL("../diagnostics/minimal-e2e/trusted.ts", import.meta.url), "utf8");
  assert.doesNotMatch(edge, /SECRET|API_KEY|SIGNING/iu);
  assert.match(edge, /aethelgard-managed-golden-runtime/u);
  assert.match(trusted, /TURNSTILE_EXPECTED_ACTION = "analyze"/u);
  assert.match(trusted, /managed-golden-path\.aethelgard-3j9\.pages\.dev/u);
  assert.match(build, /__TURNSTILE_ACTION__: JSON\.stringify\("analyze"\)/u);
  assert.doesNotMatch(`${edge}\n${trusted}\n${build}`, /aethelgard-trusted-runtime|aethelgard\.justbwas/iu);
  assert.match(runtime, /TURNSTILE_SECRET_KEY/u);
  assert.doesNotMatch(runtime, /openrouter|strawman|steelman|oracle|browser run|signing/iu);
});

test("PDF integration reuses the existing local parser, language gate, and redactor", async () => {
  const app = await readFile(new URL("../diagnostics/minimal-e2e/web/app.ts", import.meta.url), "utf8");
  const html = await readFile(new URL("../diagnostics/minimal-e2e/web/index.html", import.meta.url), "utf8");
  assert.match(app, /runParserWorker\(selected\.document\)/u);
  assert.match(app, /normalizeSourceRecords\(parsed\.value\)/u);
  assert.match(app, /evaluateEnglishLanguage\(sources\)\.accepted/u);
  assert.match(app, /redactRequest\(\{ schema_version: "1", sources \}\)/u);
  assert.match(html, /accept="\.txt,\.pdf,\.docx,\.csv"/u);
  assert.doesNotMatch(app, /openrouter|strawman|steelman|oracle|browser run|signing/iu);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../workers/trusted-runtime/src/index.ts", import.meta.url), "utf8");

test("private analyze route verifies Turnstile before the bounded analysis orchestrator", () => {
  const verification = source.indexOf("await verifyTurnstile");
  const analysis = source.indexOf("await runAnalysis");
  assert.ok(verification >= 0 && analysis > verification);
  assert.match(source, /groq: this\.env\.GROQ_API_KEY/u);
  assert.match(source, /openrouter_free: this\.env\.OPENROUTER_API_KEY/u);
  assert.match(source, /"cache-control": "no-store"/u);
});

test("Phase 1 journey returns no Phase 0 synthetic PDF or Phase 2 output", () => {
  assert.doesNotMatch(source, /renderSyntheticPdf|signTrustedFinalPdf|createFoundationProof|FinalPdfQueue/u);
  assert.doesNotMatch(source, /download|report_html|result route/iu);
});

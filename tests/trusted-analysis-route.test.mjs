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
  assert.equal((source.match(/await verifyTurnstile/gu) ?? []).length, 1);
  const gate = source.slice(verification, analysis);
  assert.match(gate, /errorResponse\(503, "turnstile_unavailable", "Verification is unavailable\."\)/u);
  assert.match(gate, /errorResponse\(403, "turnstile_invalid", "Request a fresh verification challenge\."\)/u);
  assert.doesNotMatch(gate, /runAnalysis|createProductionReport|signProductionFinalPdf|BROWSER/u);
});

test("Phase 2 report composition follows analysis without restoring Phase 0 proof paths", () => {
  const analysis = source.indexOf("await runAnalysis");
  const reporting = source.indexOf("await createProductionReport");
  assert.ok(analysis >= 0 && reporting > analysis);
  assert.match(source, /FinalPdfQueue|signProductionFinalPdf/u);
  assert.doesNotMatch(source, /renderSyntheticPdf|signTrustedFinalPdf|createFoundationProof/u);
  assert.doesNotMatch(source, /download|report_html|result route/iu);
});

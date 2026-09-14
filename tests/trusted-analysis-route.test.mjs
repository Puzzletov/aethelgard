import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../workers/trusted-runtime/src/index.ts", import.meta.url), "utf8");

test("private route verifies Turnstile before exactly one cohesive analysis", () => {
  const verification = source.indexOf("await verifyTurnstile");
  const analysis = source.indexOf("await runAnalysis");
  assert.ok(verification >= 0 && analysis > verification);
  assert.match(source, /runAnalysis\(envelope, this\.env\.GROQ_API_KEY\)/u);
  assert.match(source, /"cache-control": "no-store"/u);
  assert.equal((source.match(/await verifyTurnstile/gu) ?? []).length, 1);
  assert.equal((source.match(/await runAnalysis/gu) ?? []).length, 1);
  const gate = source.slice(verification, analysis);
  assert.match(gate, /errorResponse\(503, "turnstile_unavailable", "Verification is unavailable\."\)/u);
  assert.match(gate, /errorResponse\(403, "turnstile_invalid", "Request a fresh verification challenge\."\)/u);
  assert.doesNotMatch(gate, /runAnalysis|createProductionReport|signProductionFinalPdf|BROWSER/u);
});

test("inactive report, fallback, signing, and Browser Run layers are unreachable", () => {
  assert.doesNotMatch(source, /createProductionReport|FinalPdfQueue|reserveBrowserRun|settleBrowserRun/u);
  assert.doesNotMatch(source, /OPENROUTER|SIGNING_|this\.env\.BROWSER/u);
  assert.doesNotMatch(source, /download|report_html|result route/iu);
});

import assert from "node:assert/strict";
import test from "node:test";

import { baselineAnalysisSchema, MINIMAL_RESPONSE_FORMAT } from "../diagnostics/minimal-e2e/contracts.ts";

test("minimal Groq strict schema uses the documented structural subset", () => {
  assert.equal(MINIMAL_RESPONSE_FORMAT.type, "json_schema");
  assert.equal(MINIMAL_RESPONSE_FORMAT.json_schema.strict, true);
  assert.doesNotMatch(JSON.stringify(MINIMAL_RESPONSE_FORMAT), /minLength|maxLength|minItems|maxItems/u);
});

test("local analysis validation retains non-empty and cardinality bounds", () => {
  const invalid = { executive_summary: "Summary.", findings: [""], risks: ["Risk."],
    recommendations: ["Act."] };
  assert.equal(baselineAnalysisSchema.safeParse(invalid).success, false);
  const valid = { executive_summary: "Summary.", findings: ["Finding."], risks: ["Risk."],
    recommendations: ["Act."] };
  assert.equal(baselineAnalysisSchema.safeParse(valid).success, true);
});

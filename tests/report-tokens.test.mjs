import assert from "node:assert/strict";
import test from "node:test";

import { visualTokens } from "../src/design/visual-tokens.ts";
import { MAX_REPORT_TOKEN_COUNT, reportTokens, reportTokenSchema } from "../src/contracts/report-tokens.ts";

test("report tokens are an exact report-safe projection of web tokens", () => {
  assert.deepEqual(reportTokens, {
    schema_version: "1",
    paper: visualTokens.color.paper,
    charcoal: visualTokens.color.charcoal,
    terracotta: visualTokens.color.terracotta,
    display_font: visualTokens.font.display,
    body_font: visualTokens.font.body,
    spacing: Object.values(visualTokens.space).map(Number.parseFloat),
    rule_width: visualTokens.ruleWidth,
  });
  assert.ok(Object.keys(reportTokens).length + reportTokens.spacing.length <= MAX_REPORT_TOKEN_COUNT);
});

test("report token schema allows only the fixed Browser Run properties", () => {
  assert.equal(reportTokenSchema.safeParse(reportTokens).success, true);
  assert.equal(reportTokenSchema.safeParse({ ...reportTokens, user_style: "body{}" }).success, false);
  assert.equal(reportTokenSchema.safeParse({ ...reportTokens, display_font: "url(https://remote/font)" }).success, false);
  assert.equal(reportTokenSchema.safeParse({ ...reportTokens, paper: "#ffffff" }).success, false);
  assert.equal(reportTokenSchema.safeParse({ ...reportTokens, spacing: [0] }).success, false);
  assert.equal(reportTokenSchema.safeParse({ ...reportTokens,
    spacing: reportTokens.spacing.map((value) => value + 1) }).success, false);
});

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { requiredProofBrowserNames } from "../scripts/browser-parser-proof.mjs";

test("the pinned local language gate passes its frozen corpus in Chrome and Edge", () => {
  const result = spawnSync(process.execPath, ["scripts/verify-language-gate.mjs"], {
    cwd: new URL("..", import.meta.url), encoding: "utf8", timeout: 60_000, maxBuffer: 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, "ok");
  assert.deepEqual(report.results.map((item) => item.browser), requiredProofBrowserNames());
  for (const item of report.results) {
    assert.equal(item.status, "ok");
    assert.ok(item.english_margin >= 2_000);
    assert.ok(item.names_margin >= 2_000);
    assert.deepEqual(item.failures, ["non_english", "mixed_or_uncertain", "insufficient"]);
    assert.equal(item.external_network_requests, 0);
  }
});

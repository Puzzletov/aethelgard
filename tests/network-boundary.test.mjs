import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { requiredProofBrowserNames } from "../scripts/browser-parser-proof.mjs";

test("six-format Chrome and Edge journeys preserve the exact network boundary", () => {
  const result = spawnSync(process.execPath, ["scripts/verify-network-boundary.mjs"], {
    cwd: new URL("..", import.meta.url), encoding: "utf8", timeout: 90_000, maxBuffer: 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, "ok");
  assert.deepEqual(report.results.map((item) => item.browser), requiredProofBrowserNames());
  for (const { browser: _browser, ...boundary } of report.results) {
    assert.deepEqual(boundary, { schema_version: "1", requests_observed: boundary.requests_observed,
      storage_writes: 0, raw_source_egress: 0, unredacted_text_egress: 0,
      filename_egress: 0, mapping_egress: 0, workers_terminated: true, passed: true });
    assert.ok(boundary.requests_observed > 0 && boundary.requests_observed <= 128);
  }
});

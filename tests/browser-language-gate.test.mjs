import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

import { requiredProofBrowserNames } from "../scripts/browser-parser-proof.mjs";

const fixtures = JSON.parse(readFileSync(new URL("./fixtures/language.json", import.meta.url), "utf8"));

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
    assert.equal(item.schema_version, "1");
    assert.equal(item.fixture_count, 9);
    assert.deepEqual(item.decisions, fixtures.fixtures.map((fixture) => ({
      id: fixture.id, decision: fixture.expected,
    })));
    assert.deepEqual(item.mismatches, []);
    assert.equal(item.language_data_requests, 0);
    assert.equal(item.passed, true);
  }
});

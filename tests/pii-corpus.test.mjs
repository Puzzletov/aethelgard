import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("the frozen PII corpus hash, metrics, floors, and must-redact gate pass", () => {
  const result = spawnSync(process.execPath, ["scripts/run-pii-corpus.mjs"], {
    cwd: new URL("..", import.meta.url), encoding: "utf8", timeout: 60_000, maxBuffer: 1024 * 1024,
  });
  const report = JSON.parse(result.stdout);
  assert.equal(result.status, 0, result.stderr || JSON.stringify(report));
  assert.deepEqual({ schema_version: report.schema_version, corpus_sha256: report.corpus_sha256,
    cases: report.cases, entities: report.entities, must_redact_leaks: report.must_redact_leaks,
    passed: report.passed }, {
    schema_version: "1",
    corpus_sha256: "0c777c5fc3300eb0b00a29cf583b23ea6455a12a43d990531b88990d1d679467",
    cases: 84, entities: 576, must_redact_leaks: 0, passed: true,
  });
  assert.equal(report.structured_recall, 1);
  assert.ok(report.named_recall >= 0.95);
  assert.ok(report.named_precision >= 0.8);
  assert.ok(report.overall_recall >= 0.97);
  assert.ok(report.overall_precision >= 0.85);
});

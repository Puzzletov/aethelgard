import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("the disposable Redaction Worker passes privacy and fault gates in Chrome and Edge", () => {
  const result = spawnSync(process.execPath, ["scripts/verify-redaction-worker.mjs"], {
    cwd: new URL("..", import.meta.url), encoding: "utf8", timeout: 70_000, maxBuffer: 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, "ok");
  assert.ok(report.worker_bundle_bytes > 0 && report.worker_bundle_bytes <= 3 * 1024 * 1024);
  assert.deepEqual(report.results.map((item) => item.browser), ["edge", "chrome"]);
  for (const item of report.results) {
    assert.equal(item.placeholder_count, 8);
    assert.equal(item.mapping_exposed, false);
    assert.equal(item.crash_failed_closed, true);
    assert.equal(item.timeout_failed_closed, true);
    assert.ok(item.timeout_ms >= 10_000 && item.timeout_ms <= 12_000);
    assert.equal(item.external_network_requests, 0);
    assert.equal(item.persistent_storage_writes, 0);
  }
});

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("local verifier passes the hybrid mutation matrix in Chrome and Edge", () => {
  const result = spawnSync(process.execPath, ["scripts/verify-local-verifier.mjs"], {
    cwd: new URL("../", import.meta.url), encoding: "utf8", timeout: 60_000,
  });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, "ok");
  assert.deepEqual(report.results.map((item) => item.browser).sort(),
    process.platform === "win32" ? ["chrome", "edge"] : ["chrome"]);
  for (const item of report.results) {
    assert.equal(item.network_requests, 0);
    assert.equal(item.storage_writes, 0);
  }
});

test("verifier enforces fixed bounds, timeout and atomic validity", async () => {
  const source = await readFile(new URL("../frontend/verification/local-verifier.ts", import.meta.url), "utf8");
  assert.match(source, /MAX_PDF_BYTES = 8_388_608/);
  assert.match(source, /VERIFY_TIMEOUT_MS = 10_000/);
  assert.match(source, /valid: digestMatches && ed25519 && mldsa65/);
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|caches\./u);
});

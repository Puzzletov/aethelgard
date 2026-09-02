import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import test from "node:test";
import { promisify } from "node:util";

import { requiredProofBrowserNames } from "../scripts/browser-parser-proof.mjs";

const execute = promisify(execFile);

test("validated Recharts views pass golden, accessibility and bound gates", { timeout: 90_000 }, async () => {
  const { stdout } = await execute(process.execPath, ["scripts/verify-charts.mjs"], {
    cwd: new URL("../", import.meta.url), timeout: 80_000, windowsHide: true,
  });
  const proof = JSON.parse(stdout);
  assert.equal(proof.status, "ok");
  assert.ok(proof.bundle_gzip_bytes > 0 && proof.bundle_gzip_bytes <= 307_200);
  assert.deepEqual(proof.results.map((item) => item.browser), requiredProofBrowserNames());
  for (const result of proof.results) {
    assert.equal(result.golden, true);
    assert.equal(result.accessible, true);
    assert.equal(result.bound, true);
    assert.equal(result.empty, true);
    assert.equal(result.invalid, true);
    assert.equal(result.remote_requests, 0);
  }
});

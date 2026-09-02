import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import test from "node:test";
import { promisify } from "node:util";

import { requiredProofBrowserNames } from "../scripts/browser-parser-proof.mjs";

const execute = promisify(execFile);

test("direct downloads pass supported Chrome and Edge lifecycle gates", { timeout: 90_000 }, async () => {
  const { stdout } = await execute(process.execPath, ["scripts/verify-downloads.mjs"], {
    cwd: new URL("../", import.meta.url), timeout: 80_000, windowsHide: true,
  });
  const proof = JSON.parse(stdout);
  assert.equal(proof.status, "ok");
  assert.deepEqual(proof.results.map((item) => item.browser), requiredProofBrowserNames());
  for (const result of proof.results) {
    assert.equal(result.user_triggered, true);
    assert.equal(result.exact, true);
    assert.equal(result.lifecycle, true);
    assert.equal(result.failure, true);
    assert.equal(result.storage_writes, 0);
    assert.equal(result.remote_requests, 0);
  }
});

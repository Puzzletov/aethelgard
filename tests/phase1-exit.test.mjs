import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import test from "node:test";
import { promisify } from "node:util";

const execute = promisify(execFile);

test("real browser document reaches a valid Oracle in exactly three calls", { timeout: 90_000 }, async () => {
  const { stdout } = await execute(process.execPath, ["scripts/verify-phase1-journey.mjs"], {
    cwd: new URL("../", import.meta.url), timeout: 80_000, windowsHide: true,
  });
  const proof = JSON.parse(stdout);
  assert.equal(proof.status, "ok");
  assert.deepEqual(proof.results.map((result) => result.browser).sort(), ["chrome", "edge"]);
  for (const result of proof.results) {
    assert.equal(result.valid_oracle, true);
    assert.equal(result.analyze_requests, 1);
    assert.deepEqual(result.provider_calls, ["strawman:groq", "steelman:groq", "oracle:groq"]);
    assert.equal(result.raw_or_pii_egress, false);
    assert.equal(result.storage_writes, 0);
    assert.equal(result.workers_created, 2);
    assert.equal(result.workers_terminated, 2);
  }
});

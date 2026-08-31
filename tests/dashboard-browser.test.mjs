import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import test from "node:test";
import { promisify } from "node:util";

import { requiredProofBrowserNames } from "../scripts/browser-parser-proof.mjs";

const execute = promisify(execFile);

test("dashboard success and Safe Mode states pass supported Chrome and Edge", { timeout: 90_000 }, async () => {
  const { stdout } = await execute(process.execPath, ["scripts/verify-dashboard.mjs"], {
    cwd: new URL("../", import.meta.url), timeout: 80_000, windowsHide: true,
  });
  const proof = JSON.parse(stdout);
  assert.equal(proof.status, "ok");
  assert.deepEqual(proof.results.map((result) => result.browser).sort(),
    [...requiredProofBrowserNames()].sort());
  for (const result of proof.results) {
    assert.equal(result.semantic_success, true);
    assert.equal(result.visual_regression, true);
    assert.equal(result.keyboard_focus, true);
    assert.equal(result.reduced_motion, true);
    assert.equal(result.semantic_fault, true);
    assert.equal(result.escaped, true);
    assert.equal(result.storage_writes, 0);
  }
});

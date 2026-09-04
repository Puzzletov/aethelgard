import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("signed owner evidence and deterministic configuration emit exact-zero", () => {
  const result = spawnSync(process.execPath, ["scripts/verify-zero-cost.mjs"], {
    cwd: new URL("../", import.meta.url), encoding: "utf8", timeout: 10_000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { schema_version: "1", gbp_upfront: 0,
    gbp_monthly: 0, usd_upfront: 0, usd_monthly: 0, paid_fallbacks: 0,
    automatic_topups: 0, passed: true });
});

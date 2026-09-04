import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import test from "node:test";
import { promisify } from "node:util";

import { requiredProofBrowserNames } from "../scripts/browser-parser-proof.mjs";

const execute = promisify(execFile);

test("parser and redactor crashes obey exact browser lifecycle policy", { timeout: 90_000 }, async () => {
  const { stdout, stderr } = await execute(process.execPath, ["scripts/verify-worker-lifecycle.mjs"], {
    cwd: new URL("../", import.meta.url), timeout: 80_000, windowsHide: true, maxBuffer: 1024 * 1024,
  });
  assert.equal(stderr, "");
  const proof = JSON.parse(stdout);
  assert.equal(proof.status, "ok");
  assert.deepEqual(proof.results.map((item) => item.browser), requiredProofBrowserNames());
  for (const result of proof.results) {
    assert.deepEqual(result.parser, { attempts: 2, sends: 1, outcome: "oracle",
      workers_created: 2, workers_terminated: 2 });
    assert.deepEqual(result.redactor, { parser_attempts: 1, redactor_attempts: 1, sends: 0,
      outcome: { schema_version: "1", ok: false, category: "privacy", code: "redaction_failed",
        message: "Private information could not be removed safely.", retry: "fresh_document" },
      workers_created: 2, workers_terminated: 2 });
    assert.equal(result.external_requests, 0);
    assert.equal(result.crash_detail_leaked, false);
    assert.equal(result.passed, true);
  }
});

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { promisify } from "node:util";

import { requiredProofBrowserNames } from "../scripts/browser-parser-proof.mjs";

const execute = promisify(execFile);
const parserSource = await readFile(new URL("../frontend/input/parsers/run-parser.ts", import.meta.url), "utf8");

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
    assert.equal(result.timeout.attempts, 2);
    assert.equal(result.timeout.redactions, 0);
    assert.equal(result.timeout.sends, 0);
    assert.equal(result.timeout.workers_created, 2);
    assert.equal(result.timeout.workers_terminated, 2);
    assert.equal(result.timeout.buffers_released, true);
    assert.ok(result.timeout.elapsed_ms >= 180 && result.timeout.elapsed_ms <= 2_000);
    assert.deepEqual(result.timeout.outcome, { schema_version: "1", ok: false,
      category: "client_resource", code: "parser_resource_failed",
      message: "This browser could not process the document safely.", retry: "fresh_document" });
    assert.equal(result.allocation.bytes, 50_331_648);
    assert.deepEqual(result.allocation.recovery, { attempts: 2, redactions: 1, sends: 1,
      buffers_released: true, outcome: "oracle", workers_created: 2, workers_terminated: 2 });
    assert.deepEqual(result.allocation.terminal, { attempts: 2, redactions: 0, sends: 0,
      buffers_released: true, outcome: result.timeout.outcome,
      workers_created: 2, workers_terminated: 2 });
    assert.deepEqual(result.allocation.redactor, { parser_attempts: 1, redactor_attempts: 1,
      sends: 0, outcome: result.redactor.outcome, workers_created: 2, workers_terminated: 2 });
    assert.equal(result.external_requests, 0);
    assert.equal(result.crash_detail_leaked, false);
    assert.equal(result.passed, true);
  }
});

test("release parser deadline is fixed at thirty seconds without adaptive extension", () => {
  assert.match(parserSource, /PARSER_TIMEOUT_MS = 30_000/u);
  assert.doesNotMatch(parserSource, /backoff|extend|adaptive|retryDelay/iu);
});

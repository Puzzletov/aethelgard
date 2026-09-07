import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import test from "node:test";
import { promisify } from "node:util";
import { requiredProofBrowserNames } from "../scripts/browser-parser-proof.mjs";

const execute = promisify(execFile);

test("minimal TXT, CSV, PDF, and DOCX reach parser entry in supported browsers", { timeout: 90_000 }, async () => {
  const { stdout, stderr } = await execute(process.execPath, ["scripts/verify-document-input.mjs"], {
    cwd: new URL("../", import.meta.url), timeout: 80_000, windowsHide: true, maxBuffer: 1024 * 1024,
  });
  assert.equal(stderr, "");
  const proof = JSON.parse(stdout);
  assert.equal(proof.status, "ok");
  assert.deepEqual(proof.results.map((item) => item.browser), requiredProofBrowserNames());
  for (const result of proof.results) {
    assert.equal(result.external_requests, 0);
    assert.equal(result.storage_writes, 0);
    assert.deepEqual(result.rows.map((row) => row.format), ["txt", "csv", "pdf", "docx"]);
    for (const row of result.rows) {
      assert.equal(row.detected_format, row.format);
      assert.equal(row.preflight_request_kind, "preflight");
      assert.equal(row.preflight_result, "pass");
      assert.equal(row.internal_code, null);
      assert.equal(row.visible_message, null);
      assert.equal(row.parser_request_kind, `parse_${row.format}`);
      assert.equal(row.parser_entry, true);
    }
  }
});

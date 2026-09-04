import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("clean recovery is remote, disposable, bounded, and emits the exact contract", async () => {
  const source = await readFile(new URL("../scripts/verify-clean-recovery.mjs", import.meta.url), "utf8");
  for (const field of ["schema_version", "commit", "architecture_sha256", "build_passed",
    "tests_passed", "doctor_passed", "dry_run_passed", "sample_verified",
    "changed_byte_rejected", "clean"]) assert.match(source, new RegExp(`\\b${field}\\b`));
  assert.match(source, /git", \["clone", "--no-local"/u);
  assert.match(source, /1_800_000/u);
  assert.match(source, /--disposable/u);
  assert.match(source, /recoveryRef = argument\("--ref"\) \?\? "main"/u);
  for (const gate of ["architecture-lint.mjs", "typecheck", "lint", "license:check", "audit",
    "zero-cost:check", "verify:report"]) assert.ok(source.includes(gate));
  assert.match(source, /npm-cache/u);
  assert.match(source, /finally \{\s*await rm\(temporary/u);
  assert.doesNotMatch(source, /shell:/u);
  assert.doesNotMatch(source, /production|--upload-reviewed|\.npm[/\\]_/iu);
});

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { promisify } from "node:util";

import { requiredProofBrowserNames } from "../scripts/browser-parser-proof.mjs";
import { HOSTILE_CORPUS_VERSION, hostileCorpusCases } from "./fixtures/hostile/corpus.mjs";

const execute = promisify(execFile);
const manifest = JSON.parse(await readFile(new URL("./fixtures/hostile/manifest.json", import.meta.url), "utf8"));

test("hostile corpus manifest freezes every Section 12.1 class and exact rejection", () => {
  const fixtures = hostileCorpusCases();
  assert.equal(manifest.schema_version, "1");
  assert.equal(manifest.corpus_version, HOSTILE_CORPUS_VERSION);
  assert.equal(fixtures.length, 47);
  assert.ok(fixtures.length <= 256);
  assert.equal(new Set(fixtures.map((item) => item.id)).size, fixtures.length);
  assert.deepEqual([...new Set(fixtures.flatMap((item) => item.classes))].sort((a, b) => a - b),
    Array.from({ length: 20 }, (_, index) => index + 1));
  assert.deepEqual(manifest.cases, fixtures.map((fixture) => ({
    id: fixture.id,
    classes: [...fixture.classes],
    sha256: createHash("sha256").update(fixture.bytes).digest("hex"),
    expected_code: fixture.expectedCode,
  })));
});

test("all hostile fixtures reject exactly in Chrome and Edge without egress", { timeout: 120_000 }, async () => {
  const { stdout, stderr } = await execute(process.execPath, ["scripts/verify-hostile-corpus.mjs"], {
    cwd: new URL("../", import.meta.url), timeout: 110_000, windowsHide: true, maxBuffer: 1024 * 1024,
  });
  assert.equal(stderr, "");
  const proof = JSON.parse(stdout);
  assert.equal(proof.status, "ok");
  assert.deepEqual(proof.results.map((item) => item.browser), requiredProofBrowserNames());
  for (const result of proof.results) {
    assert.deepEqual(result, { browser: result.browser, schema_version: "1", corpus_version: 1,
      case_count: 47, mismatches: [], external_requests: 0, passed: true });
  }
});

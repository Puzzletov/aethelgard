import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("performance corpus is fixed, complete, and bound to every release target", async () => {
  const source = await readFile(new URL("../scripts/measure-performance.mjs", import.meta.url), "utf8");
  for (const stage of ["shell", "engine", "local", "strawman", "steelman", "oracle", "pdf", "signing", "total"]) {
    assert.match(source, new RegExp(`\\b${stage}: stats\\(`));
  }
  for (const bound of ["2_000", "10_000", "90_000", "180_000", "5_000", "50"]) {
    assert.match(source, new RegExp(bound));
  }
  assert.match(source, /schema_version: "1"/);
  assert.match(source, /createHash\("sha256"\)/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\s*\(/);
});

import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("production parser is a deterministic module Worker with self-hosted Pyodide", async () => {
  const directory = await mkdtemp(path.join(process.cwd(), ".parser-build-test-"));
  const output = path.join(directory, "parser.worker.mjs");
  try {
    const result = spawnSync(process.execPath, ["scripts/build-parser-worker.mjs", output], {
      cwd: process.cwd(), encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    const bundle = await readFile(output, "utf8");
    assert.match(bundle, /from["']\/pyodide\/pyodide\.mjs["']/u);
    assert.match(bundle, /self\.onmessage=/u);
    assert.doesNotMatch(bundle, /Classic web workers are not supported/u);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

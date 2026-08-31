import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../input/redaction/run-redaction.ts", import.meta.url), "utf8");
const normalizationSource = await readFile(new URL("../input/normalization/source-record.ts", import.meta.url), "utf8");
const normalizationCompiled = ts.transpileModule(normalizationSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const normalizationUrl = `data:text/javascript;base64,${Buffer.from(normalizationCompiled).toString("base64")}`;
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText.replace('from "../normalization/source-record"', `from ${JSON.stringify(normalizationUrl)}`);
const { runRedactionWorker } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

const record = Object.freeze({ schema_version: "1", ordinal: 1,
  reference: Object.freeze({ kind: "txt_lines", line_start: 1, line_end: 1 }), content: "[PERSON_1]" });
const request = Object.freeze({ schema_version: "1", sources: Object.freeze([record]) });
const result = Object.freeze({ schema_version: "1", sources: Object.freeze([record]),
  placeholder_count: 1, must_redact_leaks: 0 });

class FakeWorker {
  onmessage = null;
  onerror = null;
  terminated = false;
  constructor(behavior) { this.behavior = behavior; }
  postMessage() { queueMicrotask(() => this.behavior(this)); }
  terminate() { this.terminated = true; }
}

test("a valid result is returned and its disposable Worker is terminated", async () => {
  const worker = new FakeWorker((target) => target.onmessage?.({ data: result }));
  assert.deepEqual(await runRedactionWorker(request, () => worker), result);
  assert.equal(worker.terminated, true);
});

test("crash and invalid output fail closed with no fresh Worker retry", async () => {
  for (const behavior of [
    (target) => target.onerror?.(new Event("error")),
    (target) => target.onmessage?.({ data: { ...result, mapping: {} } }),
  ]) {
    let factories = 0;
    const worker = new FakeWorker(behavior);
    const output = await runRedactionWorker(request, () => { factories += 1; return worker; });
    assert.deepEqual(output, { schema_version: "1", ok: false, category: "privacy",
      code: "redaction_failed", message: "Private information could not be removed safely.",
      retry: "fresh_document" });
    assert.equal(factories, 1);
    assert.equal(worker.terminated, true);
  }
  assert.deepEqual(await runRedactionWorker(request, () => { throw new Error("worker_start_failed"); }),
    { schema_version: "1", ok: false, category: "privacy", code: "redaction_failed",
      message: "Private information could not be removed safely.", retry: "fresh_document" });
});

test("controller fixes a 10-second hard stop and contains no retry or storage path", () => {
  assert.match(source, /REDACTION_TIMEOUT_MS = 10_000/u);
  assert.doesNotMatch(source, /retryCount|for\s*\(.*retry|localStorage|sessionStorage|indexedDB/i);
});

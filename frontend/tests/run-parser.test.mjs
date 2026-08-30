import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../input/parsers/run-parser.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2022 } }).outputText;
const { runParserWorker } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

function fakeWorker(reply) {
  return { onmessage: null, onerror: null, terminated: false,
    postMessage(message, transfers) { this.message = message; this.transfers = transfers;
      queueMicrotask(() => this.onmessage({ data: reply })); },
    terminate() { this.terminated = true; } };
}

test("parser controller transfers exact source bytes to one disposable module Worker", async () => {
  const buffer = new Uint8Array([1, 2, 3]).buffer;
  const worker = fakeWorker({ ok: true, format: "txt" });
  const result = await runParserWorker({ format: "txt", byteLength: 3,
    file: { arrayBuffer: async () => buffer } }, () => worker);
  assert.equal(result.ok, true);
  assert.equal(worker.message.kind, "parse_txt");
  assert.equal(worker.transfers.length, 1);
  assert.equal(worker.terminated, true);
});

test("parser controller fails closed when allocation or byte length is invalid", async () => {
  const document = { format: "txt", byteLength: 3,
    file: { arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer } };
  assert.deepEqual(await runParserWorker(document, () => { throw new Error("allocation"); }),
    { ok: false, reason: "allocation" });
  assert.deepEqual(await runParserWorker({ ...document, byteLength: 4 }, () => fakeWorker({})),
    { ok: false, reason: "invalid" });
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = new URL("../../", import.meta.url);

async function loadModule(entry, transform = (source) => source) {
  const entryPath = fileURLToPath(new URL(entry, root));
  const source = transform(await readFile(entryPath, "utf8"));
  const built = await build({ absWorkingDir: fileURLToPath(root), stdin: {
    contents: source, resolveDir: dirname(entryPath),
    sourcefile: entry.split("/").at(-1), loader: "ts",
  }, bundle: true, write: false, format: "esm", platform: "node", target: ["node22"], logLevel: "silent" });
  return import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
}

function document() {
  const bytes = new TextEncoder().encode("Plain English text.");
  return { file: new File([bytes], "plain.txt"), format: "txt", byteLength: bytes.byteLength };
}

function respondingWorker(result, counters) {
  const worker = { onmessage: undefined, onerror: undefined,
    postMessage(message) { counters.kinds.push(message.kind);
      queueMicrotask(() => worker.onmessage?.({ data: result })); },
    terminate() { counters.terminated += 1; } };
  return worker;
}

function crashingWorker(counters) {
  const worker = { onmessage: undefined, onerror: undefined,
    postMessage(message) { counters.kinds.push(message.kind);
      queueMicrotask(() => worker.onerror?.({ preventDefault() {} })); },
    terminate() { counters.terminated += 1; } };
  return worker;
}

const controller = await loadModule("frontend/input/preflight/run-preflight.ts",
  (source) => source.replace("PREFLIGHT_TIMEOUT_MS = 10_000", "PREFLIGHT_TIMEOUT_MS = 20"));
const results = await loadModule("frontend/input/preflight/result.ts");

test("a runtime crash gets one fresh preflight Worker and preserves the protocol", async () => {
  const counters = { attempts: 0, terminated: 0, kinds: [] };
  const valid = { ok: true, byteLength: 19, archiveEntries: 0 };
  const result = await controller.runDocumentPreflight(document(), () => {
    counters.attempts += 1;
    return counters.attempts === 1 ? crashingWorker(counters) : respondingWorker(valid, counters);
  });
  assert.deepEqual(result, valid);
  assert.deepEqual(counters, { attempts: 2, terminated: 2, kinds: ["preflight", "preflight"] });
});

test("runtime failures stay distinct and never masquerade as archive limits", async () => {
  const cases = [
    ["crash", () => crashingWorker({ kinds: [], terminated: 0 }),
      "Local document safety checks stopped unexpectedly."],
    ["timeout", () => ({ postMessage() {}, terminate() {}, onmessage: undefined, onerror: undefined }),
      "Local document safety checks took too long."],
    ["allocation", () => { throw new RangeError("synthetic allocation"); },
      "This browser could not allocate memory for document safety checks."],
  ];
  for (const [reason, factory, message] of cases) {
    await assert.rejects(() => controller.runDocumentPreflight(document(), factory), (error) => {
      assert.equal(error.reason, reason);
      assert.equal(controller.preflightRuntimeMessage(error), message);
      assert.doesNotMatch(error.message, /container|archive/iu);
      return true;
    });
  }
});

test("document failure codes retain their exact non-interchangeable messages", () => {
  const cases = [
    ["archive_limit", "The document container exceeds a safety limit."],
    ["archive_malformed", "The document container is malformed."],
    ["magic_invalid", "The document type does not match its content."],
    ["text_invalid", "The text document is not valid UTF-8 text."],
  ];
  for (const [code, message] of cases) assert.equal(results.failedPreflight(code).message, message);
});

test("unknown controller faults use one safe generic message", () => {
  assert.equal(controller.preflightRuntimeMessage(new Error("private detail")),
    "This browser could not check the document safely.");
});

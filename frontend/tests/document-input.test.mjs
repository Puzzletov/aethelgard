import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const contractSource = await readFile(new URL("../input/document-input.ts", import.meta.url), "utf8");
const compiledContract = ts.transpileModule(contractSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2021 },
}).outputText;
const {
  DOCUMENT_ACCEPT,
  MAX_LOCAL_FILENAME_CODE_UNITS,
  MAX_SOURCE_BYTES,
  SUPPORTED_DOCUMENT_FORMATS,
  selectBrowserDocument,
} = await import(`data:text/javascript;base64,${Buffer.from(compiledContract).toString("base64")}`);

function localFile(name, size, type = "application/octet-stream") {
  return Object.freeze({ name, size, type });
}

test("the browser contract accepts exactly the six approved formats", () => {
  assert.equal(DOCUMENT_ACCEPT, ".pdf,.docx,.pptx,.xlsx,.csv,.txt");
  assert.deepEqual([...SUPPORTED_DOCUMENT_FORMATS], ["pdf", "docx", "pptx", "xlsx", "csv", "txt"]);
  for (const format of SUPPORTED_DOCUMENT_FORMATS) {
    const result = selectBrowserDocument([localFile(`report.${format.toUpperCase()}`, 1)]);
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.document.format, format);
  }
});

test("the 15 MiB bound is enforced before format processing", () => {
  const boundary = selectBrowserDocument([localFile("report.pdf", MAX_SOURCE_BYTES)]);
  assert.equal(boundary.ok, true);
  const over = selectBrowserDocument([localFile("report.pdf", MAX_SOURCE_BYTES + 1)]);
  assert.deepEqual(over, {
    ok: false,
    code: "too_large",
    message: "The document is larger than the 15 MiB limit.",
  });
  const oversizedUnknown = selectBrowserDocument([localFile("report.exe", MAX_SOURCE_BYTES + 1)]);
  assert.equal(oversizedUnknown.ok, false);
  if (!oversizedUnknown.ok) assert.equal(oversizedUnknown.code, "too_large");
});

test("invalid selection, empty input, unsafe names, and other formats fail closed", () => {
  assert.equal(selectBrowserDocument([]).ok, false);
  assert.equal(selectBrowserDocument([localFile("a.pdf", 1), localFile("b.pdf", 1)]).ok, false);
  assert.equal(selectBrowserDocument([localFile("empty.pdf", 0)]).ok, false);
  assert.equal(selectBrowserDocument([localFile("report.exe", 1)]).ok, false);
  assert.equal(selectBrowserDocument([localFile(`a${"x".repeat(MAX_LOCAL_FILENAME_CODE_UNITS)}.pdf`, 1)]).ok, false);
});

test("the early input contract does not read, transmit, or persist the selected file", async () => {
  const [contract, picker] = await Promise.all([
    readFile(new URL("../input/document-input.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/document-picker.tsx", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(contract, /arrayBuffer\(|FileReader/);
  assert.doesNotMatch(`${contract}\n${picker}`, /fetch\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|caches\./);
  assert.doesNotMatch(picker, /multiple=/);
  assert.match(picker, /type="file"/);
  assert.match(picker, /accept={DOCUMENT_ACCEPT}/);
});

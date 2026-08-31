import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../input/normalization/source-record.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { normalizeSourceRecords } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

const envelope = (format, values) => Object.freeze({
  ok: true, schema_version: "1", format,
  [format === "pdf" ? "pages" : "sources"]: Object.freeze(values),
});

test("all six parser formats normalize to exact neutral source references", () => {
  const fixtures = [
    [envelope("pdf", [{ page: 1, content: "PDF" }]), { kind: "pdf_page", page: 1 }],
    [envelope("docx", [{ kind: "paragraph", paragraph: 2, content: "DOCX" }]), { kind: "docx_paragraph", paragraph: 2 }],
    [envelope("pptx", [{ slide: 3, content: "PPTX" }]), { kind: "pptx_slide", slide: 3 }],
    [envelope("xlsx", [{ sheet: 2, cell: "B4", content: "XLSX" }]), { kind: "xlsx_cell", sheet: 2, cell: "B4" }],
    [envelope("csv", [{ row: 5, column: 2, content: "CSV" }]), { kind: "csv_field", row: 5, column: 2 }],
    [envelope("txt", [{ line_start: 1, line_end: 1, content: "TXT" }]), { kind: "txt_lines", line_start: 1, line_end: 1 }],
  ];
  for (const [input, reference] of fixtures) {
    assert.deepEqual(normalizeSourceRecords(input), [{ schema_version: "1", ordinal: 1, reference, content: input[input.format === "pdf" ? "pages" : "sources"][0].content }]);
  }
});

test("normalization preserves order and creates contiguous immutable ordinals", () => {
  const input = envelope("txt", [
    Object.freeze({ line_start: 1, line_end: 1, content: "First" }),
    Object.freeze({ line_start: 3, line_end: 3, content: "Third" }),
  ]);
  const result = normalizeSourceRecords(input);
  assert.deepEqual(result?.map((record) => [record.ordinal, record.content]), [[1, "First"], [2, "Third"]]);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result?.[0]), true);
  assert.equal(Object.isFrozen(result?.[0].reference), true);
  assert.equal(input.sources[1].line_start, 3);
});

test("DOCX table cells normalize without filenames, metadata, or labels", () => {
  const result = normalizeSourceRecords(envelope("docx", [
    { kind: "table_cell", table: 1, row: 2, column: 3, content: "Cell" },
  ]));
  assert.deepEqual(result?.[0].reference, { kind: "docx_table_cell", table: 1, row: 2, column: 3 });
  assert.doesNotMatch(JSON.stringify(result), /filename|sheet_name|author|metadata/i);
});

test("unknown fields, duplicate or invalid references, and missing schema fail closed", () => {
  const invalid = [
    { ...envelope("pdf", [{ page: 1, content: "A" }]), extra: true },
    envelope("pdf", [{ page: 1, content: "A", filename: "private.pdf" }]),
    envelope("pdf", [{ page: 2, content: "gap" }]),
    envelope("docx", [{ kind: "paragraph", paragraph: 2, content: "A" }, { kind: "paragraph", paragraph: 1, content: "B" }]),
    envelope("csv", [{ row: 1, column: 1, content: "A" }, { row: 1, column: 1, content: "B" }]),
    envelope("xlsx", [{ sheet: 1, cell: "A0", content: "A" }]),
    envelope("txt", [{ line_start: 3, line_end: 2, content: "A" }]),
    { ok: true, format: "txt", sources: [{ line_start: 1, line_end: 1, content: "A" }] },
  ];
  for (const value of invalid) assert.equal(normalizeSourceRecords(value), undefined);
});

test("source and total text bounds fail without truncation", () => {
  assert.equal(normalizeSourceRecords(envelope("txt", [
    { line_start: 1, line_end: 1, content: "x".repeat(100_001) },
  ])), undefined);
  const records = Array.from({ length: 21 }, (_, index) => ({
    row: index + 1, column: 1, content: "x".repeat(100_000),
  }));
  assert.equal(normalizeSourceRecords(envelope("csv", records)), undefined);
});

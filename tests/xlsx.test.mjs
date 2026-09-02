import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { strFromU8, unzipSync } from "fflate";

import {
  MAX_XLSX_COLUMNS,
  MAX_XLSX_OUTPUT_BYTES,
  MAX_XLSX_ROWS,
  MAX_XLSX_SHEETS,
  writeReportXlsx,
} from "../workers/trusted-runtime/src/xlsx.ts";

const reference = Object.freeze({ kind: "xlsx_cell", sheet: 1, cell: "B2" });
export function xlsxModel() {
  return {
    schema_version: "1", focus: "financial", title: "Independent review",
    executive_summary: "Evidence supports the recommendation.",
    findings: [{ id: "f1", title: "Finding", analysis: "Analysis.", confidence: "high", evidence: [reference] }],
    recommendations: [{ id: "r1", title: "Act", action: "Review.", priority: "high",
      confidence: "high", evidence: [reference] }],
    risks: [{ id: "risk1", text: "Delay.", confidence: "medium", evidence: [reference] }],
    charts: [{ schema_version: "1", id: "c1", title: "Value", unit: "GBP", kind: "bar",
      points: [{ label: "Current", value: 12.5, evidence: [reference] }] }],
    verification: { ed25519_key_id: `ed25519:${"a".repeat(32)}`,
      mldsa65_key_id: `mldsa65:${"b".repeat(32)}` },
  };
}

function archive(model = xlsxModel()) {
  const bytes = writeReportXlsx(model);
  assert.ok(bytes instanceof Uint8Array);
  return { bytes, files: unzipSync(bytes) };
}

test("XLSX has deterministic exact OOXML structure and fixed sheets", () => {
  const first = archive();
  const second = archive();
  assert.deepEqual(first.bytes, second.bytes);
  assert.equal(createHash("sha256").update(first.bytes).digest("hex"),
    "8cc06315590d739dd2ed1bf4b259ac28dbb7fd020a533db56b35b981a0fb19e0");
  assert.ok(first.bytes.byteLength <= MAX_XLSX_OUTPUT_BYTES);
  assert.deepEqual(Object.keys(first.files).sort(), ["[Content_Types].xml", "_rels/.rels",
    "docProps/app.xml", "docProps/core.xml", "xl/_rels/workbook.xml.rels", "xl/styles.xml",
    "xl/workbook.xml", ...Array.from({ length: 5 }, (_, index) => `xl/worksheets/sheet${index + 1}.xml`)].sort());
  const workbook = strFromU8(first.files["xl/workbook.xml"]);
  assert.deepEqual([...workbook.matchAll(/<sheet name="([^"]+)"/gu)].map((match) => match[1]),
    ["Analysis", "Findings", "Recommendations", "Risks", "Charts"]);
  assert.ok(5 <= MAX_XLSX_SHEETS && 513 <= MAX_XLSX_ROWS && 7 <= MAX_XLSX_COLUMNS);
});

test("formula-like text is escaped and no formula, macro, or external link exists", () => {
  const model = xlsxModel();
  model.title = '=HYPERLINK("https://invalid.example","open")';
  model.findings[0].title = "+SUM(A1:A2)";
  const { files } = archive(model);
  const xml = Object.entries(files).map(([path, bytes]) => `${path}\n${strFromU8(bytes)}`).join("\n");
  assert.match(xml, /&apos;=HYPERLINK/u);
  assert.match(xml, /&apos;\+SUM/u);
  assert.doesNotMatch(xml, /<f(?:\s|>)|TargetMode="External"|externalLink|vbaProject|macroEnabled/iu);
});

test("output and XML validity bounds fail closed without truncation", () => {
  assert.equal(writeReportXlsx({ ...xlsxModel(), extra: true }), undefined);
  assert.equal(writeReportXlsx({ ...xlsxModel(), title: "bad\u0000xml" }), undefined);
  assert.equal(writeReportXlsx({ ...xlsxModel(), executive_summary: "x".repeat(200_001) }), undefined);
  const maximal = xlsxModel();
  maximal.charts = Array.from({ length: 8 }, (_, chartIndex) => ({ schema_version: "1",
    id: `c${chartIndex}`, title: `Chart ${chartIndex}`, unit: "GBP", kind: "line",
    points: Array.from({ length: 64 }, (_, pointIndex) => ({ label: `P${pointIndex}`,
      value: pointIndex, evidence: [reference] })) }));
  const bytes = writeReportXlsx(maximal);
  assert.ok(bytes instanceof Uint8Array && bytes.byteLength <= MAX_XLSX_OUTPUT_BYTES);
  const charts = strFromU8(unzipSync(bytes)["xl/worksheets/sheet5.xml"]);
  assert.equal((charts.match(/<row /gu) ?? []).length, 513);
});

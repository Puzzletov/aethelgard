import { writeFile } from "node:fs/promises";
import path from "node:path";

import { writeReportXlsx } from "../workers/trusted-runtime/src/xlsx.ts";

const output = process.argv[2];
if (output === undefined || path.extname(output).toLowerCase() !== ".xlsx") {
  throw new Error("Usage: node scripts/write-xlsx-proof.mjs <output.xlsx>");
}
const reference = Object.freeze({ kind: "xlsx_cell", sheet: 1, cell: "B2" });
const bytes = writeReportXlsx({
  schema_version: "1", focus: "financial", title: "Aethelgard XLSX compatibility proof",
  executive_summary: "This fixed workbook validates deterministic OOXML compatibility.",
  findings: [{ id: "f1", title: "Workbook", analysis: "The workbook opened normally.",
    confidence: "high", evidence: [reference] }],
  recommendations: [{ id: "r1", title: "Verify", action: "Inspect every fixed sheet.",
    priority: "high", confidence: "high", evidence: [reference] }], risks: [], charts: [],
  verification: { ed25519_key_id: `ed25519:${"a".repeat(32)}`,
    mldsa65_key_id: `mldsa65:${"b".repeat(32)}` },
});
if (bytes === undefined) throw new Error("XLSX proof generation failed.");
await writeFile(path.resolve(output), bytes);
process.stdout.write(`${JSON.stringify({ bytes: bytes.byteLength })}\n`);

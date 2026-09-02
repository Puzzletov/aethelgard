import type { SourceReference } from "../../../src/contracts/analyze.ts";
import { parseReportModel, type ReportModel } from "../../../src/contracts/report-model.ts";

export const MAX_TEXT_OUTPUT_BYTES = 1_048_576;
const UTF8 = new TextEncoder();

function reference(reference: SourceReference): string {
  switch (reference.kind) {
    case "pdf_page": return `PDF page ${reference.page}`;
    case "docx_paragraph": return `DOCX paragraph ${reference.paragraph}`;
    case "docx_table_cell": return `DOCX table ${reference.table}, row ${reference.row}, column ${reference.column}`;
    case "pptx_slide": return `PPTX slide ${reference.slide}`;
    case "xlsx_cell": return `XLSX sheet ${reference.sheet}, cell ${reference.cell}`;
    case "csv_field": return `CSV row ${reference.row}, column ${reference.column}`;
    case "txt_lines": return `TXT lines ${reference.line_start}–${reference.line_end}`;
  }
}

function references(values: readonly SourceReference[]): string {
  return values.map(reference).join("; ");
}

function bounded(value: string): Uint8Array | undefined {
  const bytes = UTF8.encode(value);
  return bytes.byteLength <= MAX_TEXT_OUTPUT_BYTES ? bytes : undefined;
}

function textDocument(model: ReportModel): string {
  const lines = [model.title, `Focus: ${model.focus}`, "", "EXECUTIVE SUMMARY", model.executive_summary,
    "", "FINDINGS"];
  model.findings.forEach((item, index) => lines.push(`${index + 1}. ${item.title}`, item.analysis,
    `Confidence: ${item.confidence}`, `Evidence: ${references(item.evidence)}`, ""));
  lines.push("RECOMMENDATIONS");
  model.recommendations.forEach((item, index) => lines.push(`${index + 1}. ${item.title}`, item.action,
    `Priority: ${item.priority}; Confidence: ${item.confidence}`, `Evidence: ${references(item.evidence)}`, ""));
  lines.push("RISKS");
  if (model.risks.length === 0) lines.push("No material risks were identified.", "");
  model.risks.forEach((item, index) => lines.push(`${index + 1}. ${item.text}`,
    `Confidence: ${item.confidence}`, `Evidence: ${references(item.evidence)}`, ""));
  lines.push("QUANTITATIVE ANALYSIS");
  if (model.charts.length === 0) lines.push("No valid quantitative chart data was available.", "");
  model.charts.forEach((chart) => {
    lines.push(`${chart.title} (${chart.kind}; ${chart.unit})`);
    chart.points.forEach((point) => lines.push(`- ${point.label}: ${point.value} ${chart.unit}; Evidence: ${references(point.evidence)}`));
    lines.push("");
  });
  lines.push("VERIFICATION", `Ed25519: ${model.verification.ed25519_key_id}`,
    `ML-DSA-65: ${model.verification.mldsa65_key_id}`);
  return `${lines.join("\n")}\n`;
}

function markdown(value: string): string {
  return value.replaceAll("\\", "\\\\").replace(/([A-Za-z][A-Za-z0-9+.-]{1,31}):/gu, "$1\\:")
    .replace(/([`*_{}\[\]()#+.!|<>-])/gu, "\\$1");
}

function markdownDocument(model: ReportModel): string {
  const lines = [`# ${markdown(model.title)}`, "", `**Focus:** ${markdown(model.focus)}`, "",
    "## Executive summary", "", markdown(model.executive_summary), "", "## Findings", ""];
  model.findings.forEach((item, index) => lines.push(`### ${index + 1}. ${markdown(item.title)}`, "",
    markdown(item.analysis), "", `**Confidence:** ${markdown(item.confidence)}`,
    `**Evidence:** ${markdown(references(item.evidence))}`, ""));
  lines.push("## Recommendations", "");
  model.recommendations.forEach((item, index) => lines.push(`### ${index + 1}. ${markdown(item.title)}`, "",
    markdown(item.action), "", `**Priority:** ${markdown(item.priority)}; **Confidence:** ${markdown(item.confidence)}`,
    `**Evidence:** ${markdown(references(item.evidence))}`, ""));
  lines.push("## Risks", "");
  if (model.risks.length === 0) lines.push("No material risks were identified.", "");
  model.risks.forEach((item, index) => lines.push(`${index + 1}. ${markdown(item.text)}`,
    `   **Confidence:** ${markdown(item.confidence)}`,
    `   **Evidence:** ${markdown(references(item.evidence))}`, ""));
  lines.push("## Quantitative analysis", "");
  if (model.charts.length === 0) lines.push("No valid quantitative chart data was available.", "");
  model.charts.forEach((chart) => {
    lines.push(`### ${markdown(chart.title)}`, "", `Type: ${markdown(chart.kind)}; Unit: ${markdown(chart.unit)}`, "");
    chart.points.forEach((point) => lines.push(`- ${markdown(point.label)}: ${markdown(String(point.value))} ${markdown(chart.unit)}; Evidence: ${markdown(references(point.evidence))}`));
    lines.push("");
  });
  lines.push("## Verification", "", `Ed25519: ${markdown(model.verification.ed25519_key_id)}`,
    `ML-DSA-65: ${markdown(model.verification.mldsa65_key_id)}`);
  return `${lines.join("\n")}\n`;
}

export function writeReportText(value: unknown): Uint8Array | undefined {
  const model = parseReportModel(value);
  return model === undefined ? undefined : bounded(textDocument(model));
}

export function writeReportMarkdown(value: unknown): Uint8Array | undefined {
  const model = parseReportModel(value);
  return model === undefined ? undefined : bounded(markdownDocument(model));
}

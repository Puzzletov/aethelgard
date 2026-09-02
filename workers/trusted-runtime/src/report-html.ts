import type { SourceReference } from "../../../src/contracts/analyze.ts";
import type { ChartData } from "../../../src/contracts/chart-data.ts";
import {
  MAX_REPORT_SECTIONS,
  parseReportModel,
  type ReportModel,
} from "../../../src/contracts/report-model.ts";
import { reportTokens } from "../../../src/contracts/report-tokens.ts";

export const MAX_REPORT_HTML_BYTES = 1_048_576;
const UTF8 = new TextEncoder();
const REPORT_SECTION_COUNT = 5;
declare const SERVICE_REPORT_HTML: unique symbol;
export type ServiceOwnedReportHtml = string & { readonly [SERVICE_REPORT_HTML]: true };

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function referenceLabel(reference: SourceReference): string {
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

function evidence(references: readonly SourceReference[]): string {
  return `<p class="evidence">Evidence: ${references.map((reference) =>
    escapeHtml(referenceLabel(reference))).join("; ")}</p>`;
}

function findings(model: ReportModel): string {
  const items = model.findings.map((item) => `<article><h3>${escapeHtml(item.title)}</h3>
<p>${escapeHtml(item.analysis)}</p><p>Confidence: ${escapeHtml(item.confidence)}</p>
${evidence(item.evidence)}</article>`).join("\n");
  return `<section><h2>Findings</h2>\n${items}</section>`;
}

function recommendations(model: ReportModel): string {
  const items = model.recommendations.map((item) => `<article><h3>${escapeHtml(item.title)}</h3>
<p>${escapeHtml(item.action)}</p><p>Priority: ${escapeHtml(item.priority)} · Confidence: ${escapeHtml(item.confidence)}</p>
${evidence(item.evidence)}</article>`).join("\n");
  return `<section><h2>Recommendations</h2>\n${items}</section>`;
}

function risks(model: ReportModel): string {
  const items = model.risks.length === 0 ? "<p>No material risks were identified.</p>"
    : model.risks.map((item, index) => `<article><h3>Risk ${index + 1}</h3>
<p>${escapeHtml(item.text)}</p><p>Confidence: ${escapeHtml(item.confidence)}</p>${evidence(item.evidence)}</article>`).join("\n");
  return `<section><h2>Risks</h2>\n${items}</section>`;
}

function chartTable(chart: ChartData): string {
  const rows = chart.points.map((point) => `<tr><th scope="row">${escapeHtml(point.label)}</th>`
    + `<td>${escapeHtml(String(point.value))} ${escapeHtml(chart.unit)}</td>`
    + `<td>${point.evidence.map(referenceLabel).map(escapeHtml).join("; ")}</td></tr>`).join("\n");
  return `<article><h3>${escapeHtml(chart.title)}</h3><p>Chart type: ${escapeHtml(chart.kind)}</p>
<table><thead><tr><th>Series</th><th>Value</th><th>Evidence</th></tr></thead><tbody>${rows}</tbody></table></article>`;
}

function charts(model: ReportModel): string {
  const content = model.charts.length === 0 ? "<p>No valid quantitative chart data was available.</p>"
    : model.charts.map(chartTable).join("\n");
  return `<section><h2>Quantitative analysis</h2>\n${content}</section>`;
}

function stylesheet(): string {
  const [xs, sm, md, lg, xl] = reportTokens.spacing;
  return `@page{size:A4;margin:18mm}*{box-sizing:border-box}body{margin:0;background:${reportTokens.paper};color:${reportTokens.charcoal};font:11pt/1.5 ${reportTokens.body_font}}main{max-width:180mm;margin:0 auto}h1,h2,h3{font-family:${reportTokens.display_font};break-after:avoid}h1{font-size:26pt}h2{border-top:${reportTokens.rule_width}px solid ${reportTokens.terracotta};padding-top:${sm}rem;margin-top:${xl}rem}h3{font-size:14pt;margin-bottom:${xs}rem}section,article,table{break-inside:avoid}article{margin:${lg}rem 0}p{margin:${xs}rem 0}.eyebrow,.evidence{color:${reportTokens.terracotta}}table{width:100%;border-collapse:collapse;margin:${md}rem 0}th,td{text-align:left;vertical-align:top;border-bottom:${reportTokens.rule_width}px solid ${reportTokens.charcoal};padding:${sm}rem}footer{margin-top:${xl}rem;padding-top:${md}rem;border-top:${reportTokens.rule_width}px solid ${reportTokens.charcoal};font-size:9pt}`;
}

function document(model: ReportModel): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>${escapeHtml(model.title)}</title><style>${stylesheet()}</style></head>
<body><main><header><p class="eyebrow">Aethelgard independent analysis · ${escapeHtml(model.focus)}</p><h1>${escapeHtml(model.title)}</h1></header>
<section><h2>Executive summary</h2><p>${escapeHtml(model.executive_summary)}</p></section>
${findings(model)}
${recommendations(model)}
${risks(model)}
${charts(model)}
<footer><p>Verification keys</p><p>Ed25519: ${escapeHtml(model.verification.ed25519_key_id)}</p><p>ML-DSA-65: ${escapeHtml(model.verification.mldsa65_key_id)}</p></footer></main></body></html>`;
}

export function renderReportHtml(value: unknown): ServiceOwnedReportHtml | undefined {
  const model = parseReportModel(value);
  if (model === undefined || REPORT_SECTION_COUNT > MAX_REPORT_SECTIONS) return undefined;
  const html = document(model);
  return UTF8.encode(html).byteLength <= MAX_REPORT_HTML_BYTES ? html as ServiceOwnedReportHtml : undefined;
}

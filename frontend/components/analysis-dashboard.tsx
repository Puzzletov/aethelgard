import type { NormalizedSourceRecord, SourceReference } from "../input/normalization/source-record";
import type { OracleOutput } from "../../src/contracts/oracle";
import type { SafeMode } from "../../src/contracts/safe-mode";

interface DashboardProps {
  readonly result: OracleOutput | SafeMode | null;
  readonly sources: readonly NormalizedSourceRecord[];
}

function referenceId(reference: SourceReference): string {
  return `source-${encodeURIComponent(JSON.stringify(reference))}`;
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

function Evidence({ items }: Readonly<{ items: readonly SourceReference[] }>) {
  return <span className="evidence-links">Evidence: {items.map((reference, index) => (
    <a key={referenceId(reference)} href={`#${referenceId(reference)}`}>
      {index > 0 ? ", " : ""}{referenceLabel(reference)}
    </a>
  ))}</span>;
}

function AnalysisItems({ result }: Readonly<{ result: OracleOutput }>) {
  return <>
    <section aria-labelledby="findings-title"><h3 id="findings-title">Findings</h3><ol>{result.findings.map((item) =>
      <li key={item.id}><h4>{item.title}</h4><p>{item.analysis}</p><p>Confidence: {item.confidence}</p>
        <Evidence items={item.evidence} /></li>)}</ol></section>
    <section aria-labelledby="recommendations-title"><h3 id="recommendations-title">Recommendations</h3><ol>
      {result.recommendations.map((item) => <li key={item.id}><h4>{item.title}</h4><p>{item.action}</p>
        <p>Priority: {item.priority}. Confidence: {item.confidence}.</p><Evidence items={item.evidence} /></li>)}</ol></section>
    <section aria-labelledby="risks-title"><h3 id="risks-title">Risks</h3><ul>{result.risks.map((item) =>
      <li key={item.id}><p>{item.text}</p><p>Confidence: {item.confidence}</p><Evidence items={item.evidence} /></li>)}</ul></section>
    <section aria-labelledby="candidates-title"><h3 id="candidates-title">Quantitative candidates</h3><ul>
      {result.quantitative_candidates.map((item) => <li key={item.id}><p>{item.label}: {item.value} {item.unit}</p>
        <p>{item.context}</p><Evidence items={item.evidence} /></li>)}</ul></section>
  </>;
}

function SourceIndex({ sources }: Readonly<{ sources: readonly NormalizedSourceRecord[] }>) {
  return <section aria-labelledby="sources-title"><h3 id="sources-title">Source references</h3><ol>
    {sources.map((source) => <li id={referenceId(source.reference)} key={source.ordinal} tabIndex={-1}>
      {referenceLabel(source.reference)}</li>)}</ol></section>;
}

export function AnalysisDashboard({ result, sources }: DashboardProps) {
  if (result === null) return null;
  if ("ok" in result) return <section className="analysis-fault" role="alert" aria-labelledby="fault-title">
    <h2 id="fault-title">Safe Mode</h2><p>{result.message}</p><p>No report was created.</p></section>;
  return <section className="analysis-dashboard" aria-labelledby="analysis-title">
    <h2 id="analysis-title">Analysis</h2>
    <section aria-labelledby="summary-title"><h3 id="summary-title">Executive summary</h3>
      <p>{result.executive_summary}</p></section>
    <AnalysisItems result={result} />
    <section aria-labelledby="resolutions-title"><h3 id="resolutions-title">Critique resolutions</h3><ul>
      {result.critique_resolutions.map((item) => <li key={item.steelman_item_id}>
        <strong>{item.status}</strong>: {item.explanation}</li>)}</ul></section>
    <SourceIndex sources={sources} />
  </section>;
}

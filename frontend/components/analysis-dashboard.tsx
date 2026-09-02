import type { NormalizedSourceRecord, SourceReference } from "../input/normalization/source-record";
import type { OracleOutput } from "../../src/contracts/oracle";
import type { ReportModel } from "../../src/contracts/report-model";
import type { SafeMode } from "../../src/contracts/safe-mode";
import { AnalysisChart } from "./analysis-chart";

interface DashboardProps {
  readonly result: OracleOutput | ReportModel | SafeMode | null;
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
  return <span className="evidence-links"><strong>Evidence</strong> {items.map((reference, index) => (
    <a key={referenceId(reference)} href={`#${referenceId(reference)}`}>
      {index > 0 ? ", " : ""}{referenceLabel(reference)}
    </a>
  ))}</span>;
}

function EmptyState({ children }: Readonly<{ children: string }>) {
  return <p className="empty-state">{children}</p>;
}

function DashboardIndex({ report }: Readonly<{ report: boolean }>) {
  const middle: readonly (readonly [string, string])[] = report
    ? [["charts", "Charts"]] : [["candidates", "Quantitative candidates"],
      ["resolutions", "Critique resolutions"]];
  const sections: readonly (readonly [string, string])[] = [
    ["summary", "Summary"], ["findings", "Findings"],
    ["recommendations", "Recommendations"], ["risks", "Risks"],
    ...middle,
    ["sources", "Sources"],
  ];
  return <nav className="analysis-index" aria-label="Analysis sections"><ol>{sections.map(([id, label]) =>
    <li key={id}><a href={`#${id}`}>{label}</a></li>)}</ol></nav>;
}

function AnalysisItems({ result }: Readonly<{ result: OracleOutput | ReportModel }>) {
  return <div className="analysis-sections">
    <section className="analysis-section" id="findings" aria-labelledby="findings-title"><h3 id="findings-title">Findings</h3>
      <ol className="result-list">{result.findings.map((item) =>
      <li key={item.id}><h4>{item.title}</h4><p>{item.analysis}</p><p className="result-meta">Confidence: {item.confidence}</p>
        <Evidence items={item.evidence} /></li>)}</ol></section>
    <section className="analysis-section" id="recommendations" aria-labelledby="recommendations-title"><h3 id="recommendations-title">Recommendations</h3>
      <ol className="result-list">
      {result.recommendations.map((item) => <li key={item.id}><h4>{item.title}</h4><p>{item.action}</p>
        <p className="result-meta">Priority: {item.priority}. Confidence: {item.confidence}.</p>
        <Evidence items={item.evidence} /></li>)}</ol></section>
    <section className="analysis-section" id="risks" aria-labelledby="risks-title"><h3 id="risks-title">Risks</h3>
      {result.risks.length === 0 ? <EmptyState>No risks were identified.</EmptyState>
        : <ul className="result-list">{result.risks.map((item) =>
      <li key={item.id}><p>{item.text}</p><p className="result-meta">Confidence: {item.confidence}</p>
        <Evidence items={item.evidence} /></li>)}</ul>}</section>
  </div>;
}

function SourceIndex({ sources }: Readonly<{ sources: readonly NormalizedSourceRecord[] }>) {
  return <section className="source-index" id="sources" aria-labelledby="sources-title"><h3 id="sources-title">Source references</h3><ol>
    {sources.map((source) => <li id={referenceId(source.reference)} key={source.ordinal} tabIndex={-1}>
      {referenceLabel(source.reference)}</li>)}</ol></section>;
}

export function AnalysisDashboard({ result, sources }: DashboardProps) {
  if (result === null) return null;
  if ("ok" in result) return <section className="analysis-fault" role="alert" aria-labelledby="fault-title">
    <p className="section-label">Protected stop</p><h2 id="fault-title">Safe Mode</h2>
    <p>{result.message}</p><p className="fault-assurance">No report was created.</p></section>;
  return <section className="analysis-dashboard" aria-labelledby="analysis-title">
    <header className="analysis-heading"><p className="section-label">Oracle synthesis</p>
      <h2 id="analysis-title">Analysis</h2></header>
    <DashboardIndex report={"charts" in result} />
    <section className="executive-summary" id="summary" aria-labelledby="summary-title"><h3 id="summary-title">Executive summary</h3>
      <p>{result.executive_summary}</p></section>
    <AnalysisItems result={result} />
    {"charts" in result ? <section className="analysis-section" id="charts" aria-labelledby="charts-title">
      <h3 id="charts-title">Charts</h3>{result.charts.length === 0
        ? <EmptyState>No charts were produced.</EmptyState>
        : result.charts.map((chart) => <AnalysisChart data={chart} key={chart.id} />)}</section> : <>
      <section className="analysis-section" id="candidates" aria-labelledby="candidates-title"><h3 id="candidates-title">Quantitative candidates</h3>
        {result.quantitative_candidates.length === 0 ? <EmptyState>No quantitative candidates were identified.</EmptyState>
          : <ul className="result-list">{result.quantitative_candidates.map((item) => <li key={item.id}><p>{item.label}: {item.value} {item.unit}</p>
            <p>{item.context}</p><Evidence items={item.evidence} /></li>)}</ul>}</section>
      <section className="analysis-section resolutions" id="resolutions" aria-labelledby="resolutions-title"><h3 id="resolutions-title">Critique resolutions</h3><ul>
        {result.critique_resolutions.map((item) => <li key={item.steelman_item_id}>
          <strong>{item.status}</strong>: {item.explanation}</li>)}</ul></section></>}
    <SourceIndex sources={sources} />
  </section>;
}

"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis } from "recharts";

import { parseChartData, type ChartData } from "../../src/contracts/chart-data";
import type { SourceReference } from "../input/normalization/source-record";

interface AnalysisChartProps { readonly data: unknown }

function sourceId(reference: SourceReference): string {
  return `source-${encodeURIComponent(JSON.stringify(reference))}`;
}

function sourceLabel(reference: SourceReference): string {
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

function ChartGraphic({ chart }: Readonly<{ chart: ChartData }>) {
  const common = <><CartesianGrid stroke="var(--color-rule)" vertical={false} />
    <XAxis dataKey="label" tick={{ fill: "var(--color-charcoal-soft)", fontSize: 11 }} />
    <YAxis tick={{ fill: "var(--color-charcoal-soft)", fontSize: 11 }} />
    <Tooltip formatter={(value) => [`${String(value)} ${chart.unit}`, chart.title]} /></>;
  if (chart.kind === "bar") return <BarChart data={chart.points} accessibilityLayer>{common}
    <Bar dataKey="value" fill="var(--color-terracotta)" /></BarChart>;
  return <LineChart data={chart.points} accessibilityLayer>{common}<Line dataKey="value"
    type="linear" stroke="var(--color-terracotta-dark)" strokeWidth={2} dot /></LineChart>;
}

function ChartTable({ chart }: Readonly<{ chart: ChartData }>) {
  return <table className="chart-data"><caption>{chart.title} source data</caption>
    <thead><tr><th scope="col">Measure</th><th scope="col">Value</th><th scope="col">Evidence</th></tr></thead>
    <tbody>{chart.points.map((point) => <tr key={`${point.label}:${point.value}`}><th scope="row">{point.label}</th>
      <td>{point.value} {chart.unit}</td><td>{point.evidence.map((reference, index) =>
        <a key={sourceId(reference)} href={`#${sourceId(reference)}`}>
          {index > 0 ? ", " : ""}{sourceLabel(reference)}</a>)}</td></tr>)}</tbody>
  </table>;
}

export function AnalysisChart({ data }: AnalysisChartProps) {
  const chart = parseChartData(data);
  if (chart === undefined) return null;
  return <figure className="analysis-chart" aria-labelledby={`chart-${chart.id}`}>
    <figcaption><h3 id={`chart-${chart.id}`}>{chart.title}</h3><p>Values in {chart.unit}</p></figcaption>
    <div className="chart-graphic" role="img" aria-label={`${chart.title}, ${chart.kind} chart in ${chart.unit}`}>
      <ResponsiveContainer width="100%" height="100%"><ChartGraphic chart={chart} /></ResponsiveContainer>
    </div><ChartTable chart={chart} />
  </figure>;
}

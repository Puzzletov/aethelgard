import type { Metadata } from "next";

import { AnalysisDashboard } from "../../components/analysis-dashboard";
import type { NormalizedSourceRecord } from "../../input/normalization/source-record";
import type { ReportModel } from "../../../src/contracts/report-model";
import report from "../../public/sample/aethelgard-synthetic-sample.report.json";

export const metadata: Metadata = {
  title: "Synthetic sample | Aethelgard",
  description: "A pre-generated synthetic Aethelgard report with independently verifiable signatures.",
};

const sources: readonly NormalizedSourceRecord[] = [
  { schema_version: "1", ordinal: 1, content: "Nine control reviews are complete.",
    reference: { kind: "txt_lines", line_start: 2, line_end: 2 } },
  { schema_version: "1", ordinal: 2, content: "Three control reviews remain outstanding.",
    reference: { kind: "txt_lines", line_start: 3, line_end: 3 } },
];

const files = [
  ["Download PDF", "/sample/aethelgard-synthetic-sample.pdf"],
  ["Download detached signature", "/sample/aethelgard-synthetic-sample.sig.json"],
  ["Download dedicated public keys", "/sample/aethelgard-synthetic-sample.signing-keys.json"],
  ["View synthetic source", "/sample/aethelgard-synthetic-sample.source.txt"],
] as const;

export default function SamplePage() {
  return <>
    <a className="skip-link" href="#sample-content">Skip to synthetic sample</a>
    <header className="site-header page-frame">
      <a className="wordmark" href="/" aria-label="Aethelgard home">Aethelgard</a>
      <a className="phase-mark" href="/trust">Trust</a>
    </header>
    <main className="sample-page page-frame" id="sample-content">
      <header className="trust-intro">
        <p className="eyebrow">Pre-generated portfolio fallback</p>
        <h1>Synthetic sample — not a live analysis.</h1>
        <p>This report uses invented programme data. It requires no live AI, Worker or Browser Run capacity.</p>
        <ul className="sample-actions">{files.map(([label, href]) =>
          <li key={href}><a href={href}>{label}</a></li>)}</ul>
        <p><a className="primary-link" href="/verify">Open the local verifier</a></p>
      </header>
      <AnalysisDashboard result={report as ReportModel} sources={sources} />
    </main>
    <footer className="site-footer page-frame"><p>Verify the PDF with its detached signature and dedicated sample keys.</p>
      <a href="/">Return to analysis</a></footer>
  </>;
}

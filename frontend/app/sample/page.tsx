import type { Metadata } from "next";

import { AnalysisDashboard } from "../../components/analysis-dashboard";
import type { ReportModel } from "../../../src/contracts/report-model";
import type { FinishedAnalysis } from "../../../src/contracts/finished-analysis";
import report from "../../public/sample/aethelgard-synthetic-sample.report.json";

export const metadata: Metadata = {
  title: "Synthetic sample | Aethelgard",
  description: "A pre-generated synthetic Aethelgard report with independently verifiable signatures.",
};

const sample = report as ReportModel;
const finished: FinishedAnalysis = {
  schema_version: "1",
  executive_summary: sample.executive_summary,
  findings: sample.findings.map((item) => `${item.title}: ${item.analysis}`),
  risks: sample.risks.map((item) => item.text),
  recommendations: sample.recommendations.map((item) => `${item.title}: ${item.action}`),
};

const files = [
  ["Download PDF", "/sample/aethelgard-synthetic-sample.pdf"],
  ["Download detached signature", "/sample/aethelgard-synthetic-sample.sig.json"],
  ["Download dashboard data", "/sample/aethelgard-synthetic-sample.report.json"],
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
        <h1>Synthetic static sample — not a live analysis.</h1>
        <p>This report uses invented programme data. It requires no live AI, Worker or Browser Run capacity.</p>
        <ul className="sample-actions">{files.map(([label, href]) =>
          <li key={href}><a href={href}>{label}</a></li>)}</ul>
        <p><a className="primary-link" href="/verify">Open the local verifier</a></p>
      </header>
      <AnalysisDashboard result={finished} />
    </main>
    <footer className="site-footer page-frame"><p>Verify the PDF with its detached signature and dedicated sample keys.</p><p>
      <a href="/privacy">Privacy notice</a> · <a href="/">Return to analysis</a></p></footer>
  </>;
}

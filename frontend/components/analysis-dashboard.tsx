import type { FinishedAnalysis } from "../../src/contracts/finished-analysis";
import type { SafeMode } from "../../src/contracts/safe-mode";
import type { PdfPreparationDiagnostic } from "../analysis/pdf-diagnostic";

interface DashboardProps {
  readonly result: FinishedAnalysis | SafeMode | null;
  readonly diagnostic?: PdfPreparationDiagnostic;
}

export function PdfDiagnosticPanel({ diagnostic }: Readonly<{ diagnostic?: PdfPreparationDiagnostic }>) {
  if (diagnostic === undefined) return null;
  return <aside className="pdf-diagnostic" aria-labelledby="pdf-diagnostic-title">
    <h3 id="pdf-diagnostic-title">Local PDF diagnostic</h3>
    <pre>{JSON.stringify(diagnostic, null, 2)}</pre>
  </aside>;
}

function Items({ id, title, values }: Readonly<{
  id: string; title: string; values: readonly string[];
}>) {
  return <section className="analysis-section" id={id} aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`}>{title}</h3>
    <ul className="result-list">{values.map((value, index) => <li key={`${id}-${index}`}>
      <p>{value}</p></li>)}</ul>
  </section>;
}

export function AnalysisDashboard({ result, diagnostic }: DashboardProps) {
  if (result === null) return null;
  if ("ok" in result) return <section className="analysis-fault" role="alert" aria-labelledby="fault-title">
    <p className="section-label">Protected stop</p><h2 id="fault-title">Analysis paused</h2>
    <p>{result.message}</p><PdfDiagnosticPanel diagnostic={diagnostic} /></section>;
  return <section className="analysis-dashboard" aria-labelledby="analysis-title">
    <header className="analysis-heading"><p className="section-label">Finished analysis</p>
      <h2 id="analysis-title">Analysis</h2></header>
    <nav className="analysis-index" aria-label="Analysis sections"><ol>
      <li><a href="#summary">Summary</a></li><li><a href="#findings">Findings</a></li>
      <li><a href="#risks">Risks / considerations</a></li>
      <li><a href="#recommendations">Recommendations</a></li>
    </ol></nav>
    <section className="executive-summary" id="summary" aria-labelledby="summary-title">
      <h3 id="summary-title">Executive summary</h3><p>{result.executive_summary}</p>
    </section>
    <div className="analysis-sections">
      <Items id="findings" title="Findings" values={result.findings} />
      <Items id="risks" title="Risks / considerations" values={result.risks} />
      <Items id="recommendations" title="Recommendations" values={result.recommendations} />
    </div>
  </section>;
}

import type { AnalyzeRequest } from "../../../src/contracts/analyze.ts";
import type { OracleOutput } from "../../../src/contracts/oracle.ts";
import { parseReportModel, type ReportModel } from "../../../src/contracts/report-model.ts";
import type { SafeMode } from "../../../src/contracts/safe-mode.ts";
import { buildDeterministicCharts } from "../../../src/report/chart-transform.ts";
import { createAnalyzeResponse } from "./analyze-response.ts";
import type { BrowserPdfBinding } from "./browser-pdf.ts";
import type { FinalPdfQueue } from "./pdf-queue.ts";
import { writeReportText } from "./plain-exports.ts";
import { produceProductionPdf } from "./production-pdf.ts";
import { settleBrowserRun, type BrowserRunReservation } from "./browser-quota.ts";
import { renderReportHtml } from "./report-html.ts";
import type { SigningIdentity } from "./hybrid-signing.ts";
import type { SignedFinalPdf } from "./final-signing.ts";
import { writeReportXlsx } from "./xlsx.ts";

export const SIGNING_FAILURE = Object.freeze({ schema_version: "1", ok: false,
  category: "signing", code: "signing_unavailable", message: "Report signing is unavailable.",
  retry: "later" } as const satisfies SafeMode);
export const REPORT_FAILURE = Object.freeze({ schema_version: "1", ok: false,
  category: "service", code: "report_unavailable", message: "The report could not be created safely.",
  retry: "later" } as const satisfies SafeMode);

interface PipelineRuntime {
  readonly browser: BrowserPdfBinding;
  readonly identity: () => Promise<SigningIdentity>;
  readonly queue: FinalPdfQueue;
  readonly sign: (bytes: Uint8Array) => Promise<SignedFinalPdf | undefined>;
  readonly storage: DurableObjectStorage;
  readonly reservation?: BrowserRunReservation;
}

function model(
  request: AnalyzeRequest,
  oracle: OracleOutput,
  identity: SigningIdentity,
): ReportModel | undefined {
  return parseReportModel({ schema_version: "1", focus: request.focus,
    title: `Aethelgard ${request.focus} analysis`, executive_summary: oracle.executive_summary,
    findings: oracle.findings, recommendations: oracle.recommendations, risks: oracle.risks,
    charts: buildDeterministicCharts(oracle.quantitative_candidates),
    verification: { ed25519_key_id: identity.ed25519KeyId,
      mldsa65_key_id: identity.mldsa65KeyId } });
}

async function signedPdf(
  request: AnalyzeRequest,
  report: ReportModel,
  runtime: PipelineRuntime,
) {
  if (!request.requested_outputs.includes("pdf")) return { status: "omitted" } as const;
  const produced = await produceProductionPdf(runtime.storage, runtime.queue, runtime.browser,
    async () => renderReportHtml(report), runtime.reservation);
  if (!produced.ok) return { status: "omitted" } as const;
  try {
    const signed = await runtime.sign(produced.bytes);
    return signed === undefined ? { status: "signing_failure" } as const
      : { status: "ok", value: { bytes: signed.bytes, signature_manifest: signed.manifest } } as const;
  } catch {
    return { status: "signing_failure" } as const;
  }
}

export async function createProductionReport(
  request: AnalyzeRequest,
  oracle: OracleOutput,
  runtime: PipelineRuntime,
): Promise<Response | SafeMode> {
  let identity: SigningIdentity;
  try {
    identity = await runtime.identity();
  } catch {
    if (runtime.reservation !== undefined) await settleBrowserRun(runtime.storage, runtime.reservation, 0);
    return SIGNING_FAILURE;
  }
  const report = model(request, oracle, identity);
  if (report === undefined) {
    if (runtime.reservation !== undefined) await settleBrowserRun(runtime.storage, runtime.reservation, 0);
    return REPORT_FAILURE;
  }
  const pdf = await signedPdf(request, report, runtime);
  if (pdf.status === "signing_failure") return SIGNING_FAILURE;
  const response = createAnalyzeResponse({ dashboard: report,
    requested_outputs: request.requested_outputs, pdf: pdf.status === "ok" ? pdf.value : undefined,
    xlsx: request.requested_outputs.includes("xlsx") ? writeReportXlsx(report) : undefined,
    text: request.requested_outputs.includes("text") ? writeReportText(report) : undefined });
  return response ?? REPORT_FAILURE;
}

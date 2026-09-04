import {
  reserveBrowserRun,
  settleBrowserRun,
  type BrowserRunReservation,
  type BrowserQuotaResult,
} from "./browser-quota.ts";
import {
  renderReportPdf,
  type BrowserPdfBinding,
  type BrowserPdfResult,
} from "./browser-pdf.ts";
import { type FinalPdfQueue } from "./pdf-queue.ts";
import type { ServiceOwnedReportHtml } from "./report-html.ts";

type HtmlFactory = () => Promise<ServiceOwnedReportHtml | undefined>;
export type ProductionPdfFailure = "busy" | "html" | "quota" | "render" | "storage";
export type ProductionPdfResult = Readonly<{ ok: true; bytes: Uint8Array; browserMs: number }>
  | Readonly<{ ok: false; reason: ProductionPdfFailure }>;

function quotaFailure(result: Exclude<BrowserQuotaResult, { ok: true }>): ProductionPdfResult {
  return { ok: false, reason: result.reason === "exhausted" ? "quota" : "storage" };
}

async function refundUnused(
  storage: DurableObjectStorage,
  reservation: Extract<BrowserQuotaResult, { ok: true }>["reservation"],
): Promise<boolean> {
  return settleBrowserRun(storage, reservation, 0);
}

function renderFailure(result: BrowserPdfResult): ProductionPdfResult {
  return { ok: false, reason: result.reason === "quota" ? "quota" : "render" };
}

export async function produceProductionPdf(
  storage: DurableObjectStorage,
  queue: FinalPdfQueue,
  browser: BrowserPdfBinding,
  createHtml: HtmlFactory,
  existingReservation?: BrowserRunReservation,
): Promise<ProductionPdfResult> {
  const quota: BrowserQuotaResult = existingReservation === undefined
    ? await reserveBrowserRun(storage) : { ok: true, reservation: existingReservation };
  if (!quota.ok) return quotaFailure(quota);
  let html: ServiceOwnedReportHtml | undefined;
  try {
    html = await createHtml();
  } catch {
    html = undefined;
  }
  if (html === undefined) {
    return await refundUnused(storage, quota.reservation)
      ? { ok: false, reason: "html" } : { ok: false, reason: "storage" };
  }
  const queued = await queue.run(() => renderReportPdf(browser, html));
  if (!queued.ok) {
    return await refundUnused(storage, quota.reservation)
      ? { ok: false, reason: "busy" } : { ok: false, reason: "storage" };
  }
  const result = queued.value;
  if (result.browserMs === undefined) return renderFailure(result);
  if (!await settleBrowserRun(storage, quota.reservation, result.browserMs)) {
    return { ok: false, reason: "storage" };
  }
  return result.ok && result.bytes !== undefined
    ? { ok: true, bytes: result.bytes, browserMs: result.browserMs }
    : renderFailure(result);
}

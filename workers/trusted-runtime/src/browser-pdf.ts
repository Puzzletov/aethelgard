import type { ServiceOwnedReportHtml } from "./report-html.ts";

export const MAX_FINAL_PDF_BYTES = 8 * 1024 * 1024;
export const PDF_RENDER_TIMEOUT_MS = 15_000;
const MAX_PDF_CHUNKS = 1_024;

export const SYNTHETIC_REPORT_HTML = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Aethelgard Browser Run foundation check</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { color: #16231f; font: 16px/1.5 Arial, sans-serif; }
  h1 { color: #143f35; font-size: 26px; }
  .proof { border-left: 4px solid #bd8a42; padding: 12px 16px; }
</style>
</head>
<body>
<main>
  <h1>Aethelgard</h1>
  <p class="proof">Fixed service-owned Browser Run foundation fixture.</p>
</main>
</body>
</html>`;

export interface BrowserPdfResult {
  readonly browserMs?: number;
  readonly bytes?: Uint8Array;
  readonly ok: boolean;
  readonly reason?: "binding" | "invalid_output" | "quota" | "timeout";
}

export interface BrowserPdfBinding {
  quickAction(action: "pdf", options: BrowserRunPDFOptions): Promise<Response>;
}

type PdfDeadline = (operation: Promise<Response>) => Promise<Response>;

export class PdfRenderTimeoutError extends Error {}

async function fixedDeadline(operation: Promise<Response>): Promise<Response> {
  let timer: number | null = null;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new PdfRenderTimeoutError("pdf_timeout")), PDF_RENDER_TIMEOUT_MS);
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function parseBrowserMs(response: Response): number | undefined {
  const value = response.headers.get("x-browser-ms-used");
  if (value === null || !/^\d{1,6}(?:\.\d{1,16})?$/.test(value)) return undefined;
  const milliseconds = Math.ceil(Number(value));
  return Number.isSafeInteger(milliseconds) && milliseconds >= 0 && milliseconds <= 60_000
    ? milliseconds
    : undefined;
}

async function readBoundedPdf(response: Response): Promise<Uint8Array | undefined> {
  const contentLength = response.headers.get("content-length");
  if (contentLength !== null && (!/^\d{1,9}$/.test(contentLength) || Number(contentLength) > MAX_FINAL_PDF_BYTES)) {
    return undefined;
  }
  if (response.body === null) return undefined;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    for (let index = 0; index < MAX_PDF_CHUNKS; index += 1) {
      const result = await reader.read();
      if (result.done) {
        if (totalBytes < 8) return undefined;
        const bytes = new Uint8Array(totalBytes);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.byteLength;
        }
        const header = new TextDecoder("ascii").decode(bytes.subarray(0, 5));
        const trailer = new TextDecoder("ascii").decode(bytes.subarray(Math.max(0, bytes.byteLength - 1_024)));
        return header === "%PDF-" && trailer.includes("%%EOF") ? bytes : undefined;
      }
      totalBytes += result.value.byteLength;
      if (totalBytes > MAX_FINAL_PDF_BYTES) return undefined;
      chunks.push(result.value);
    }
    return undefined;
  } catch {
    return undefined;
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

export async function renderSyntheticPdf(browser: BrowserPdfBinding): Promise<BrowserPdfResult> {
  let response: Response;
  try {
    response = await browser.quickAction("pdf", {
      html: SYNTHETIC_REPORT_HTML,
      actionTimeout: 30_000,
      cacheTTL: 0,
      setJavaScriptEnabled: false,
      pdfOptions: {
        format: "a4",
        printBackground: true,
        tagged: true,
        timeout: 30_000,
      },
    });
  } catch {
    return { ok: false, reason: "binding" };
  }
  const browserMs = parseBrowserMs(response);
  if (browserMs === undefined) return { ok: false, reason: "quota" };
  if (!response.ok || response.headers.get("content-type")?.split(";", 1)[0] !== "application/pdf") {
    return { ok: false, reason: "invalid_output", browserMs };
  }
  const bytes = await readBoundedPdf(response);
  return bytes === undefined
    ? { ok: false, reason: "invalid_output", browserMs }
    : { ok: true, bytes, browserMs };
}

export async function renderReportPdf(
  browser: BrowserPdfBinding,
  html: ServiceOwnedReportHtml,
  deadline: PdfDeadline = fixedDeadline,
): Promise<BrowserPdfResult> {
  let response: Response;
  try {
    response = await deadline(browser.quickAction("pdf", {
      html,
      actionTimeout: PDF_RENDER_TIMEOUT_MS,
      cacheTTL: 0,
      setJavaScriptEnabled: false,
      pdfOptions: {
        format: "a4",
        printBackground: true,
        tagged: true,
        timeout: PDF_RENDER_TIMEOUT_MS,
      },
    }));
  } catch (error) {
    return { ok: false, reason: error instanceof PdfRenderTimeoutError ? "timeout" : "binding" };
  }
  const browserMs = parseBrowserMs(response);
  if (browserMs === undefined) return { ok: false, reason: "quota" };
  if (!response.ok || response.headers.get("content-type")?.split(";", 1)[0] !== "application/pdf") {
    return { ok: false, reason: "invalid_output", browserMs };
  }
  const bytes = await readBoundedPdf(response);
  return bytes === undefined
    ? { ok: false, reason: "invalid_output", browserMs }
    : { ok: true, bytes, browserMs };
}

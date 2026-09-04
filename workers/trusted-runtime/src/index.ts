import { DurableObject } from "cloudflare:workers";

import { readBoundedBody } from "../../../src/public-edge/body.ts";
import { parseTrustedAnalyzeRequest } from "../../../src/contracts/analyze.ts";
import { verifyTurnstile } from "./turnstile.ts";
import { runAnalysis } from "./analysis-orchestrator.ts";
import { FinalPdfQueue } from "./pdf-queue.ts";
import { createProductionReport } from "./report-pipeline.ts";
import { productionSigningIdentity, signProductionFinalPdf } from "./signing-runtime.ts";
import { reserveBrowserRun, settleBrowserRun, type BrowserRunReservation } from "./browser-quota.ts";

const RESPONSE_HEADERS = Object.freeze({
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow, noarchive",
});

interface TrustedRuntimeEnv {
  readonly BROWSER: BrowserRun;
  readonly TURNSTILE_EXPECTED_ACTION: string;
  readonly TURNSTILE_EXPECTED_HOSTNAME: string;
  readonly TURNSTILE_SECRET: string;
  readonly GROQ_API_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly SIGNING_ED25519_PRIVATE_B64: string;
  readonly SIGNING_MLDSA65_SEED_B64: string;
}

function errorResponse(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ ok: false, error: { code, message } }), {
    status,
    headers: RESPONSE_HEADERS,
  });
}

function parseJson(bytes: Uint8Array): unknown {
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes));
  } catch {
    return undefined;
  }
}

const QUOTA_FAILURE = Object.freeze({ schema_version: "1", ok: false, category: "quota",
  code: "pdf_quota_exhausted", message: "PDF capacity is unavailable. Try again later.", retry: "later" } as const);

export class TrustedRuntime extends DurableObject<TrustedRuntimeEnv> {
  private readonly pdfQueue = new FinalPdfQueue();

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== "/analyze" || url.search !== "") {
      return errorResponse(404, "not_found", "Internal route not found.");
    }
    if (request.method !== "POST") {
      return errorResponse(405, "method_not_allowed", "Internal method is not allowed.");
    }
    if (request.headers.get("content-type") !== "application/json") {
      return errorResponse(415, "content_type_invalid", "Internal content type is invalid.");
    }
    const body = await readBoundedBody(request);
    if (!body.ok) {
      const status = body.reason === "too_large" ? 413 : 400;
      return errorResponse(status, "envelope_invalid", "Request body is invalid.");
    }
    const envelope = parseTrustedAnalyzeRequest(parseJson(body.bytes));
    if (envelope === undefined) {
      return errorResponse(400, "envelope_invalid", "Request body is invalid.");
    }
    const result = await verifyTurnstile(envelope.turnstile_token, {
      secret: this.env.TURNSTILE_SECRET,
      expectedAction: this.env.TURNSTILE_EXPECTED_ACTION,
      expectedHostname: this.env.TURNSTILE_EXPECTED_HOSTNAME,
    });
    if (!result.ok && result.reason === "unavailable") {
      return errorResponse(503, "turnstile_unavailable", "Verification is unavailable.");
    }
    if (!result.ok) {
      return errorResponse(403, "turnstile_invalid", "Request a fresh verification challenge.");
    }
    let reservation: BrowserRunReservation | undefined;
    if (envelope.requested_outputs.includes("pdf")) {
      const quota = await reserveBrowserRun(this.ctx.storage);
      if (!quota.ok) return new Response(JSON.stringify(QUOTA_FAILURE), { status: 200, headers: RESPONSE_HEADERS });
      reservation = quota.reservation;
    }
    const analysis = await runAnalysis(envelope, {
      groq: this.env.GROQ_API_KEY,
      openrouter_free: this.env.OPENROUTER_API_KEY,
    });
    if ("ok" in analysis) {
      if (reservation !== undefined) await settleBrowserRun(this.ctx.storage, reservation, 0);
      return new Response(JSON.stringify(analysis), { status: 200, headers: RESPONSE_HEADERS });
    }
    const report = await createProductionReport(envelope, analysis, {
      browser: this.env.BROWSER,
      identity: () => productionSigningIdentity(this.env.SIGNING_ED25519_PRIVATE_B64,
        this.env.SIGNING_MLDSA65_SEED_B64),
      queue: this.pdfQueue,
      sign: (bytes) => signProductionFinalPdf(bytes, this.env.SIGNING_ED25519_PRIVATE_B64,
        this.env.SIGNING_MLDSA65_SEED_B64),
      storage: this.ctx.storage,
      reservation,
    });
    return report instanceof Response ? report
      : new Response(JSON.stringify(report), { status: 200, headers: RESPONSE_HEADERS });
  }
}

export default {
  fetch(): Response {
    return errorResponse(404, "not_found", "Route not found.");
  },
} satisfies ExportedHandler;

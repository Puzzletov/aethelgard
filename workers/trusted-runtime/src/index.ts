import { DurableObject } from "cloudflare:workers";

import { readBoundedBody } from "../../../src/public-edge/body.ts";
import { isBasicAnalysisEnvelope } from "../../../src/public-edge/envelope.ts";
import { verifyTurnstile } from "./turnstile.ts";
import { renderSyntheticPdf } from "./browser-pdf.ts";
import { reserveBrowserRun, settleBrowserRun } from "./browser-quota.ts";
import { FinalPdfQueue } from "./pdf-queue.ts";
import { signTrustedFinalPdf } from "./signing-runtime.ts";
import { createFoundationProof } from "./foundation-proof.ts";

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

export class TrustedRuntime extends DurableObject<TrustedRuntimeEnv> {
  private readonly finalPdfQueue = new FinalPdfQueue();

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
    const envelope = parseJson(body.bytes);
    if (!isBasicAnalysisEnvelope(envelope)) {
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
    if (envelope.requested_outputs.includes("pdf")) {
      const queued = await this.finalPdfQueue.run(async () => {
        const quota = await reserveBrowserRun(this.ctx.storage);
        if (!quota.ok) return quota;
        const pdf = await renderSyntheticPdf(this.env.BROWSER);
        if (pdf.browserMs === undefined) return { ok: false, reason: "browser" } as const;
        const settled = await settleBrowserRun(this.ctx.storage, quota.reservation, pdf.browserMs);
        if (!settled || !pdf.ok) return { ok: false, reason: "browser" } as const;
        if (pdf.bytes === undefined) return { ok: false, reason: "browser" } as const;
        return { ok: true, bytes: pdf.bytes } as const;
      });
      if (!queued.ok) {
        return errorResponse(503, "pdf_queue_full", "PDF generation is busy. Try again later.");
      }
      if (!queued.value.ok) {
        const code = queued.value.reason === "exhausted" ? "pdf_quota_exhausted" : "pdf_unavailable";
        return errorResponse(503, code, "PDF generation is unavailable.");
      }
      try {
        const signed = await signTrustedFinalPdf(
          queued.value.bytes,
          this.env.SIGNING_ED25519_PRIVATE_B64,
          this.env.SIGNING_MLDSA65_SEED_B64,
        );
        return new Response(JSON.stringify({
          ok: true,
          output: createFoundationProof(queued.value.bytes, signed),
        }), { status: 200, headers: RESPONSE_HEADERS });
      } catch {
        return errorResponse(503, "signing_unavailable", "Signed PDF output is unavailable.");
      }
    }
    return errorResponse(503, "analysis_not_ready", "Analysis is not available yet.");
  }
}

export default {
  fetch(): Response {
    return errorResponse(404, "not_found", "Route not found.");
  },
} satisfies ExportedHandler;

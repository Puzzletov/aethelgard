import { DurableObject } from "cloudflare:workers";

import { readBoundedBody } from "../../../src/public-edge/body.ts";
import { isBasicAnalysisEnvelope } from "../../../src/public-edge/envelope.ts";
import { verifyTurnstile } from "./turnstile.ts";

const RESPONSE_HEADERS = Object.freeze({
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow, noarchive",
});

interface TrustedRuntimeEnv {
  readonly TURNSTILE_EXPECTED_ACTION: string;
  readonly TURNSTILE_EXPECTED_HOSTNAME: string;
  readonly TURNSTILE_SECRET: string;
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
    return errorResponse(503, "analysis_not_ready", "Analysis is not available yet.");
  }
}

export default {
  fetch(): Response {
    return errorResponse(404, "not_found", "Route not found.");
  },
} satisfies ExportedHandler;

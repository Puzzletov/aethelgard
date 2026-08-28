import { DurableObject } from "cloudflare:workers";

const RESPONSE_HEADERS = Object.freeze({
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow, noarchive",
});

function errorResponse(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ ok: false, error: { code, message } }), {
    status,
    headers: RESPONSE_HEADERS,
  });
}

export class TrustedRuntime extends DurableObject {
  fetch(request: Request): Response {
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
    return errorResponse(503, "turnstile_not_ready", "Analysis is not available yet.");
  }
}

export default {
  fetch(): Response {
    return errorResponse(404, "not_found", "Route not found.");
  },
} satisfies ExportedHandler;

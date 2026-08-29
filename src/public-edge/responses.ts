type JsonPrimitive = boolean | number | string | null;
type JsonValue = JsonPrimitive | readonly JsonValue[] | Readonly<{ [key: string]: JsonValue }>;

const SECURITY_HEADERS = Object.freeze({
  "cache-control": "no-store",
  "content-security-policy": "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "permissions-policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "x-robots-tag": "noindex, nofollow, noarchive",
});

function responseHeaders(origin?: string, additional?: HeadersInit): Headers {
  const headers = new Headers(SECURITY_HEADERS);
  headers.set("content-type", "application/json; charset=utf-8");
  if (origin !== undefined) {
    headers.set("access-control-allow-origin", origin);
    headers.set("vary", "Origin");
  }
  if (additional !== undefined) {
    new Headers(additional).forEach((value, key) => headers.set(key, value));
  }
  return headers;
}

export function passThroughResponse(response: Response, origin: string): Response {
  const headers = responseHeaders(origin, {
    "content-type": response.headers.get("content-type") ?? "application/octet-stream",
  });
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

export function jsonResponse(status: number, body: JsonValue, origin?: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(origin),
  });
}

export function safeError(status: number, code: string, message: string, origin?: string): Response {
  return jsonResponse(status, { ok: false, error: { code, message } }, origin);
}

export function methodNotAllowed(allow: string, origin?: string): Response {
  return new Response(null, {
    status: 405,
    headers: responseHeaders(origin, { allow }),
  });
}

export function preflightResponse(origin: string): Response {
  return new Response(null, {
    status: 204,
    headers: responseHeaders(origin, {
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-max-age": "600",
    }),
  });
}

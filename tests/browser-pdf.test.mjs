import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_FINAL_PDF_BYTES,
  SYNTHETIC_REPORT_HTML,
  renderSyntheticPdf,
} from "../workers/trusted-runtime/src/browser-pdf.ts";

const validPdf = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF");

function browserReturning(body, options = {}) {
  const calls = [];
  return {
    calls,
    browser: {
      async quickAction(action, input) {
        calls.push({ action, input });
        return new Response(body, {
          status: options.status ?? 200,
          headers: {
            "content-type": options.contentType ?? "application/pdf",
            "x-browser-ms-used": options.browserMs ?? "87.57470703125",
            ...options.headers,
          },
        });
      },
    },
  };
}

test("Browser Run uses only the fixed service-owned synthetic HTML", async () => {
  const { browser, calls } = browserReturning(validPdf);
  const result = await renderSyntheticPdf(browser);
  assert.equal(result.ok, true);
  assert.equal(result.browserMs, 88);
  assert.deepEqual(result.bytes, validPdf);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].action, "pdf");
  assert.equal(calls[0].input.html, SYNTHETIC_REPORT_HTML);
  assert.equal(calls[0].input.url, undefined);
  assert.equal(calls[0].input.cacheTTL, 0);
  assert.equal(calls[0].input.setJavaScriptEnabled, false);
  assert.equal(calls[0].input.actionTimeout, 30_000);
});

test("Browser Run output fails closed on bad magic, type, size, or usage header", async () => {
  const badMagic = browserReturning("not a PDF");
  const badType = browserReturning(validPdf, { contentType: "text/plain" });
  const oversized = browserReturning(validPdf, {
    headers: { "content-length": String(MAX_FINAL_PDF_BYTES + 1) },
  });
  const noUsage = browserReturning(validPdf, { browserMs: "missing" });
  assert.equal((await renderSyntheticPdf(badMagic.browser)).ok, false);
  assert.equal((await renderSyntheticPdf(badType.browser)).ok, false);
  assert.equal((await renderSyntheticPdf(oversized.browser)).ok, false);
  assert.deepEqual(await renderSyntheticPdf(noUsage.browser), { ok: false, reason: "quota" });
});

test("Browser Run binding failure is fixed and non-sensitive", async () => {
  const browser = { async quickAction() { throw new Error("provider detail"); } };
  assert.deepEqual(await renderSyntheticPdf(browser), { ok: false, reason: "binding" });
});

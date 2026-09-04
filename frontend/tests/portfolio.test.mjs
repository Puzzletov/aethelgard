import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("portfolio explains the no-copy journey in bounded plain language", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  const start = page.indexOf("const journey");
  const end = page.indexOf("const sampleFiles");
  const copy = page.slice(start, end);
  assert.ok(start >= 0 && end > start && [...copy].length <= 10_000);
  for (const phrase of ["Open", "Analyze", "Keep the proof", "source stays on your device",
    "Only the redacted business text is sent", "detect any later byte change"]) {
    assert.match(copy, new RegExp(phrase, "u"));
  }
  assert.doesNotMatch(copy, /SaaS|SLA|all browsers|all languages|unhackable|malware-scanned/iu);
});

test("portfolio has accessible proof navigation and responsive layout", async () => {
  const [page, styles] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"), readFile(new URL("app/globals.css", root), "utf8"),
  ]);
  assert.match(page, /aria-labelledby="portfolio-title"/);
  assert.match(page, /<ol className="portfolio-flow">/);
  assert.match(page, /aria-label="Project proof"/);
  for (const href of ["/sample", "/verify", "/case-study", "/trust"]) {
    assert.match(page, new RegExp(`href="${href}"`, "u"));
  }
  assert.match(styles, /@media \(max-width: 48rem\)[\s\S]*\.case-study > section,[\s\S]*\.trust-page section/);
  assert.doesNotMatch(page, /dangerouslySetInnerHTML|target="_blank"/);
});

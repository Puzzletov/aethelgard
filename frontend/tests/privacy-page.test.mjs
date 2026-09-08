import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("Privacy is stable, accessible, and available before analysis", async () => {
  const [page, home, trust, verify, sample, caseStudy] = await Promise.all([
    read("app/privacy/page.tsx"), read("app/page.tsx"), read("app/trust/page.tsx"),
    read("app/verify/page.tsx"), read("app/sample/page.tsx"), read("app/case-study/page.tsx"),
  ]);
  for (const id of ["responsibility", "processing", "purposes", "recipients", "transfers",
    "cookies", "rights", "decisions", "security"]) assert.match(page, new RegExp(`${id}-title`, "u"));
  assert.match(page, /href="#privacy-content"/u);
  assert.match(page, /aria-current="page">Privacy/u);
  assert.match(home, /href="\/privacy"/u);
  assert.match(trust, /href="\/privacy"/u);
  for (const supportingPage of [verify, sample, caseStudy]) {
    assert.match(supportingPage, /href="\/privacy"/u);
  }
  assert.doesNotMatch(page, /dialog|checkbox|dangerouslySetInnerHTML|target="_blank"/u);
});

test("Privacy distinguishes local data, pseudonymised requests, and provider metadata", async () => {
  const page = await read("app/privacy/page.tsx");
  assert.match(page, /raw document, unredacted extracted text and PII placeholder mapping remain in browser memory/u);
  assert.match(page, /may still be personal data/u);
  assert.match(page, /Only the UTC date and aggregate Browser Run milliseconds persist/u);
  assert.match(page, /Turnstile does not receive the document or form contents/u);
  assert.match(page, /exact downstream provider can vary/u);
  assert.match(page, /Provider handling is separate from Aethelgard application storage/u);
  assert.match(page, /cannot retrieve a document or report it never stored/u);
});

test("public claims reject unsupported privacy and security absolutes", async () => {
  const paths = ["app/page.tsx", "app/privacy/page.tsx", "app/trust/page.tsx", "trust/claims.ts"];
  const publicClaims = (await Promise.all(paths.map(read))).join("\n");
  const forbidden = /GDPR certified|GDPR guaranteed|fully GDPR compliant|completely private|100% secure|anonymous AI|no personal data is processed|no data ever leaves your device|no third party receives data|nothing is logged anywhere|zero cookies/iu;
  assert.doesNotMatch(publicClaims, forbidden);
  assert.match(publicClaims, /No security control is absolute/u);
  assert.match(publicClaims, /privacy contact[\s\S]*await owner confirmation/u);
});

test("accountability register retains every unresolved release decision", async () => {
  const register = await read("../PRIVACY_COMPLIANCE.md");
  for (const item of ["Controller identity", "Article 6", "Cloudflare", "Groq", "OpenRouter",
    "Turnstile", "GDPR RELEASE BLOCKER", "Article 28", "Article 9", "Terms"]) {
    assert.match(register, new RegExp(item, "u"));
  }
  assert.doesNotMatch(register, /is (?:a )?certification|certified compliant/iu);
});

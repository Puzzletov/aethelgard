import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const claimIds = ["mission_no_copy", "browser_local_source", "redacted_ai_processing",
  "anonymous_quota_state", "provider_metadata_limit", "english_only",
  "desktop_chrome_edge", "no_malware_scan", "hybrid_exact_byte_signing", "exact_zero"];

test("Trust page contains the complete allow-listed claim set within its bound", async () => {
  const claims = await read("trust/claims.ts");
  for (const id of claimIds) assert.equal(claims.match(new RegExp(`id: "${id}"`, "gu"))?.length, 1);
  assert.equal((claims.match(/\bid: "/gu) ?? []).length, claimIds.length);
  assert.ok([...claims].length <= 20_000);
  assert.match(claims, /Raw source files and unredacted extracted text are never sent/);
  assert.match(claims, /both Ed25519 and ML-DSA-65\. All checks must pass/);
});

test("Trust claims preserve the approved limits without stronger marketing claims", async () => {
  const claims = await read("trust/claims.ts");
  assert.match(claims, /does not claim to malware-scan source files/);
  assert.match(claims, /compromised client device or browser engine/);
  assert.match(claims, /no uptime service-level agreement/);
  assert.match(claims, /metadata is outside Aethelgard application storage/);
  assert.doesNotMatch(claims, /malware-scanned|unhackable|detects all PII|stores no metadata/iu);
});

test("Trust route has accessible landmarks, headings and local navigation", async () => {
  const [page, home] = await Promise.all([read("app/trust/page.tsx"), read("app/page.tsx")]);
  assert.match(page, /href="#trust-content"/);
  assert.match(page, /<main className="trust-page page-frame" id="trust-content">/);
  assert.match(page, /<h1>/);
  assert.match(page, /aria-labelledby="trust-claims-title"/);
  assert.match(page, /aria-labelledby="processors-title"/);
  assert.match(page, /aria-labelledby="limits-title"/);
  assert.match(page, /href="\/"/);
  assert.match(home, /href="\/trust"/);
  assert.doesNotMatch(page, /target="_blank"|dangerouslySetInnerHTML/);
});

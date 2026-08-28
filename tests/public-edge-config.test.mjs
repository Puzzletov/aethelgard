import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("public edge configuration contains only public values and rate limiting", async () => {
  const config = await readFile(new URL("wrangler.toml", root), "utf8");
  assert.match(config, /ALLOWED_ORIGIN = "https:\/\/aethelgard\.pages\.dev"/);
  assert.match(config, /name = "ANALYZE_RATE_LIMIT"/);
  assert.match(config, /limit = 5/);
  assert.match(config, /period = 60/);
  assert.match(config, /name = "TRUSTED_RUNTIME"/);
  assert.match(config, /class_name = "TrustedRuntime"/);
  assert.match(config, /script_name = "aethelgard-trusted-runtime"/);
  assert.doesNotMatch(config, /service/i);
  assert.doesNotMatch(config, /API_KEY|PRIVATE|SIGNING|TURNSTILE_SECRET|ENCRYPTION_KEY/);
});

test("public edge source does not verify Turnstile or call providers", async () => {
  const source = await readFile(new URL("src/index.ts", root), "utf8");
  assert.doesNotMatch(source, /siteverify|GROQ|OPENROUTER|Browser Run|\/sign/i);
});

test("TrustedRuntime is private and has no dispatcher or public target", async () => {
  const config = await readFile(new URL("workers/trusted-runtime/wrangler.toml", root), "utf8");
  const source = await readFile(new URL("workers/trusted-runtime/src/index.ts", root), "utf8");
  assert.match(config, /workers_dev = false/);
  assert.match(config, /preview_urls = false/);
  assert.match(config, /\[exports\.TrustedRuntime\]/);
  assert.match(config, /TURNSTILE_EXPECTED_ACTION = "analyze"/);
  assert.match(config, /TURNSTILE_EXPECTED_HOSTNAME = "aethelgard\.pages\.dev"/);
  assert.match(config, /required = \["TURNSTILE_SECRET"\]/);
  assert.doesNotMatch(config, /^route\s*=|^routes\s*=/m);
  assert.match(source, /export default/);
  assert.doesNotMatch(source, /getByName|idFromName|newUniqueId/);
  assert.doesNotMatch(source, /API_KEY|PRIVATE_B64|ENCRYPTION_KEY/);
});

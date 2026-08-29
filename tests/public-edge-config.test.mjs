import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("public edge configuration contains only public values and rate limiting", async () => {
  const config = await readFile(new URL("wrangler.toml", root), "utf8");
  assert.match(config, /ALLOWED_ORIGIN = "https:\/\/aethelgard-3j9\.pages\.dev"/);
  assert.match(config, /name = "ANALYZE_RATE_LIMIT"/);
  assert.match(config, /limit = 5/);
  assert.match(config, /period = 60/);
  assert.match(config, /name = "TRUSTED_RUNTIME"/);
  assert.match(config, /class_name = "TrustedRuntime"/);
  assert.match(config, /script_name = "aethelgard-trusted-runtime"/);
  assert.doesNotMatch(config, /service/i);
  assert.doesNotMatch(config, /API_KEY|PRIVATE|SIGNING|TURNSTILE_SECRET|ENCRYPTION_KEY/);
});

test("Pages uses the account-owned free hostname project and static output", async () => {
  const config = await readFile(new URL("frontend/wrangler.toml", root), "utf8");
  assert.match(config, /^name = "aethelgard"$/m);
  assert.match(config, /^pages_build_output_dir = "\.\/out"$/m);
  assert.match(config, /^compatibility_date = "2026-08-04"$/m);
  assert.doesNotMatch(config, /secret|kv_namespace|r2_bucket|d1_database/i);
});

test("public edge source does not verify Turnstile or call providers", async () => {
  const source = await readFile(new URL("src/index.ts", root), "utf8");
  assert.doesNotMatch(source, /siteverify|GROQ|OPENROUTER|Browser Run|\/sign/i);
});

test("TrustedRuntime is private and has no dispatcher or public target", async () => {
  const [config, publicConfig, source] = await Promise.all([
    readFile(new URL("workers/trusted-runtime/wrangler.toml", root), "utf8"),
    readFile(new URL("wrangler.toml", root), "utf8"),
    readFile(new URL("workers/trusted-runtime/src/index.ts", root), "utf8"),
  ]);
  assert.match(config, /workers_dev = false/);
  assert.match(config, /preview_urls = false/);
  assert.match(config, /\[exports\.TrustedRuntime\]/);
  assert.match(config, /TURNSTILE_EXPECTED_ACTION = "analyze"/);
  assert.match(config, /TURNSTILE_EXPECTED_HOSTNAME = "aethelgard-3j9\.pages\.dev"/);
  assert.match(config, /required = \["TURNSTILE_SECRET", "SIGNING_ED25519_PRIVATE_B64", "SIGNING_MLDSA65_SEED_B64"\]/);
  assert.match(config, /type = "CompiledWasm"/);
  assert.match(config, /\[browser\]\s+binding = "BROWSER"/m);
  assert.doesNotMatch(publicConfig, /\[browser\]|binding = "BROWSER"/);
  assert.doesNotMatch(config, /^route\s*=|^routes\s*=/m);
  assert.match(source, /export default/);
  assert.doesNotMatch(source, /getByName|idFromName|newUniqueId/);
  assert.doesNotMatch(source, /GROQ|OPENROUTER|ENCRYPTION_KEY/);
});

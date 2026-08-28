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
  assert.doesNotMatch(config, /API_KEY|PRIVATE|SIGNING|TURNSTILE_SECRET|ENCRYPTION_KEY/);
});

test("public edge source does not verify Turnstile or call providers", async () => {
  const source = await readFile(new URL("src/index.ts", root), "utf8");
  assert.doesNotMatch(source, /siteverify|GROQ|OPENROUTER|Browser Run|\/sign/i);
});

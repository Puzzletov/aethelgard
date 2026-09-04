import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sourceUrl = new URL("../security/turnstile-client.ts", import.meta.url);

test("frontend Turnstile uses only the public key and analyze action", async () => {
  const source = await readFile(sourceUrl, "utf8");
  assert.match(source, /TURNSTILE_SITE_KEY = "0x4AAAAAAEGLv7UgKYeWsVdW"/);
  assert.doesNotMatch(source, /process\.env|NEXT_PUBLIC_TURNSTILE_SITE_KEY/);
  assert.match(source, /TURNSTILE_ACTION = "analyze"/);
  assert.doesNotMatch(source, /TURNSTILE_SECRET|siteverify|remoteip/);
});

test("frontend Turnstile clears and resets after an attempt", async () => {
  const source = await readFile(sourceUrl, "utf8");
  assert.match(source, /takeToken/);
  assert.match(source, /resetAfterAttempt/);
  assert.match(source, /api\.reset\(widgetId\)/);
  assert.match(source, /expired-callback/);
});

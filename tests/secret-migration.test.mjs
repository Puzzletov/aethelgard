import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = new URL("../", import.meta.url);

for (const script of [
  "scripts/prepare-private-secret-holder.mjs",
  "scripts/migrate-runtime-provider-secrets.mjs",
]) {
  test(`${script} requires an explicit reviewed flag before external work`, async () => {
    const result = spawnSync(process.execPath, [script], { cwd: root, encoding: "utf8", timeout: 10_000 });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /reviewed/i);
    const source = await readFile(new URL(script, root), "utf8");
    assert.doesNotMatch(source, /console\.(?:log|error)|process\.stdout\.write\([^)]*(?:secret|groq|openrouter|turnstile)\s*\)/i);
  });
}

test("provider migration validates credentials without model inference or user data", async () => {
  const source = await readFile(new URL("scripts/migrate-runtime-provider-secrets.mjs", root), "utf8");
  assert.match(source, /https:\/\/api\.groq\.com\/openai\/v1\/models/);
  assert.match(source, /https:\/\/openrouter\.ai\/api\/v1\/key/);
  assert.doesNotMatch(source, /chat\/completions|messages|prompt|requested_outputs/);
});

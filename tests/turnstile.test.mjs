import assert from "node:assert/strict";
import test from "node:test";

import { verifyTurnstile } from "../workers/trusted-runtime/src/turnstile.ts";

const dummyToken = "XXXX.DUMMY.TOKEN.XXXX";
const config = Object.freeze({
  secret: "1x0000000000000000000000000000000AA",
  expectedAction: "analyze",
  expectedHostname: "aethelgard-3j9.pages.dev",
});

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function createFetcher(value, status = 200) {
  const calls = [];
  return {
    calls,
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init });
      return jsonResponse(value, status);
    },
  };
}

test("Siteverify sends only the secret and token and accepts exact context", async () => {
  const { calls, fetcher } = createFetcher({
    success: true,
    hostname: "aethelgard-3j9.pages.dev",
    action: "analyze",
    "error-codes": [],
  });
  assert.deepEqual(await verifyTurnstile(dummyToken, config, fetcher), { ok: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    secret: config.secret,
    response: dummyToken,
  });
  assert.doesNotMatch(calls[0].init.body, /remoteip/);
});

test("the provider-marked test response is accepted only by explicit test configuration", async () => {
  const response = createFetcher({
    success: true,
    hostname: "example.com",
    "error-codes": [],
    metadata: { result_with_testing_key: true },
  });
  assert.deepEqual(await verifyTurnstile(dummyToken, {
    ...config,
    expectedAction: "test",
    expectedHostname: "example.com",
  }, response.fetcher), { ok: true });
  assert.deepEqual(await verifyTurnstile(dummyToken, config, response.fetcher), {
    ok: false,
    reason: "action_mismatch",
  });
});

test("Siteverify rejects invalid and replayed tokens", async () => {
  const invalid = createFetcher({ success: false, "error-codes": ["invalid-input-response"] });
  const replay = createFetcher({ success: false, "error-codes": ["timeout-or-duplicate"] });
  assert.deepEqual(await verifyTurnstile(dummyToken, config, invalid.fetcher), {
    ok: false,
    reason: "invalid",
  });
  assert.deepEqual(await verifyTurnstile(dummyToken, config, replay.fetcher), {
    ok: false,
    reason: "invalid",
  });
});

test("Siteverify rejects the wrong action and hostname", async () => {
  const action = createFetcher({ success: true, hostname: config.expectedHostname, action: "login" });
  const hostname = createFetcher({ success: true, hostname: "evil.example", action: config.expectedAction });
  assert.deepEqual(await verifyTurnstile(dummyToken, config, action.fetcher), {
    ok: false,
    reason: "action_mismatch",
  });
  assert.deepEqual(await verifyTurnstile(dummyToken, config, hostname.fetcher), {
    ok: false,
    reason: "hostname_mismatch",
  });
});

test("Siteverify bounds tokens, responses, and transport failures", async () => {
  const unused = createFetcher({ success: true });
  assert.deepEqual(await verifyTurnstile("", config, unused.fetcher), { ok: false, reason: "invalid" });
  assert.deepEqual(await verifyTurnstile("x".repeat(2_049), config, unused.fetcher), {
    ok: false,
    reason: "invalid",
  });
  assert.equal(unused.calls.length, 0);
  const oversized = async () => new Response(`{"success":true,"padding":"${"x".repeat(8_192)}"}`);
  assert.deepEqual(await verifyTurnstile(dummyToken, config, oversized), {
    ok: false,
    reason: "unavailable",
  });
  const failed = async () => { throw new DOMException("timeout", "TimeoutError"); };
  assert.deepEqual(await verifyTurnstile(dummyToken, config, failed), {
    ok: false,
    reason: "unavailable",
  });
  const unknownMetadata = createFetcher({
    success: true,
    hostname: config.expectedHostname,
    action: config.expectedAction,
    metadata: { unexpected: true },
  });
  assert.deepEqual(await verifyTurnstile(dummyToken, config, unknownMetadata.fetcher), {
    ok: false,
    reason: "unavailable",
  });
});

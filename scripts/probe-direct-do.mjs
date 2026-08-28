const probeUrl = "http://127.0.0.1:8791/analyze";
const envelope = Object.freeze({
  schema_version: "1",
  turnstile_token: "test-token",
  focus: "full",
  requested_outputs: ["pdf"],
  sources: [{ reference: "page 1", content: "[PERSON_1] approved the plan." }],
});

const response = await fetch(probeUrl, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    origin: "https://aethelgard.pages.dev",
    "cf-connecting-ip": "192.0.2.1",
  },
  body: JSON.stringify(envelope),
  signal: AbortSignal.timeout(5_000),
});
const result = await response.json();

if (response.status !== 503 || result?.error?.code !== "turnstile_not_ready") {
  throw new Error(
    `Direct binding proof failed with HTTP ${response.status} and code ${String(result?.error?.code)}.`,
  );
}

console.log(`PASS - direct external DO - HTTP ${response.status} ${result.error.code}`);

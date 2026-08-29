import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { verifyPhase0Proof } from "./phase0-proof-verifier.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wrangler = path.join(root, "node_modules", "wrangler", "bin", "wrangler.js");
const publicConfigPath = path.join(root, ".phase0-public-verify.toml");
const privateConfigPath = path.join(root, "workers", "trusted-runtime", ".phase0-private-verify.toml");
const privateSecretsPath = path.join(root, "workers", "trusted-runtime", ".phase0-private-verify.secrets.json");
const suffix = randomBytes(4).toString("hex");
const publicName = `aethelgard-phase0-verify-${suffix}`;
const privateName = `aethelgard-trusted-runtime-phase0-verify-${suffix}`;
const allowedOrigin = "https://aethelgard-3j9.pages.dev";
const maxCommandOutputBytes = 2 * 1024 * 1024;
const disposableSecret = "1x0000000000000000000000000000000AA";
const disposableToken = "XXXX.DUMMY.TOKEN.XXXX";
let summary;

function replaceOnce(source, expected, replacement) {
  const first = source.indexOf(expected);
  if (first === -1 || source.indexOf(expected, first + expected.length) !== -1) {
    throw new Error(`Disposable config source is not exact: ${expected}`);
  }
  return source.slice(0, first) + replacement + source.slice(first + expected.length);
}

function runWrangler(arguments_, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [wrangler, ...arguments_], {
      cwd: root,
      env: {
        ...process.env,
        WRANGLER_SEND_METRICS: "false",
        WRANGLER_TELEMETRY_DISABLED: "1",
      },
      stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    const output = { stdout: "", stderr: "" };
    let outputBytes = 0;
    const collect = (name) => (chunk) => {
      outputBytes += chunk.byteLength;
      if (outputBytes > maxCommandOutputBytes) {
        child.kill("SIGTERM");
        return;
      }
      output[name] += chunk.toString("utf8");
    };
    child.stdout.on("data", collect("stdout"));
    child.stderr.on("data", collect("stderr"));
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({ ...output, code, signal, outputBytes }));
    if (input !== undefined) child.stdin.end(input);
  });
}

function requireSuccess(result, operation) {
  if (result.code !== 0 || result.signal !== null || result.outputBytes > maxCommandOutputBytes) {
    const context = `${result.stdout}\n${result.stderr}`
      .slice(-4_096)
      .replaceAll(disposableSecret, "[REDACTED]")
      .replaceAll(edSeed.toString("base64"), "[REDACTED]")
      .replaceAll(mlSeed.toString("base64"), "[REDACTED]");
    throw new Error(`${operation} failed.\n${context}`);
  }
  if (/(?:^|[^a-z])warn(?:ing)?(?:[^a-z]|$)/i.test(`${result.stdout}\n${result.stderr}`)) {
    throw new Error(`${operation} emitted a warning.`);
  }
  return result;
}

async function requireUnused(name) {
  const result = await runWrangler(["deployments", "list", "--name", name]);
  if (result.code === 0) throw new Error(`Disposable Worker name already exists: ${name}`);
  if (!/does not exist|code:\s*10007|not found/i.test(`${result.stdout}\n${result.stderr}`)) {
    requireSuccess(result, `Checking ${name}`);
  }
}

function parseSecretNames(output) {
  const match = output.match(/\[[\s\S]*\]\s*$/);
  if (match === null) throw new Error("Secret-name response was invalid.");
  const parsed = JSON.parse(match[0]);
  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item?.name === "string")) {
    throw new Error("Secret-name response was invalid.");
  }
  return parsed.map((item) => item.name).sort();
}

async function boundedJson(response, maxBytes = 16 * 1024 * 1024) {
  if (response.body === null) throw new Error("Deployment response had no body.");
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      total += result.value.byteLength;
      if (total > maxBytes) throw new Error("Deployment response exceeded its bound.");
      chunks.push(result.value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  const bytes = Buffer.alloc(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

async function cleanup(name) {
  const result = await runWrangler(["delete", name, "--force"]);
  requireSuccess(result, `Deleting disposable Worker ${name}`);
}

const created = [];
const edSeed = randomBytes(32);
const mlSeed = randomBytes(32);
let primaryError;
try {
  await requireUnused(publicName);
  await requireUnused(privateName);
  const [publicBase, privateBase] = await Promise.all([
    readFile(path.join(root, "wrangler.toml"), "utf8"),
    readFile(path.join(root, "workers", "trusted-runtime", "wrangler.toml"), "utf8"),
  ]);
  let publicConfig = replaceOnce(publicBase, 'name = "aethelgard"', `name = "${publicName}"`);
  publicConfig = replaceOnce(
    publicConfig,
    'script_name = "aethelgard-trusted-runtime"',
    `script_name = "${privateName}"`,
  );
  let privateConfig = replaceOnce(
    privateBase,
    'name = "aethelgard-trusted-runtime"',
    `name = "${privateName}"`,
  );
  privateConfig = replaceOnce(
    privateConfig,
    'TURNSTILE_EXPECTED_ACTION = "analyze"',
    'TURNSTILE_EXPECTED_ACTION = "test"',
  );
  privateConfig = replaceOnce(
    privateConfig,
    'TURNSTILE_EXPECTED_HOSTNAME = "aethelgard-3j9.pages.dev"',
    'TURNSTILE_EXPECTED_HOSTNAME = "example.com"',
  );
  await Promise.all([
    writeFile(publicConfigPath, publicConfig, { encoding: "utf8", flag: "wx" }),
    writeFile(privateConfigPath, privateConfig, { encoding: "utf8", flag: "wx" }),
    writeFile(privateSecretsPath, JSON.stringify({
      TURNSTILE_SECRET: disposableSecret,
      GROQ_API_KEY: "phase0-unused-groq",
      OPENROUTER_API_KEY: "phase0-unused-openrouter",
      SIGNING_ED25519_PRIVATE_B64: edSeed.toString("base64"),
      SIGNING_MLDSA65_SEED_B64: mlSeed.toString("base64"),
    }), { encoding: "utf8", flag: "wx", mode: 0o600 }),
  ]);

  const privateDeployResult = await runWrangler([
    "deploy",
    "--config",
    privateConfigPath,
    "--secrets-file",
    privateSecretsPath,
  ]);
  if (privateDeployResult.code === 0 && privateDeployResult.signal === null) created.push(privateName);
  const privateDeploy = requireSuccess(
    privateDeployResult,
    "Deploying the disposable private runtime",
  );
  const publicDeployResult = await runWrangler(["deploy", "--config", publicConfigPath]);
  if (publicDeployResult.code === 0 && publicDeployResult.signal === null) created.push(publicName);
  const publicDeploy = requireSuccess(
    publicDeployResult,
    "Deploying the disposable public edge",
  );
  const urlMatch = `${publicDeploy.stdout}\n${publicDeploy.stderr}`.match(/https:\/\/[^\s]+\.workers\.dev/);
  if (urlMatch === null) throw new Error("Disposable public Worker URL was not reported.");
  const publicUrl = urlMatch[0];

  const [publicSecrets, privateSecrets] = await Promise.all([
    runWrangler(["secret", "list", "--name", publicName]),
    runWrangler(["secret", "list", "--name", privateName]),
  ]);
  requireSuccess(publicSecrets, "Checking public-edge secret names");
  requireSuccess(privateSecrets, "Checking private-runtime secret names");
  if (parseSecretNames(publicSecrets.stdout).length !== 0) throw new Error("Public edge has a secret.");
  const expectedPrivateSecrets = [
    "GROQ_API_KEY",
    "OPENROUTER_API_KEY",
    "SIGNING_ED25519_PRIVATE_B64",
    "SIGNING_MLDSA65_SEED_B64",
    "TURNSTILE_SECRET",
  ];
  if (parseSecretNames(privateSecrets.stdout).join("\0") !== expectedPrivateSecrets.join("\0")) {
    throw new Error("Private-runtime secret slots are not exact.");
  }

  const healthResponse = await fetch(`${publicUrl}/health`, { signal: AbortSignal.timeout(15_000) });
  const health = await boundedJson(healthResponse, 8_192);
  if (!healthResponse.ok || health.status !== "ok" || health.architecture !== "2.1") {
    throw new Error("Disposable public health check failed.");
  }
  const forbiddenResponse = await fetch(`${publicUrl}/sign`, { signal: AbortSignal.timeout(15_000) });
  if (forbiddenResponse.status !== 404) throw new Error("A public signing route exists.");
  const publicHost = new URL(publicUrl).hostname;
  if (!publicHost.startsWith(`${publicName}.`)) throw new Error("Disposable public hostname was invalid.");
  const privateUrl = `https://${privateName}.${publicHost.slice(publicName.length + 1)}`;
  const privateResponse = await fetch(privateUrl, { signal: AbortSignal.timeout(15_000) });
  if (privateResponse.headers.get("content-type")?.startsWith("application/json") === true) {
    throw new Error("Private runtime has a public target.");
  }
  const callerInputResponse = await fetch(`${publicUrl}/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: allowedOrigin },
    body: JSON.stringify({
      schema_version: "1",
      turnstile_token: disposableToken,
      focus: "full",
      requested_outputs: ["pdf"],
      sources: [{ reference: "phase0-fixture", content: "synthetic" }],
      html: "<p>caller input</p>",
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (callerInputResponse.status !== 400) throw new Error("Caller-controlled signing input was accepted.");

  const started = performance.now();
  const proofResponse = await fetch(`${publicUrl}/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: allowedOrigin },
    body: JSON.stringify({
      schema_version: "1",
      turnstile_token: disposableToken,
      focus: "full",
      requested_outputs: ["pdf"],
      sources: [{ reference: "phase0-fixture", content: "[PERSON_1] approved the synthetic plan." }],
    }),
    signal: AbortSignal.timeout(180_000),
  });
  const proofBody = await boundedJson(proofResponse);
  if (!proofResponse.ok) {
    const safeCode = typeof proofBody?.error?.code === "string" ? proofBody.error.code : "invalid_error";
    throw new Error(`Disposable analysis returned HTTP ${proofResponse.status} (${safeCode}).`);
  }
  const verified = verifyPhase0Proof(proofBody);
  const elapsedMs = Math.ceil(performance.now() - started);
  if (elapsedMs > 180_000) throw new Error("Disposable analysis exceeded the wall stop.");

  const privateStartup = `${privateDeploy.stdout}\n${privateDeploy.stderr}`.match(/Startup Time:\s*([0-9.]+)\s*ms/i)?.[1];
  const privateSize = `${privateDeploy.stdout}\n${privateDeploy.stderr}`.match(/Total Upload:\s*([0-9.]+\s*KiB)\s*\/\s*gzip:\s*([0-9.]+\s*KiB)/i);
  summary = {
    status: "ok",
    pages_origin: allowedOrigin,
    public_edge_secrets: 0,
    private_runtime_public_target: false,
    private_runtime_secret_slots: expectedPrivateSecrets.length,
    forbidden_sign_route_status: forbiddenResponse.status,
    caller_signing_input_status: callerInputResponse.status,
    analysis_elapsed_ms: elapsedMs,
    private_startup_ms: privateStartup === undefined ? null : Number(privateStartup),
    private_bundle_raw: privateSize?.[1] ?? null,
    private_bundle_gzip: privateSize?.[2] ?? null,
    ...verified,
  };
} catch (error) {
  primaryError = error;
} finally {
  edSeed.fill(0);
  mlSeed.fill(0);
  const cleanupErrors = [];
  for (const name of [...created].reverse()) {
    try {
      await cleanup(name);
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  await Promise.all([
    rm(publicConfigPath, { force: true }),
    rm(privateConfigPath, { force: true }),
    rm(privateSecretsPath, { force: true }),
  ]);
  if (cleanupErrors.length > 0) {
    primaryError = new Error(`Disposable cleanup failed for: ${created.join(", ")}`);
  }
}

if (primaryError !== undefined) throw primaryError;
process.stdout.write(`${JSON.stringify({ ...summary, disposable_resources_removed: true })}\n`);

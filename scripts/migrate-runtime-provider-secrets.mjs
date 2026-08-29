import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wrangler = path.join(root, "node_modules", "wrangler", "bin", "wrangler.js");
const workerName = "aethelgard-trusted-runtime";
const projectId = "aethelgard-prod-504515";
const sitekey = "0x4AAAAAAEGLv7UgKYeWsVdW";
const maxOutputBytes = 1024 * 1024;

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const gcloudPath = argument("--gcloud");
if (!process.argv.includes("--apply-reviewed") || gcloudPath === undefined) {
  throw new Error("Owner-reviewed migration requires --apply-reviewed and --gcloud <absolute-path>.");
}
const resolvedGcloud = path.resolve(gcloudPath);
if (!path.isAbsolute(gcloudPath) || !/gcloud\.cmd$/i.test(resolvedGcloud) || !existsSync(resolvedGcloud)) {
  throw new Error("The gcloud path is invalid.");
}
const gcloudPowerShell = resolvedGcloud.replace(/\.cmd$/i, ".ps1");
if (!existsSync(gcloudPowerShell)) throw new Error("The gcloud PowerShell launcher is missing.");
const powershell = path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");

function collect(child, includeStdout = true) {
  return new Promise((resolve, reject) => {
    const result = { stdout: [], stderr: [], bytes: 0 };
    const add = (name) => (chunk) => {
      result.bytes += chunk.byteLength;
      if (result.bytes > maxOutputBytes) child.kill("SIGTERM");
      else result[name].push(Buffer.from(chunk));
    };
    if (includeStdout) child.stdout.on("data", add("stdout"));
    child.stderr.on("data", add("stderr"));
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({
      code,
      signal,
      bytes: result.bytes,
      stdout: Buffer.concat(result.stdout),
      stderr: Buffer.concat(result.stderr),
    }));
  });
}

async function runWrangler(arguments_, input) {
  const child = spawn(process.execPath, [wrangler, ...arguments_], {
    cwd: root,
    env: { ...process.env, WRANGLER_SEND_METRICS: "false", WRANGLER_TELEMETRY_DISABLED: "1" },
    stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
    windowsHide: true,
  });
  const completed = collect(child);
  if (input !== undefined) child.stdin.end(input);
  return completed;
}

async function readGoogleSecret(secretName) {
  const child = spawn(powershell, [
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    gcloudPowerShell,
    "secrets",
    "versions",
    "access",
    "latest",
    `--secret=${secretName}`,
    `--project=${projectId}`,
  ], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  const result = await collect(child);
  if (result.code !== 0 || result.signal !== null || result.bytes > maxOutputBytes) {
    throw new Error(`Reading ${secretName} failed; no secret value was printed.`);
  }
  const value = result.stdout.toString("utf8").trim();
  result.stdout.fill(0);
  if (value.length < 8 || value.length > 8_192 || /[\r\n]/.test(value)) {
    throw new Error(`${secretName} has an invalid value shape.`);
  }
  return value;
}

function requireSuccess(result, operation) {
  if (result.code !== 0 || result.signal !== null || result.bytes > maxOutputBytes) {
    throw new Error(`${operation} failed; no secret value was printed.`);
  }
  const diagnostics = result.stderr.toString("utf8");
  if (/(?:^|[^a-z])warn(?:ing)?(?:[^a-z]|$)/i.test(diagnostics)) {
    throw new Error(`${operation} emitted a warning.`);
  }
  return result;
}

async function validateProviderCredential(name, url, credential) {
  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { authorization: `Bearer ${credential}` },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error(`${name} credential validation was unavailable.`);
  }
  await response.body?.cancel().catch(() => undefined);
  if (!response.ok || response.headers.get("content-type")?.split(";", 1)[0] !== "application/json") {
    throw new Error(`${name} credential validation failed with HTTP ${response.status}.`);
  }
}

let groq;
let openrouter;
let turnstile;
try {
  const widget = requireSuccess(
    await runWrangler(["turnstile", "widget", "get", sitekey, "--json"]),
    "Reading the account-owned Turnstile widget",
  );
  const widgetRecord = JSON.parse(widget.stdout.toString("utf8"));
  widget.stdout.fill(0);
  if (widgetRecord.sitekey !== sitekey || typeof widgetRecord.secret !== "string") {
    throw new Error("Turnstile widget response was invalid.");
  }
  turnstile = widgetRecord.secret;
  groq = await readGoogleSecret("GROQ_API_KEY");
  openrouter = await readGoogleSecret("OPENROUTER_API_KEY");
  await Promise.all([
    validateProviderCredential("Groq", "https://api.groq.com/openai/v1/models", groq),
    validateProviderCredential("OpenRouter", "https://openrouter.ai/api/v1/key", openrouter),
  ]);
  const payload = JSON.stringify({
    TURNSTILE_SECRET: turnstile,
    GROQ_API_KEY: groq,
    OPENROUTER_API_KEY: openrouter,
  });
  const upload = requireSuccess(
    await runWrangler(["secret", "bulk", "--name", workerName], payload),
    "Uploading provider secrets to the private runtime",
  );
  upload.stdout.fill(0);
  const listed = requireSuccess(
    await runWrangler(["secret", "list", "--name", workerName]),
    "Verifying private-runtime secret names",
  );
  const names = JSON.parse(listed.stdout.toString("utf8")).map((item) => item.name).sort();
  const migrated = ["GROQ_API_KEY", "OPENROUTER_API_KEY", "TURNSTILE_SECRET"];
  const expected = [
    "GROQ_API_KEY",
    "OPENROUTER_API_KEY",
    "SIGNING_ED25519_PRIVATE_B64",
    "SIGNING_MLDSA65_SEED_B64",
    "TURNSTILE_SECRET",
  ];
  if (names.join("\0") !== expected.join("\0")) {
    throw new Error("Provider secret-name verification failed.");
  }
  process.stdout.write(`${JSON.stringify({
    status: "ok",
    worker: workerName,
    migrated_secret_names: migrated,
    final_secret_slots: expected.length,
    credential_checks: { groq: true, openrouter: true },
    private_values_printed: false,
    sources_retained: true,
  })}\n`);
} finally {
  groq = undefined;
  openrouter = undefined;
  turnstile = undefined;
}

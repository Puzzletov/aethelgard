import { spawn } from "node:child_process";
import { rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wrangler = path.join(root, "node_modules", "wrangler", "bin", "wrangler.js");
const workerName = "aethelgard-trusted-runtime";
const sourcePath = path.join(root, "workers", "trusted-runtime", ".secret-holder.ts");
const configPath = path.join(root, "workers", "trusted-runtime", ".secret-holder.toml");
const maxOutputBytes = 1024 * 1024;

if (!process.argv.includes("--apply-reviewed")) {
  throw new Error("Owner-reviewed secret-holder preparation requires --apply-reviewed.");
}

function runWrangler(arguments_) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [wrangler, ...arguments_], {
      cwd: root,
      env: { ...process.env, WRANGLER_SEND_METRICS: "false", WRANGLER_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    const result = { stdout: "", stderr: "", bytes: 0 };
    const collect = (name) => (chunk) => {
      result.bytes += chunk.byteLength;
      if (result.bytes > maxOutputBytes) child.kill("SIGTERM");
      else result[name] += chunk.toString("utf8");
    };
    child.stdout.on("data", collect("stdout"));
    child.stderr.on("data", collect("stderr"));
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({ ...result, code, signal }));
  });
}

function requireSuccess(result, operation) {
  if (result.code !== 0 || result.signal !== null || result.bytes > maxOutputBytes) {
    throw new Error(`${operation} failed.\n${`${result.stdout}\n${result.stderr}`.slice(-4_096)}`);
  }
  if (/(?:^|[^a-z])warn(?:ing)?(?:[^a-z]|$)/i.test(`${result.stdout}\n${result.stderr}`)) {
    throw new Error(`${operation} emitted a warning.`);
  }
  return result;
}

const existing = await runWrangler(["deployments", "list", "--name", workerName]);
if (existing.code === 0) throw new Error("The final private Worker already exists; refusing to overwrite it.");
if (!/does not exist|code:\s*10007|not found/i.test(`${existing.stdout}\n${existing.stderr}`)) {
  requireSuccess(existing, "Checking the final private Worker");
}

const source = `export default { fetch(): Response { return new Response(null, { status: 404 }); } };\n`;
const config = `name = "${workerName}"
main = ".secret-holder.ts"
compatibility_date = "2026-08-04"
workers_dev = false
preview_urls = false

[observability]
enabled = false
`;
try {
  await Promise.all([
    writeFile(sourcePath, source, { encoding: "utf8", flag: "wx" }),
    writeFile(configPath, config, { encoding: "utf8", flag: "wx" }),
  ]);
  requireSuccess(
    await runWrangler(["deploy", "--config", configPath]),
    "Deploying the private secret holder",
  );
  const secrets = requireSuccess(
    await runWrangler(["secret", "list", "--name", workerName]),
    "Checking the private secret holder",
  );
  if (!/\[\s*\]\s*$/.test(secrets.stdout)) throw new Error("New private secret holder is not empty.");
  process.stdout.write(`${JSON.stringify({
    status: "ok",
    worker: workerName,
    public_target: false,
    observability: false,
    secret_slots: 0,
  })}\n`);
} finally {
  await Promise.all([rm(sourcePath, { force: true }), rm(configPath, { force: true })]);
}

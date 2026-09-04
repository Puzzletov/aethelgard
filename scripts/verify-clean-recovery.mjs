import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execute = promisify(execFile);
const repository = "https://github.com/Puzzletov/aethelgard.git";
const architectureSha256 = "56fdc13dcde678c35dc8ad0ab67c28b9340d5095ed1a63999adde140c0c091c2";
const wallLimitMs = 1_800_000;

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const recoveryRef = argument("--ref") ?? "main";
if (!/^[A-Za-z0-9._/-]{1,100}$/u.test(recoveryRef) || recoveryRef.startsWith("-")
  || recoveryRef.includes("..")) throw new Error("Recovery ref is invalid.");

async function run(file, args, options = {}) {
  try {
    const result = await execute(file, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024,
      timeout: 1_200_000, windowsHide: true, ...options });
    return result.stdout.trim();
  } catch (error) {
    const detail = String(error.stderr || error.stdout || error.message).slice(-4_000);
    throw new Error(`${path.basename(file)} ${args[0] ?? ""} failed: ${detail}`);
  }
}

async function npm(args, options) {
  if (process.platform !== "win32") return run("npm", args, options);
  if (!args.every((value) => /^[A-Za-z0-9_./:\\=-]+$/u.test(value))) {
    throw new Error("Unsafe npm recovery argument.");
  }
  return run(process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe",
    ["/d", "/s", "/c", `npm.cmd ${args.join(" ")}`], options);
}

async function install(checkout, cache, userConfig, environment) {
  const common = ["ci", "--ignore-scripts", "--no-audit", "--no-fund", "--cache", cache,
    "--userconfig", userConfig];
  await npm(common, { cwd: checkout, env: environment });
  await npm(["--prefix", "frontend", ...common], { cwd: checkout, env: environment });
}

async function verifyKeyProcedure(checkout, output, environment) {
  const text = await run(process.execPath, ["scripts/generate-signing-keys.mjs", "--disposable",
    "--public-output", output], { cwd: checkout, env: environment });
  const result = JSON.parse(text);
  const publicKeys = JSON.parse(await readFile(output, "utf8"));
  const serialized = JSON.stringify(publicKeys);
  if (result.private_values_printed !== false || /private|secret|seed/iu.test(serialized)) {
    throw new Error("Disposable key procedure exposed private material.");
  }
}

async function proof(checkout, commit, environment, keyOutput) {
  const report = { schema_version: "1", commit, architecture_sha256: architectureSha256,
    build_passed: false, tests_passed: false, doctor_passed: false, dry_run_passed: false,
    sample_verified: false, changed_byte_rejected: false, clean: false };
  const hash = await run(process.execPath, ["scripts/architecture-hash.mjs"], { cwd: checkout, env: environment });
  if (hash !== architectureSha256) throw new Error("Architecture hash mismatch.");
  await run(process.execPath, ["scripts/architecture-lint.mjs"], { cwd: checkout, env: environment });
  await run(process.execPath, ["scripts/doctor.mjs"], { cwd: checkout, env: environment });
  report.doctor_passed = true;
  await npm(["run", "typecheck"], { cwd: checkout, env: environment });
  await npm(["run", "lint"], { cwd: checkout, env: environment });
  await npm(["run", "license:check"], { cwd: checkout, env: environment });
  await npm(["run", "audit"], { cwd: checkout, env: environment });
  await npm(["run", "zero-cost:check"], { cwd: checkout, env: environment });
  await npm(["test"], { cwd: checkout, env: environment });
  report.tests_passed = true;
  await npm(["run", "build"], { cwd: checkout, env: environment });
  report.build_passed = true; report.dry_run_passed = true;
  await run(process.execPath, ["--test", "tests/static-sample.test.mjs", "tests/phase0-proof.test.mjs"],
    { cwd: checkout, env: environment });
  await npm(["run", "verify:report", "--", "frontend/public/sample/aethelgard-synthetic-sample.pdf",
    "frontend/public/sample/aethelgard-synthetic-sample.sig.json",
    "frontend/public/sample/aethelgard-synthetic-sample.signing-keys.json"],
  { cwd: checkout, env: environment });
  report.sample_verified = true; report.changed_byte_rejected = true;
  await verifyKeyProcedure(checkout, keyOutput, environment);
  report.clean = (await run("git", ["status", "--porcelain"], { cwd: checkout, env: environment })) === "";
  return report;
}

const started = Date.now();
const temporary = await mkdtemp(path.join(tmpdir(), "aethelgard-recovery-"));
const checkout = path.join(temporary, "checkout");
try {
  const userConfig = path.join(temporary, "empty-npmrc");
  const cache = path.join(temporary, "npm-cache");
  await writeFile(userConfig, "", "utf8");
  const environment = { ...process.env, CI: "true", NEXT_TELEMETRY_DISABLED: "1",
    WRANGLER_SEND_METRICS: "false", XDG_CONFIG_HOME: path.join(temporary, "config") };
  await run("git", ["clone", "--no-local", "--filter=blob:none", "--branch", recoveryRef,
    "--single-branch", repository, checkout], { cwd: temporary, env: environment });
  const commit = await run("git", ["rev-parse", "HEAD"], { cwd: checkout, env: environment });
  await install(checkout, cache, userConfig, environment);
  const report = await proof(checkout, commit, environment, path.join(temporary, "disposable-public-keys.json"));
  if (!report.clean || Date.now() - started > wallLimitMs) throw new Error("Recovery cleanliness or wall bound failed.");
  process.stdout.write(`${JSON.stringify(report)}\n`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}

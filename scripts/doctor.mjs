import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ARCHITECTURE_VERSION,
  AUTHORITATIVE_ARCHITECTURE_SHA256,
  BUILD_PHASE,
  EXPECTED_ALLOWED_ORIGIN,
  EXPECTED_PRIVATE_BROWSER_BINDING,
  EXPECTED_MLDSA65_WASM_BYTES,
  EXPECTED_MLDSA65_WASM_SHA256,
  EXPECTED_PUBLIC_ROUTES,
  EXPECTED_TRUSTED_RUNTIME,
  FORBIDDEN_DEPENDENCIES,
  REQUIRED_PRIVATE_SECRET_NAMES,
} from "../src/invariants.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
let checkCount = 0;

function check(id, condition) {
  checkCount += 1;
  if (!condition) failures.push(id);
}

function gitBlob(revision) {
  return execFileSync("git", ["cat-file", "blob", revision], {
    cwd: root, encoding: "buffer", maxBuffer: 16 * 1024 * 1024,
  });
}

async function text(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function json(relativePath) {
  return JSON.parse(await text(relativePath));
}

function hasTomlAssignment(source, name, valuePattern) {
  return new RegExp(`^${name}\\s*=\\s*${valuePattern}\\s*$`, "m").test(source);
}

function section(source, name) {
  const header = source.match(new RegExp(`^\\[${name.replaceAll(".", "\\.")}\\]\\s*$`, "m"));
  if (header?.index === undefined) return "";
  const remainder = source.slice(header.index + header[0].length);
  const nextSection = remainder.search(/^\[/m);
  return nextSection === -1 ? remainder : remainder.slice(0, nextSection);
}

async function listTypeScriptFiles(relativeDirectory) {
  const directory = path.join(root, relativeDirectory);
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if ([".next", "node_modules", "out"].includes(entry.name)) continue;
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) files.push(...await listTypeScriptFiles(relativePath));
    if (entry.isFile() && /\.tsx?$/.test(entry.name)) files.push(relativePath);
  }
  return files;
}

const [rootPackage, frontendPackage, publicConfig, privateConfig, publicSource, mldsaWasm] = await Promise.all([
  json("package.json"),
  json("frontend/package.json"),
  text("wrangler.toml"),
  text("workers/trusted-runtime/wrangler.toml"),
  text("src/index.ts"),
  readFile(path.join(root, "workers/trusted-runtime/vendor/mldsa-native/mldsa65.wasm")),
]);

check("architecture_version", ARCHITECTURE_VERSION === "2.1");
check("architecture_hash", createHash("sha256").update(gitBlob(":ARCHITECTURE.md")).digest("hex") === AUTHORITATIVE_ARCHITECTURE_SHA256);
check("build_phase", BUILD_PHASE === "2");
check("project_version", rootPackage.version === "0.0.1");
check("public_origin", hasTomlAssignment(publicConfig, "ALLOWED_ORIGIN", `"${EXPECTED_ALLOWED_ORIGIN}"`));
check("external_do_binding", [
  `name = "${EXPECTED_TRUSTED_RUNTIME.binding}"`,
  `class_name = "${EXPECTED_TRUSTED_RUNTIME.className}"`,
  `script_name = "${EXPECTED_TRUSTED_RUNTIME.scriptName}"`,
].every((line) => publicConfig.includes(line)));
check("private_no_public_target", [
  hasTomlAssignment(privateConfig, "workers_dev", "false"),
  hasTomlAssignment(privateConfig, "preview_urls", "false"),
  !/^routes?\s*=/m.test(privateConfig),
].every(Boolean));
check("private_secret_slots", REQUIRED_PRIVATE_SECRET_NAMES.every((name) => section(privateConfig, "secrets").includes(`"${name}"`)));
check("private_browser_binding", hasTomlAssignment(section(privateConfig, "browser"), "binding", `"${EXPECTED_PRIVATE_BROWSER_BINDING}"`));
check("private_wasm_rule", [
  'type = "CompiledWasm"',
  'globs = ["**/*.wasm"]',
].every((line) => privateConfig.includes(line)));
check("mldsa_wasm_size", mldsaWasm.byteLength === EXPECTED_MLDSA65_WASM_BYTES);
check("mldsa_wasm_hash", createHash("sha256").update(mldsaWasm).digest("hex") === EXPECTED_MLDSA65_WASM_SHA256);
check("public_secret_free", !/^\[secrets\]\s*$/m.test(publicConfig) && !/SECRET|API_KEY|PRIVATE_KEY/m.test(publicConfig));
check("public_routes", EXPECTED_PUBLIC_ROUTES.every((route) => publicSource.includes(`"${route}"`)));
check("forbidden_routes", !/["'`](?:\/sign|\/upload|\/parse)["'`]/.test(publicSource));
check("public_logging_disabled", hasTomlAssignment(section(publicConfig, "observability"), "enabled", "false"));
check("private_logging_disabled", hasTomlAssignment(section(privateConfig, "observability"), "enabled", "false"));
check("no_logging_products", !/tail_consumers|logpush|analytics_engine_datasets/i.test(`${publicConfig}\n${privateConfig}`));
check("no_forbidden_storage", !/\[\[(?:kv_namespaces|r2_buckets|d1_databases|queues\.(?:producers|consumers))\b/i.test(`${publicConfig}\n${privateConfig}`));
for (const manifest of [rootPackage, frontendPackage]) {
  const dependencies = { ...manifest.dependencies, ...manifest.devDependencies };
  check("forbidden_dependencies", FORBIDDEN_DEPENDENCIES.every((name) => dependencies[name] === undefined));
}

const workerFiles = [
  ...await listTypeScriptFiles("src"),
  ...await listTypeScriptFiles(path.join("workers", "trusted-runtime", "src")),
  ...await listTypeScriptFiles("frontend"),
];
const workerSources = await Promise.all(workerFiles.map(text));
const workerSourceText = workerSources.join("\n");
check("browser_quota_guard", [
  "utc_date",
  "aggregate_browser_run_ms",
  "8 * 60 * 1_000",
].every((marker) => workerSourceText.includes(marker)));
check("no_application_logging", workerSources.every((source) => !/\bconsole\s*\.|\bctx\.waitUntil\s*\([^)]*(?:log|telemetry)/i.test(source)));

if (failures.length > 0) {
  process.stderr.write(`${JSON.stringify({ status: "failed", failures: [...new Set(failures)].sort() })}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`${JSON.stringify({ status: "ok", architecture: ARCHITECTURE_VERSION, phase: BUILD_PHASE, checks: checkCount })}\n`);
}

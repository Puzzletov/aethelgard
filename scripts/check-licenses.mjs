import { readFile } from "node:fs/promises";

const approvedLicenses = new Set([
  "0BSD",
  "Apache-2.0",
  "Apache-2.0 AND LGPL-3.0-or-later",
  "Apache-2.0 AND LGPL-3.0-or-later AND MIT",
  "BSD-3-Clause",
  "CC-BY-4.0",
  "CC0-1.0",
  "ISC",
  "LGPL-3.0-or-later",
  "MIT",
  "MIT OR Apache-2.0",
]);
const lockfiles = ["package-lock.json", "frontend/package-lock.json"];
const failures = [];
let checkedPackages = 0;

function isOptionalPlaceholder(metadata) {
  const keys = Object.keys(metadata);
  return keys.length === 1 && keys[0] === "optional" && metadata.optional === true;
}

for (const lockfile of lockfiles) {
  const parsed = JSON.parse(await readFile(new URL(`../${lockfile}`, import.meta.url), "utf8"));
  for (const [location, metadata] of Object.entries(parsed.packages)) {
    if (location === "" || isOptionalPlaceholder(metadata)) continue;
    checkedPackages += 1;
    if (typeof metadata.license !== "string") {
      failures.push(`${lockfile}:${location}:missing-license`);
    } else if (!approvedLicenses.has(metadata.license)) {
      failures.push(`${lockfile}:${location}:unapproved:${metadata.license}`);
    }
    if (typeof metadata.version === "string") {
      if (typeof metadata.resolved !== "string" || !metadata.resolved.startsWith("https://registry.npmjs.org/")) {
        failures.push(`${lockfile}:${location}:unlocked-source`);
      }
      if (typeof metadata.integrity !== "string" || !metadata.integrity.startsWith("sha512-")) {
        failures.push(`${lockfile}:${location}:missing-sha512-integrity`);
      }
    }
  }
}

const requiredLicenseText = [
  ["../workers/trusted-runtime/vendor/mldsa-native/LICENSE", "Apache-2.0 license for mldsa-native content"],
  ["../frontend/public/fonts/LICENSE-Fraunces.txt", "SIL OPEN FONT LICENSE Version 1.1"],
  ["../frontend/public/fonts/LICENSE-Public-Sans.txt", "SIL OPEN FONT LICENSE Version 1.1"],
];
for (const [relativePath, requiredText] of requiredLicenseText) {
  const contents = await readFile(new URL(relativePath, import.meta.url), "utf8");
  if (!contents.includes(requiredText)) failures.push(`${relativePath}:license-text-mismatch`);
}

if (failures.length > 0) {
  process.stderr.write(`${JSON.stringify({ status: "failed", failures: failures.sort() })}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`${JSON.stringify({ status: "ok", packages: checkedPackages, vendored_assets: 3 })}\n`);
}

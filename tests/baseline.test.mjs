import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const forbiddenPackages = [
  "@sentry/cloudflare",
  "@sentry/nextjs",
  "@google-cloud/secret-manager",
  "express",
  "resend",
];

async function readPackage(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, root), "utf8"));
}

test("implementation dependencies are exact and exclude retired services", async () => {
  const manifests = await Promise.all([
    readPackage("package.json"),
    readPackage("frontend/package.json"),
  ]);

  for (const manifest of manifests) {
    const dependencies = {
      ...manifest.dependencies,
      ...manifest.devDependencies,
    };
    for (const dependency of forbiddenPackages) {
      assert.equal(dependencies[dependency], undefined);
    }
    for (const version of Object.values(dependencies)) {
      assert.doesNotMatch(version, /^[~^]/);
    }
  }
});

test("root quality gates cover both implementation packages", async () => {
  const manifest = await readPackage("package.json");

  for (const script of ["audit", "build", "lint", "test", "typecheck"]) {
    assert.equal(typeof manifest.scripts[script], "string");
  }
  assert.match(manifest.scripts.build, /frontend/);
  assert.match(manifest.scripts.test, /frontend/);
  assert.match(manifest.scripts.typecheck, /frontend/);
});

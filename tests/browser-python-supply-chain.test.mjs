import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const frontend = new URL("../frontend/", import.meta.url);
const maxPagesFileBytes = 25 * 1024 * 1024;

test("browser Python and PDF parser assets match the approved pinned manifest", async () => {
  const manifest = JSON.parse(await readFile(new URL("parser/asset-manifest.json", frontend), "utf8"));
  const packageJson = JSON.parse(await readFile(new URL("package.json", frontend), "utf8"));
  const attributes = await readFile(new URL(".gitattributes", root), "utf8");
  assert.equal(manifest.pyodide_version, "314.0.5");
  assert.equal(manifest.python_version, "3.14.2");
  assert.equal(packageJson.dependencies.pyodide, "314.0.5");
  assert.match(attributes, /^frontend\/public\/parser\/\*\* -text$/m);
  assert.match(attributes, /^frontend\/public\/pyodide\/\*\* -text$/m);
  for (const asset of [...manifest.core, ...manifest.packages, ...manifest.licenses]) {
    const bytes = await readFile(new URL(`public/pyodide/${asset.name}`, frontend));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256, asset.name);
    assert.ok(bytes.byteLength < maxPagesFileBytes, asset.name);
  }
  for (const source of manifest.sources) {
    const location = new URL(`public/pyodide/${source.name}`, frontend);
    const bytes = await readFile(location);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), source.sha256, source.name);
    assert.ok((await stat(location)).size < maxPagesFileBytes);
  }
});

test("the pinned Pyodide runtime executes pdfminer in a browser module Worker without external network access", () => {
  const result = spawnSync(process.execPath, ["scripts/verify-pdf-parser.mjs"], {
    cwd: root,
    encoding: "utf8",
    timeout: 60_000,
    maxBuffer: 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  const report = JSON.parse(result.stdout);
  assert.deepEqual({
    status: report.status,
    pyodide: report.pyodide,
    python: report.python,
    pdfminer: report.pdfminer,
    pages: report.pages,
    external_network_requests: report.external_network_requests,
  }, {
    status: "ok",
    pyodide: "314.0.5",
    python: "3.14.2",
    pdfminer: "20260107",
    pages: 1,
    external_network_requests: 0,
  });
  assert.ok(report.elapsed_ms > 0 && report.elapsed_ms <= 30_000);
});

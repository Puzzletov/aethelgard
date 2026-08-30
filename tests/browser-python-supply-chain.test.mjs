import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const frontend = new URL("../frontend/", import.meta.url);
const maxPagesFileBytes = 25 * 1024 * 1024;

test("browser Python parser assets match the approved pinned manifest", async () => {
  const manifest = JSON.parse(await readFile(new URL("parser/asset-manifest.json", frontend), "utf8"));
  const packageJson = JSON.parse(await readFile(new URL("package.json", frontend), "utf8"));
  const attributes = await readFile(new URL(".gitattributes", root), "utf8");
  assert.equal(manifest.pyodide_version, "314.0.5");
  assert.equal(manifest.python_version, "3.14.2");
  assert.equal(packageJson.dependencies.pyodide, "314.0.5");
  assert.equal(manifest.packages.some((asset) => /pillow|xlsxwriter/i.test(asset.name)), false);
  assert.equal((await readdir(new URL("public/pyodide/", frontend))).some((name) => /pillow|xlsxwriter/i.test(name)), false);
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
    empty_pdf_rejected: report.empty_pdf_rejected,
    external_network_requests: report.external_network_requests,
  }, {
    status: "ok",
    pyodide: "314.0.5",
    python: "3.14.2",
    pdfminer: "20260107",
    pages: 1,
    empty_pdf_rejected: true,
    external_network_requests: 0,
  });
  assert.ok(report.elapsed_ms > 0 && report.elapsed_ms <= 30_000);
});

test("the pinned Pyodide runtime executes python-docx with structural references in a browser module Worker", () => {
  const result = spawnSync(process.execPath, ["scripts/verify-docx-parser.mjs"], {
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
    python_docx: report.python_docx,
    lxml: report.lxml,
    sources: report.sources,
    external_network_requests: report.external_network_requests,
  }, {
    status: "ok",
    pyodide: "314.0.5",
    python: "3.14.2",
    python_docx: "1.2.0",
    lxml: "6.0.2",
    sources: 2,
    external_network_requests: 0,
  });
  assert.ok(report.elapsed_ms > 0 && report.elapsed_ms <= 30_000);
});

test("python-pptx extracts slide text without Pillow or XlsxWriter in a browser module Worker", () => {
  const result = spawnSync(process.execPath, ["scripts/verify-pptx-parser.mjs"], {
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
    python_pptx: report.python_pptx,
    slides: report.slides,
    pillow_omitted: report.pillow_omitted,
    xlsxwriter_omitted: report.xlsxwriter_omitted,
    package_data_pruned: report.package_data_pruned,
    external_network_requests: report.external_network_requests,
  }, {
    status: "ok",
    pyodide: "314.0.5",
    python_pptx: "1.0.2",
    slides: 1,
    pillow_omitted: true,
    xlsxwriter_omitted: true,
    package_data_pruned: true,
    external_network_requests: 0,
  });
  assert.ok(report.elapsed_ms > 0 && report.elapsed_ms <= 30_000);
});

test("openpyxl extracts cells without exposing sheet names in a browser module Worker", () => {
  const result = spawnSync(process.execPath, ["scripts/verify-xlsx-parser.mjs"], {
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
    openpyxl: report.openpyxl,
    et_xmlfile: report.et_xmlfile,
    sources: report.sources,
    sheet_names_exposed: report.sheet_names_exposed,
    external_network_requests: report.external_network_requests,
  }, {
    status: "ok",
    pyodide: "314.0.5",
    openpyxl: "3.1.5",
    et_xmlfile: "2.0.0",
    sources: 2,
    sheet_names_exposed: false,
    external_network_requests: 0,
  });
  assert.ok(report.elapsed_ms > 0 && report.elapsed_ms <= 30_000);
});

test("Python standard-library CSV and TXT parsers preserve structural references in a browser module Worker", () => {
  const result = spawnSync(process.execPath, ["scripts/verify-text-parsers.mjs"], {
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
    csv_sources: report.csv_sources,
    txt_sources: report.txt_sources,
    multiline_csv_row: report.multiline_csv_row,
    blank_txt_line_preserved: report.blank_txt_line_preserved,
    malformed_rejected: report.malformed_rejected,
    boundary_rejected: report.boundary_rejected,
    browsers: report.browsers,
    external_network_requests: report.external_network_requests,
  }, {
    status: "ok",
    pyodide: "314.0.5",
    csv_sources: 6,
    txt_sources: 2,
    multiline_csv_row: 2,
    blank_txt_line_preserved: true,
    malformed_rejected: true,
    boundary_rejected: true,
    browsers: ["edge", "chrome"],
    external_network_requests: 0,
  });
  assert.ok(report.elapsed_ms > 0 && report.elapsed_ms <= 30_000);
});

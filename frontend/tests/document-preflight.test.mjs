import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

import { buildZip } from "./zip-fixture.mjs";

async function compileModule(relativePath) {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
  return ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2021 },
  }).outputText;
}

async function loadPreflight() {
  const resultUrl = dataModule(await compileModule("../input/preflight/result.ts"));
  const bytesUrl = dataModule(await compileModule("../input/preflight/bytes.ts"));
  let zip = await compileModule("../input/preflight/zip.ts");
  zip = zip.replaceAll("./bytes", bytesUrl).replaceAll("./result", resultUrl);
  const zipUrl = dataModule(zip);
  let office = await compileModule("../input/preflight/office.ts");
  office = office.replaceAll("./result", resultUrl).replaceAll("./zip", zipUrl);
  const officeUrl = dataModule(office);
  let document = await compileModule("../input/preflight/document.ts");
  document = document.replaceAll("../document-input", dataInputModule());
  document = document.replaceAll("./bytes", bytesUrl).replaceAll("./office", officeUrl);
  document = document.replaceAll("./result", resultUrl);
  return import(dataModule(document));
}

function dataModule(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
}

function dataInputModule() {
  const source = "export const MAX_SOURCE_BYTES=15728640;";
  return `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
}

function arrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

const contentTypes = Object.freeze({
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml",
});
const mainParts = Object.freeze({ docx: "word/document.xml", pptx: "ppt/presentation.xml", xlsx: "xl/workbook.xml" });

function officeEntries(format, additions = []) {
  return [
    { name: "[Content_Types].xml", content: `<Types><Override ContentType="${contentTypes[format]}"/></Types>` },
    { name: "_rels/.rels", content: "<Relationships/>" },
    { name: mainParts[format], content: "<document><p>Safe text</p></document>" },
    ...additions,
  ];
}

const { prevalidateDocument } = await loadPreflight();

test("valid minimal PDF, Office, CSV, and TXT inputs pass prevalidation", async () => {
  const pdf = Buffer.from("%PDF-1.7\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF");
  assert.equal((await prevalidateDocument("pdf", arrayBuffer(pdf))).ok, true);
  for (const format of ["docx", "pptx", "xlsx"]) {
    const result = await prevalidateDocument(format, arrayBuffer(buildZip(officeEntries(format))));
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.archiveEntries, 3);
  }
  assert.equal((await prevalidateDocument("csv", arrayBuffer(Buffer.from("name,value\nA,1\n")))).ok, true);
  assert.equal((await prevalidateDocument("txt", arrayBuffer(Buffer.from("Plain UTF-8 text.")))).ok, true);
});

test("false magic, malformed archives, encryption, paths, and bombs fail closed", async () => {
  const validDocx = buildZip(officeEntries("docx"));
  assert.equal((await prevalidateDocument("pdf", arrayBuffer(validDocx))).ok, false);
  assert.equal((await prevalidateDocument("docx", arrayBuffer(Buffer.from("%PDF-1.7\n%%EOF")))).ok, false);
  assert.equal((await prevalidateDocument("docx", arrayBuffer(validDocx.subarray(0, validDocx.length - 10)))).ok, false);
  const encrypted = buildZip(officeEntries("docx", [{ name: "safe.xml", content: "<safe/>", flags: 1 }]));
  assert.equal((await prevalidateDocument("docx", arrayBuffer(encrypted))).code, "archive_encrypted");
  const traversal = buildZip(officeEntries("docx", [{ name: "../escape.xml", content: "<safe/>" }]));
  assert.equal((await prevalidateDocument("docx", arrayBuffer(traversal))).code, "archive_path");
  const bomb = buildZip(officeEntries("docx", [{ name: "large.xml", content: "x", uncompressedBytes: 20 * 1024 * 1024 }]));
  assert.equal((await prevalidateDocument("docx", arrayBuffer(bomb))).code, "archive_limit");
});

test("archive entry, total expansion, per-entry, and compression-ratio bounds are independent", async () => {
  const tooMany = Array.from({ length: 510 }, (_, index) => ({ name: `word/item-${index}.xml`, content: "<x/>" }));
  assert.equal(
    (await prevalidateDocument("docx", arrayBuffer(buildZip(officeEntries("docx", tooMany))))).code,
    "archive_limit",
  );
  const totalEntries = Array.from({ length: 5 }, (_, index) => ({
    name: `word/large-${index}.dat`,
    content: Buffer.alloc(160 * 1024),
    store: true,
    uncompressedBytes: 15 * 1024 * 1024,
  }));
  assert.equal(
    (await prevalidateDocument("docx", arrayBuffer(buildZip(officeEntries("docx", totalEntries))))).code,
    "archive_limit",
  );
  const ratio = { name: "word/ratio.dat", content: "a".repeat(1_000), uncompressedBytes: 2_000 };
  assert.equal(
    (await prevalidateDocument("docx", arrayBuffer(buildZip(officeEntries("docx", [ratio]))))).code,
    "archive_limit",
  );
});

test("XML entities, external relationships, macros, ActiveX, OLE, and embedded files are rejected", async () => {
  const cases = [
    ["xml_unsafe", { name: "word/unsafe.xml", content: "<!DOCTYPE x [<!ENTITY y 'z'>]><x/>" }],
    ["external_relationship", { name: "word/_rels/document.xml.rels", content: "<Relationship TargetMode='External'/>" }],
    ["active_content", { name: "word/vbaProject.bin", content: "macro", store: true }],
    ["active_content", { name: "word/activeX/control.xml", content: "<control/>" }],
    ["embedded_content", { name: "word/embeddings/object1.dat", content: "object" }],
    ["embedded_content", { name: "word/attachments/report.pdf", content: "%PDF-1.7", store: true }],
  ];
  for (const [code, entry] of cases) {
    const archive = buildZip(officeEntries("docx", [entry]));
    assert.equal((await prevalidateDocument("docx", arrayBuffer(archive))).code, code);
  }
});

test("encrypted or active PDFs and binary text inputs are rejected", async () => {
  const encrypted = Buffer.from("%PDF-1.7\ntrailer<</Encrypt 2 0 R>>\n%%EOF");
  const active = Buffer.from("%PDF-1.7\n<</JavaScript 2 0 R>>\n%%EOF");
  assert.equal((await prevalidateDocument("pdf", arrayBuffer(encrypted))).code, "pdf_encrypted");
  assert.equal((await prevalidateDocument("pdf", arrayBuffer(active))).code, "pdf_active_content");
  assert.equal((await prevalidateDocument("txt", arrayBuffer(Buffer.from([0xff, 0xfe, 0x00])))).ok, false);
});

test("hostile processing is isolated in one bounded disposable module Worker", async () => {
  const [runner, worker] = await Promise.all([
    readFile(new URL("../input/preflight/run-preflight.ts", import.meta.url), "utf8"),
    readFile(new URL("../workers/parser.worker.ts", import.meta.url), "utf8"),
  ]);
  assert.match(runner, /PREFLIGHT_TIMEOUT_MS = 10_000/);
  assert.match(runner, /new Worker\([\s\S]*type: "module"/);
  assert.match(runner, /worker\.terminate\(\)/);
  assert.match(runner, /postMessage\([\s\S]*\[buffer\]/);
  assert.match(worker, /prevalidateDocument/);
  assert.match(worker, /parseDocx/);
  assert.ok(worker.indexOf("await prevalidateDocument") < worker.lastIndexOf("await parseValidated"));
  assert.match(worker, /bytes\.fill\(0\)/);
  assert.doesNotMatch(`${runner}\n${worker}`, /fetch\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|caches\./);
});

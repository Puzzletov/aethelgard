import { buildZip } from "../../../frontend/tests/zip-fixture.mjs";

export const HOSTILE_CORPUS_VERSION = 1;
export const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

const contentTypes = Object.freeze({
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml",
});
const mainParts = Object.freeze({
  docx: "word/document.xml", pptx: "ppt/presentation.xml", xlsx: "xl/workbook.xml",
});
const roots = Object.freeze({ docx: "word", pptx: "ppt", xlsx: "xl" });

function officeEntries(format, additions = []) {
  return [
    { name: "[Content_Types].xml", content: `<Types><Override ContentType="${contentTypes[format]}"/></Types>` },
    { name: "_rels/.rels", content: "<Relationships/>" },
    { name: mainParts[format], content: "<document><p>synthetic</p></document>" },
    ...additions,
  ];
}

function office(format, additions = []) {
  return buildZip(officeEntries(format, additions));
}

function item(id, classes, filename, format, bytes, expectedCode) {
  return Object.freeze({ id, classes: Object.freeze(classes), filename, format, bytes, expectedCode });
}

function officeCases(label, classId, expectedCode, entry) {
  return ["docx", "pptx", "xlsx"].map((format) => item(
    `${label}-${format}`, [classId], `synthetic-${label}.${format}`, format,
    office(format, [entry(format)]), expectedCode,
  ));
}

function archiveLimitCases() {
  const tooMany = Array.from({ length: 510 }, (_, index) => ({
    name: `word/item-${index}.xml`, content: "<x/>",
  }));
  const total = Array.from({ length: 5 }, (_, index) => ({
    name: `word/total-${index}.dat`, content: Buffer.alloc(160 * 1024), store: true,
    uncompressedBytes: 15 * 1024 * 1024,
  }));
  return [
    item("archive-entry-count", [4], "synthetic-entry-count.docx", "docx", office("docx", tooMany), "archive_limit"),
    item("archive-total-expansion", [5], "synthetic-total.docx", "docx", office("docx", total), "archive_limit"),
    item("archive-entry-expansion", [6], "synthetic-entry.docx", "docx", office("docx", [
      { name: "word/large.dat", content: "x", uncompressedBytes: 16 * 1024 * 1024 + 1 },
    ]), "archive_limit"),
    item("archive-compression-ratio", [7], "synthetic-ratio.docx", "docx", office("docx", [
      { name: "word/ratio.dat", content: "a".repeat(1_000), uncompressedBytes: 2_000 },
    ]), "archive_limit"),
  ];
}

function malformedCases() {
  return ["docx", "pptx", "xlsx"].map((format) => {
    const valid = office(format);
    return item(`malformed-${format}`, [18], `synthetic-malformed.${format}`, format,
      valid.subarray(0, valid.length - 10), "archive_malformed");
  });
}

function falseMagicCases() {
  const text = Buffer.from("synthetic content without the declared magic");
  const pdf = Buffer.from("%PDF-1.7\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF");
  return [
    item("false-magic-pdf", [1, 20], "synthetic.pdf", "pdf", text, "magic_invalid"),
    ...["docx", "pptx", "xlsx"].map((format) => item(
      `false-magic-${format}`, [1, 20], `synthetic.${format}`, format, text, "magic_invalid",
    )),
    item("false-magic-csv", [1, 20], "synthetic.csv", "csv", pdf, "magic_invalid"),
    item("false-magic-txt", [1, 20], "synthetic.txt", "txt", pdf, "magic_invalid"),
  ];
}

export function hostileCorpusCases() {
  const pdf = Buffer.from("%PDF-1.7\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF");
  const oversized = Buffer.alloc(MAX_SOURCE_BYTES + 1);
  pdf.copy(oversized);
  return Object.freeze([
    item("unsupported-format", [2], "synthetic.exe", undefined, Buffer.from("MZ synthetic"), "unsupported_format"),
    item("source-size", [3], "synthetic-oversized.pdf", "pdf", oversized, "too_large"),
    ...archiveLimitCases(),
    ...officeCases("path-traversal", 8, "archive_path", () => ({ name: "../escape.xml", content: "<x/>" })),
    item("encrypted-pdf", [9], "synthetic-encrypted.pdf", "pdf",
      Buffer.from("%PDF-1.7\ntrailer<</Encrypt 2 0 R>>\n%%EOF"), "pdf_encrypted"),
    ...officeCases("encrypted", 10, "archive_encrypted", (format) => ({
      name: `${roots[format]}/encrypted.xml`, content: "<x/>", flags: 1,
    })),
    ...officeCases("doctype", 11, "xml_unsafe", (format) => ({
      name: `${roots[format]}/doctype.xml`, content: "<!DOCTYPE x><x/>",
    })),
    ...officeCases("entity", 12, "xml_unsafe", (format) => ({
      name: `${roots[format]}/entity.xml`, content: "<!ENTITY x 'synthetic'><x/>",
    })),
    ...officeCases("external-relationship", 13, "external_relationship", (format) => ({
      name: `${roots[format]}/_rels/item.xml.rels`, content: "<Relationship TargetMode='External'/>",
    })),
    ...officeCases("macro", 14, "active_content", (format) => ({
      name: `${roots[format]}/vbaProject.bin`, content: "synthetic macro marker", store: true,
    })),
    ...officeCases("activex", 15, "active_content", (format) => ({
      name: `${roots[format]}/activeX/control.xml`, content: "<control/>",
    })),
    ...officeCases("ole", 16, "embedded_content", (format) => ({
      name: `${roots[format]}/embeddings/oleObject1.dat`, content: "synthetic object", store: true,
    })),
    ...officeCases("embedded", 17, "embedded_content", (format) => ({
      name: `${roots[format]}/attachments/synthetic.pdf`, content: "%PDF-1.7", store: true,
    })),
    item("embedded-pdf", [17], "synthetic-embedded.pdf", "pdf",
      Buffer.from("%PDF-1.7\n<</EmbeddedFile 2 0 R>>\n%%EOF"), "pdf_active_content"),
    ...malformedCases(),
    item("malformed-pdf", [18], "synthetic-malformed.pdf", "pdf", Buffer.from("%PDF-1.7\nno eof"), "magic_invalid"),
    item("false-extension-office", [19], "synthetic-false.docx", "docx", pdf, "magic_invalid"),
    item("false-extension-pdf", [19], "synthetic-false.pdf", "pdf", office("docx"), "magic_invalid"),
    ...falseMagicCases(),
  ]);
}

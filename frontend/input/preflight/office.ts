import type { DocumentFormat } from "../document-input";
import { PreflightFailure } from "./result";
import { inflateZipEntry, parseZip } from "./zip";

const MAX_XML_ENTRY_BYTES = 8 * 1024 * 1024;
const REQUIRED_PART = Object.freeze<Record<"docx" | "pptx" | "xlsx", string>>({
  docx: "word/document.xml",
  pptx: "ppt/presentation.xml",
  xlsx: "xl/workbook.xml",
});
const REQUIRED_CONTENT_TYPE = Object.freeze<Record<"docx" | "pptx" | "xlsx", string>>({
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml",
});

type OfficeFormat = Extract<DocumentFormat, "docx" | "pptx" | "xlsx">;

function inspectPartName(name: string): void {
  const lower = name.toLowerCase();
  if (lower.includes("vbaproject") || lower.includes("vbadata") || lower.includes("macrosheet")) {
    throw new PreflightFailure("active_content");
  }
  if (lower.includes("/activex/") || lower.startsWith("activex/")) {
    throw new PreflightFailure("active_content");
  }
  if (lower.includes("/embeddings/") || lower.includes("oleobject") || lower.includes("objectpool")) {
    throw new PreflightFailure("embedded_content");
  }
  if (/\.(?:bin|zip|docx|pptx|xlsx|pdf)$/i.test(lower)) {
    throw new PreflightFailure("embedded_content");
  }
}

function shouldInspectXml(name: string, size: number): boolean {
  const lower = name.toLowerCase();
  const inspect = lower.endsWith(".xml") || lower.endsWith(".rels");
  if (inspect && size > MAX_XML_ENTRY_BYTES) throw new PreflightFailure("archive_limit");
  return inspect;
}

function inspectXml(name: string, bytes: Uint8Array): string {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new PreflightFailure("archive_malformed");
  }
  const lower = text.toLowerCase();
  if (lower.includes("<!doctype") || lower.includes("<!entity")) {
    throw new PreflightFailure("xml_unsafe");
  }
  if (name.toLowerCase().endsWith(".rels") && /targetmode\s*=\s*["']external["']/i.test(text)) {
    throw new PreflightFailure("external_relationship");
  }
  if (lower.includes("vnd.ms-office.vbaproject") || lower.includes("macroenabled")) {
    throw new PreflightFailure("active_content");
  }
  if (lower.includes("relationships/oleobject") || lower.includes("relationships/package")) {
    throw new PreflightFailure("embedded_content");
  }
  return text;
}

function requirePackageParts(format: OfficeFormat, names: ReadonlySet<string>): void {
  for (const required of ["[content_types].xml", "_rels/.rels", REQUIRED_PART[format]]) {
    if (!names.has(required)) throw new PreflightFailure("magic_invalid");
  }
}

export async function prevalidateOffice(format: OfficeFormat, bytes: Uint8Array): Promise<number> {
  const entries = parseZip(bytes);
  const names = new Set(entries.map((entry) => entry.name.toLowerCase()));
  requirePackageParts(format, names);
  let contentTypes: string | undefined;
  for (const entry of entries) {
    inspectPartName(entry.name);
    const capture = shouldInspectXml(entry.name, entry.uncompressedBytes);
    const inflated = await inflateZipEntry(bytes, entry, capture);
    if (capture && inflated !== undefined) {
      const text = inspectXml(entry.name, inflated);
      if (entry.name.toLowerCase() === "[content_types].xml") contentTypes = text;
      inflated.fill(0);
    }
  }
  if (contentTypes?.toLowerCase().includes(REQUIRED_CONTENT_TYPE[format]) !== true) {
    throw new PreflightFailure("magic_invalid");
  }
  return entries.length;
}

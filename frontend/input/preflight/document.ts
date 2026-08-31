import { MAX_SOURCE_BYTES, type DocumentFormat } from "../document-input";
import { containsAscii, startsWithAscii } from "./bytes";
import { prevalidateOffice } from "./office";
import { PreflightFailure, rejectedPreflight, type PreflightResult } from "./result";

const PDF_ACTIVE_MARKERS = Object.freeze([
  "/EmbeddedFile",
  "/FileAttachment",
  "/JS",
  "/JavaScript",
  "/Launch",
  "/RichMedia",
  "/XFA",
]);

function hasZipMagic(bytes: Uint8Array): boolean {
  return bytes.byteLength >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && (
    bytes[2] === 0x03 && bytes[3] === 0x04 || bytes[2] === 0x05 && bytes[3] === 0x06
  );
}

function prevalidatePdf(bytes: Uint8Array): void {
  if (!startsWithAscii(bytes, "%PDF-") || bytes.byteLength < 8) {
    throw new PreflightFailure("magic_invalid");
  }
  const major = bytes[5];
  if ((major !== 0x31 && major !== 0x32) || bytes[6] !== 0x2e || bytes[7] < 0x30 || bytes[7] > 0x39) {
    throw new PreflightFailure("magic_invalid");
  }
  const tailStart = Math.max(0, bytes.byteLength - 1_024);
  if (!containsAscii(bytes, "%%EOF", tailStart)) throw new PreflightFailure("magic_invalid");
  if (containsAscii(bytes, "/Encrypt")) throw new PreflightFailure("pdf_encrypted");
  if (PDF_ACTIVE_MARKERS.some((marker) => containsAscii(bytes, marker))) {
    throw new PreflightFailure("pdf_active_content");
  }
}

function prevalidateText(bytes: Uint8Array): void {
  if (hasZipMagic(bytes) || startsWithAscii(bytes, "%PDF-") || bytes.includes(0)) {
    throw new PreflightFailure("magic_invalid");
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new PreflightFailure("text_invalid");
  }
  let controls = 0;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) controls += 1;
  }
  if (controls > 0) throw new PreflightFailure("text_invalid");
}

function boundedBytes(buffer: ArrayBuffer): Uint8Array {
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_SOURCE_BYTES) {
    throw new PreflightFailure("size_invalid");
  }
  return new Uint8Array(buffer);
}

export async function prevalidateDocument(format: DocumentFormat, buffer: ArrayBuffer): Promise<PreflightResult> {
  try {
    const bytes = boundedBytes(buffer);
    if (format === "pdf") prevalidatePdf(bytes);
    else if (format === "docx" || format === "pptx" || format === "xlsx") {
      if (!hasZipMagic(bytes)) throw new PreflightFailure("magic_invalid");
      const archiveEntries = await prevalidateOffice(format, bytes);
      return Object.freeze({ ok: true, byteLength: bytes.byteLength, archiveEntries });
    } else prevalidateText(bytes);
    return Object.freeze({ ok: true, byteLength: bytes.byteLength, archiveEntries: 0 });
  } catch (error) {
    if (error instanceof PreflightFailure) return rejectedPreflight(error);
    return rejectedPreflight(new PreflightFailure("archive_malformed"));
  }
}

export const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
export const MAX_LOCAL_FILENAME_CODE_UNITS = 512;
export const DOCUMENT_ACCEPT = ".pdf,.docx,.pptx,.xlsx,.csv,.txt";

export const SUPPORTED_DOCUMENT_FORMATS = Object.freeze([
  "pdf",
  "docx",
  "pptx",
  "xlsx",
  "csv",
  "txt",
] as const);

export type DocumentFormat = (typeof SUPPORTED_DOCUMENT_FORMATS)[number];

export interface SelectedDocument {
  readonly file: File;
  readonly format: DocumentFormat;
  readonly byteLength: number;
}

export type BrowserInputResult =
  | Readonly<{ ok: true; document: SelectedDocument }>
  | Readonly<{
      ok: false;
      code: "selection_count" | "empty" | "too_large" | "invalid_name" | "unsupported_format";
      message: string;
    }>;

const FORMAT_BY_EXTENSION = Object.freeze<Record<string, DocumentFormat>>({
  pdf: "pdf",
  docx: "docx",
  pptx: "pptx",
  xlsx: "xlsx",
  csv: "csv",
  txt: "txt",
});

function reject(code: Extract<BrowserInputResult, { ok: false }>["code"], message: string) {
  return Object.freeze({ ok: false, code, message }) satisfies BrowserInputResult;
}

function localFormat(name: string): DocumentFormat | undefined {
  if (name.length === 0 || name.length > MAX_LOCAL_FILENAME_CODE_UNITS) return undefined;
  const separator = name.lastIndexOf(".");
  if (separator < 1 || separator === name.length - 1) return undefined;
  return FORMAT_BY_EXTENSION[name.slice(separator + 1).toLowerCase()];
}

export function selectBrowserDocument(files: FileList | readonly File[]): BrowserInputResult {
  if (files.length !== 1) {
    return reject("selection_count", "Select one document.");
  }
  const file = files[0];
  if (file === undefined || !Number.isSafeInteger(file.size) || file.size < 0) {
    return reject("empty", "The document size is invalid.");
  }
  if (file.size === 0) return reject("empty", "The document is empty.");
  if (file.size > MAX_SOURCE_BYTES) {
    return reject("too_large", "The document is larger than the 15 MiB limit.");
  }
  if (file.name.length === 0 || file.name.length > MAX_LOCAL_FILENAME_CODE_UNITS) {
    return reject("invalid_name", "The local document name is invalid.");
  }
  const format = localFormat(file.name);
  if (format === undefined) {
    return reject("unsupported_format", "Use PDF, DOCX, PPTX, XLSX, CSV, or TXT.");
  }
  return Object.freeze({
    ok: true,
    document: Object.freeze({ file, format, byteLength: file.size }),
  });
}

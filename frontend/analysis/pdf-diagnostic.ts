export type PdfDiagnosticStage = "PREFLIGHT" | "EXTRACTION" | "NORMALIZATION"
  | "LANGUAGE" | "REDACTION" | "OUTBOUND_PREPARATION";

export interface PdfPreparationDiagnostic {
  readonly stage: PdfDiagnosticStage;
  readonly reason_code: string;
  readonly file_type: "PDF";
  readonly file_size_bytes: number;
  readonly pdf_page_count: number | "unavailable";
  readonly pdf_nonempty_pages: number | "unavailable";
  readonly extracted_char_count: number;
  readonly extracted_word_count: number;
  readonly source_record_count: number;
  readonly language_top_rank: string;
  readonly language_gate: "PASS" | "FAIL";
  readonly pii_detected_count: number;
  readonly redaction_status: "PASS" | "FAIL" | "NOT_REACHED";
  readonly outbound_ready: "YES" | "NO";
}

export function pdfDiagnostic(
  fileSize: number, stage: PdfDiagnosticStage, reasonCode: string,
  observed: Partial<Omit<PdfPreparationDiagnostic,
  "stage" | "reason_code" | "file_type" | "file_size_bytes">> = {},
): PdfPreparationDiagnostic {
  return Object.freeze({
    stage, reason_code: reasonCode, file_type: "PDF", file_size_bytes: fileSize,
    pdf_page_count: "unavailable", pdf_nonempty_pages: "unavailable",
    extracted_char_count: 0, extracted_word_count: 0, source_record_count: 0,
    language_top_rank: "und", language_gate: "FAIL", pii_detected_count: 0,
    redaction_status: "NOT_REACHED", outbound_ready: "NO", ...observed,
  });
}

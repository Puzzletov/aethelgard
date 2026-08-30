import type { NormalizedSourceRecord } from "../normalization/source-record";

export const MAX_EXTRACTED_WORDS = 8_000;
const WORD_RUN = /[\p{L}\p{N}]+/gu;

export interface WordBoundDocument {
  readonly schema_version: "1";
  readonly ok: true;
  readonly records: readonly NormalizedSourceRecord[];
  readonly word_count: number;
}

export interface WordLimitSafeMode {
  readonly schema_version: "1";
  readonly ok: false;
  readonly category: "document";
  readonly code: "word_limit_exceeded";
  readonly message: "The document contains more than 8,000 words.";
  readonly retry: "fresh_document";
}

export type WordLimitResult = WordBoundDocument | WordLimitSafeMode;

const WORD_LIMIT_SAFE_MODE: WordLimitSafeMode = Object.freeze({
  schema_version: "1",
  ok: false,
  category: "document",
  code: "word_limit_exceeded",
  message: "The document contains more than 8,000 words.",
  retry: "fresh_document",
});

function countRuns(content: string, remaining: number): number {
  let count = 0;
  WORD_RUN.lastIndex = 0;
  while (WORD_RUN.exec(content) !== null) {
    count += 1;
    if (count > remaining) return count;
  }
  return count;
}

export function enforceWordLimit(records: readonly NormalizedSourceRecord[]): WordLimitResult {
  let wordCount = 0;
  for (const record of records) {
    wordCount += countRuns(record.content, MAX_EXTRACTED_WORDS - wordCount);
    if (wordCount > MAX_EXTRACTED_WORDS) return WORD_LIMIT_SAFE_MODE;
  }
  return Object.freeze({
    schema_version: "1",
    ok: true,
    records,
    word_count: wordCount,
  });
}

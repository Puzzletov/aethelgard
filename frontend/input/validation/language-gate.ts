import { francAll } from "franc-min";

import type { NormalizedSourceRecord } from "../normalization/source-record";

export const MIN_LANGUAGE_LETTERS = 40;
export const MIN_LANGUAGE_TOKENS = 8;
export const MAX_LANGUAGE_SAMPLE_CODE_POINTS = 20_000;

type LanguageRanking = readonly (readonly [string, number])[];
type LanguageDetector = (sample: string) => LanguageRanking;

export interface LanguageInspection {
  readonly decision: LanguageDecision;
  readonly top_rank: string;
}

export type LanguageDecision =
  | Readonly<{
    schema_version: "1";
    accepted: true;
    language: "eng";
    letters: number;
    tokens: number;
  }>
  | Readonly<{
    schema_version: "1";
    accepted: false;
    reason: "insufficient" | "non_english" | "mixed_or_uncertain";
  }>;

function leadingSample(records: readonly NormalizedSourceRecord[]): string {
  const normalized = records.map((record) => record.content).join(" ")
    .replace(/\s+/gu, " ").trim();
  let sample = "";
  let count = 0;
  for (const codePoint of normalized) {
    if (count === MAX_LANGUAGE_SAMPLE_CODE_POINTS) break;
    sample += codePoint;
    count += 1;
  }
  return sample;
}

function evidence(sample: string): readonly [number, number] {
  let letters = 0;
  for (const codePoint of sample) if (/\p{L}/u.test(codePoint)) letters += 1;
  const tokens = sample === "" ? 0 : sample.split(" ").filter((token) => /\p{L}/u.test(token)).length;
  return [letters, tokens];
}

function rejected(reason: "insufficient" | "non_english" | "mixed_or_uncertain"): LanguageDecision {
  return Object.freeze({ schema_version: "1", accepted: false, reason });
}

function validTuple(value: readonly [string, number] | undefined): value is readonly [string, number] {
  return value !== undefined && /^[a-z]{3}$/.test(value[0]) && Number.isFinite(value[1])
    && value[1] >= 0 && value[1] <= 1;
}

export function inspectEnglishLanguage(
  records: readonly NormalizedSourceRecord[], detect: LanguageDetector = francAll,
): LanguageInspection {
  const sample = leadingSample(records);
  const [letters, tokens] = evidence(sample);
  if (letters < MIN_LANGUAGE_LETTERS || tokens < MIN_LANGUAGE_TOKENS) {
    return Object.freeze({ decision: rejected("insufficient"), top_rank: "und" });
  }
  let top: readonly [string, number] | undefined;
  try { top = detect(sample)[0]; } catch {
    return Object.freeze({ decision: rejected("mixed_or_uncertain"), top_rank: "und" });
  }
  if (!validTuple(top)) return Object.freeze({ decision: rejected("mixed_or_uncertain"), top_rank: "und" });
  const decision = top[0] === "und" ? rejected("insufficient")
    : top[0] !== "eng" ? rejected("non_english")
      : Object.freeze({ schema_version: "1", accepted: true, language: "eng", letters, tokens } as const);
  return Object.freeze({ decision, top_rank: top[0] });
}

export function evaluateEnglishLanguage(
  records: readonly NormalizedSourceRecord[], detect: LanguageDetector = francAll,
): LanguageDecision {
  return inspectEnglishLanguage(records, detect).decision;
}

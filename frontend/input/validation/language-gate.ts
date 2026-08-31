import { francAll } from "franc-min";

import type { NormalizedSourceRecord } from "../normalization/source-record";

export const MIN_LANGUAGE_LETTERS = 40;
export const MIN_LANGUAGE_TOKENS = 8;
export const MIN_ENGLISH_MARGIN_BASIS_POINTS = 2_000;
export const MAX_LANGUAGE_SAMPLE_CODE_POINTS = 20_000;

export type LanguageDecision =
  | Readonly<{
    schema_version: "1";
    accepted: true;
    language: "eng";
    letters: number;
    tokens: number;
    margin: number;
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
  return value !== undefined && typeof value[0] === "string" && Number.isFinite(value[1])
    && value[1] >= 0 && value[1] <= 1;
}

function rejectedRanking(ranking: readonly (readonly [string, number])[]): LanguageDecision {
  const top = ranking[0];
  if (!validTuple(top)) return rejected("mixed_or_uncertain");
  const english = ranking.find((tuple) => tuple[0] === "eng");
  if (!validTuple(english)) return rejected("non_english");
  const lead = Math.round((top[1] - english[1]) * 10_000);
  return rejected(lead < MIN_ENGLISH_MARGIN_BASIS_POINTS ? "mixed_or_uncertain" : "non_english");
}

export function evaluateEnglishLanguage(records: readonly NormalizedSourceRecord[]): LanguageDecision {
  const sample = leadingSample(records);
  const [letters, tokens] = evidence(sample);
  if (letters < MIN_LANGUAGE_LETTERS || tokens < MIN_LANGUAGE_TOKENS) return rejected("insufficient");
  const ranking = francAll(sample);
  if (ranking[0]?.[0] !== "eng") return rejectedRanking(ranking);
  const english = ranking[0];
  const runnerUp = ranking[1];
  if (!validTuple(english) || !validTuple(runnerUp)) return rejected("mixed_or_uncertain");
  const margin = Math.round((english[1] - runnerUp[1]) * 10_000);
  if (margin < MIN_ENGLISH_MARGIN_BASIS_POINTS) return rejected("mixed_or_uncertain");
  return Object.freeze({ schema_version: "1", accepted: true, language: "eng", letters, tokens, margin });
}

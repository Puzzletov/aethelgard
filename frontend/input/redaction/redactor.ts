import nlp from "compromise";

import {
  isSourceReference,
  MAX_NORMALIZED_DOCUMENT_CODE_POINTS,
  MAX_NORMALIZED_SOURCE_CODE_POINTS,
  MAX_NORMALIZED_SOURCES,
  type NormalizedSourceRecord,
} from "../normalization/source-record";

export const MAX_PII_MAPPINGS = 10_000;
export const MAX_PLACEHOLDER_ASCII_CHARS = 64;

type PiiType = "EMAIL" | "PHONE" | "CUSTOMER_ID" | "PAYMENT_CARD" | "ADDRESS"
  | "PERSON" | "ORGANIZATION" | "LOCATION";

interface Candidate {
  readonly start: number;
  readonly end: number;
  readonly type: PiiType;
  readonly priority: 1 | 2 | 3;
}

interface MappingState {
  readonly values: Map<string, string>;
  readonly counters: Map<PiiType, number>;
}

export interface RedactionRequest {
  readonly schema_version: "1";
  readonly sources: readonly NormalizedSourceRecord[];
}

export interface RedactionResult {
  readonly schema_version: "1";
  readonly sources: readonly NormalizedSourceRecord[];
  readonly placeholder_count: number;
  readonly must_redact_leaks: 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactFields(value: Record<string, unknown>, fields: readonly string[]): boolean {
  return Object.keys(value).sort().join("\0") === [...fields].sort().join("\0");
}

function boundedContent(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  let count = 0;
  for (const _codePoint of value) {
    count += 1;
    if (count > MAX_NORMALIZED_SOURCE_CODE_POINTS) return false;
  }
  return true;
}

export function validateRedactionRequest(value: unknown): RedactionRequest | undefined {
  if (!isRecord(value) || !exactFields(value, ["schema_version", "sources"])
    || value.schema_version !== "1" || !Array.isArray(value.sources)
    || value.sources.length === 0 || value.sources.length > MAX_NORMALIZED_SOURCES) return undefined;
  const sources: NormalizedSourceRecord[] = [];
  let total = 0;
  for (let index = 0; index < value.sources.length; index += 1) {
    const source = value.sources[index];
    if (!isRecord(source) || !exactFields(source, ["schema_version", "ordinal", "reference", "content"])
      || source.schema_version !== "1" || source.ordinal !== index + 1
      || !isSourceReference(source.reference) || !boundedContent(source.content)) return undefined;
    total += [...source.content].length;
    if (total > MAX_NORMALIZED_DOCUMENT_CODE_POINTS) return undefined;
    sources.push(Object.freeze({ schema_version: "1", ordinal: index + 1,
      reference: Object.freeze({ ...source.reference }), content: source.content }));
  }
  return Object.freeze({ schema_version: "1", sources: Object.freeze(sources) });
}

function addMatches(target: Candidate[], content: string, pattern: RegExp, type: PiiType): void {
  for (const match of content.matchAll(pattern)) {
    if (match.index === undefined || match[0].length === 0) continue;
    target.push({ start: match.index, end: match.index + match[0].length, type, priority: 1 });
  }
}

function luhn(value: string): boolean {
  const digits = value.replace(/[^0-9]/gu, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (double && (digit *= 2) > 9) digit -= 9;
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

function structuredCandidates(content: string): Candidate[] {
  const candidates: Candidate[] = [];
  addMatches(candidates, content, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,63}\b/giu, "EMAIL");
  addMatches(candidates, content, /\bCUST-[0-9]{6}\b/gu, "CUSTOMER_ID");
  addMatches(candidates, content, /\+[0-9][0-9 ()-]{6,28}[0-9]/gu, "PHONE");
  for (const match of content.matchAll(/(?<![0-9])(?:[0-9][ -]?){13,19}(?![0-9])/gu)) {
    if (match.index !== undefined && luhn(match[0])) {
      candidates.push({ start: match.index, end: match.index + match[0].length,
        type: "PAYMENT_CARD", priority: 1 });
    }
  }
  if (candidates.length > MAX_PII_MAPPINGS) throw new Error("mapping_limit");
  return candidates;
}

function captured(target: Candidate[], match: RegExpMatchArray, group: number, type: PiiType): void {
  if (match.index === undefined || match[group] === undefined) return;
  const offset = match[0].indexOf(match[group]);
  if (offset < 0) return;
  target.push({ start: match.index + offset, end: match.index + offset + match[group].length,
    type, priority: 2 });
}

function contextCandidates(content: string): Candidate[] {
  const candidates: Candidate[] = [];
  const types: Readonly<Record<string, PiiType>> = Object.freeze({
    person: "PERSON", organisation: "ORGANIZATION", organization: "ORGANIZATION",
    location: "LOCATION", address: "ADDRESS",
  });
  for (const match of content.matchAll(/^(Person|Organisation|Organization|Location|Address)\s*\|\s*([^\r\n]{1,120})$/gimu)) {
    captured(candidates, match, 2, types[match[1].toLowerCase()]);
  }
  for (const match of content.matchAll(/\bAddress\s*:\s*([^\.\r\n]{3,120})/giu)) {
    captured(candidates, match, 1, "ADDRESS");
  }
  for (const match of content.matchAll(/(^|[.!?]\s+)([\p{L}][\p{L}'’-]*(?:\s+[\p{L}][\p{L}'’-]*){1,3})\s+works at\s+/gmu)) {
    captured(candidates, match, 2, "PERSON");
  }
  for (const match of content.matchAll(/\bworks at\s+(.{2,100}?)\s+in\s+(.{2,80}?)(?=[.!?\r\n]|$)/giu)) {
    captured(candidates, match, 1, "ORGANIZATION");
    captured(candidates, match, 2, "LOCATION");
  }
  return candidates;
}

function offsetCandidates(content: string, output: unknown, type: PiiType): Candidate[] {
  if (!Array.isArray(output)) return [];
  const candidates: Candidate[] = [];
  for (const value of output) {
    if (!isRecord(value) || !isRecord(value.offset)) continue;
    const start = value.offset.start;
    const length = value.offset.length;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(length) || Number(length) <= 0) continue;
    let end = Number(start) + Number(length);
    while (end > Number(start) && /[\s.,;:!?]/u.test(content[end - 1])) end -= 1;
    if (end > Number(start)) candidates.push({ start: Number(start), end, type, priority: 3 });
  }
  return candidates;
}

function nerCandidates(content: string): Candidate[] {
  const document = nlp(content);
  return [
    ...offsetCandidates(content, document.people().out("offset"), "PERSON"),
    ...offsetCandidates(content, document.organizations().out("offset"), "ORGANIZATION"),
    ...offsetCandidates(content, document.places().out("offset"), "LOCATION"),
  ];
}

function overlaps(candidate: Candidate, selected: readonly Candidate[]): boolean {
  return selected.some((value) => candidate.start < value.end && value.start < candidate.end);
}

function selectedCandidates(content: string): Candidate[] {
  const candidates = [...structuredCandidates(content), ...contextCandidates(content), ...nerCandidates(content)];
  candidates.sort((left, right) => left.priority - right.priority || left.start - right.start
    || (right.end - right.start) - (left.end - left.start));
  const selected: Candidate[] = [];
  for (const candidate of candidates) if (!overlaps(candidate, selected)) selected.push(candidate);
  return selected.sort((left, right) => left.start - right.start);
}

function placeholder(state: MappingState, type: PiiType, value: string): string {
  const key = `${type}\0${value}`;
  const existing = state.values.get(key);
  if (existing !== undefined) return existing;
  if (state.values.size >= MAX_PII_MAPPINGS) throw new Error("mapping_limit");
  const sequence = (state.counters.get(type) ?? 0) + 1;
  const result = `[${type}_${sequence}]`;
  if (result.length > MAX_PLACEHOLDER_ASCII_CHARS || !/^[\x20-\x7E]+$/u.test(result)) throw new Error("placeholder_limit");
  state.counters.set(type, sequence);
  state.values.set(key, result);
  return result;
}

function redactContent(content: string, state: MappingState): string {
  const selected = selectedCandidates(content);
  let redacted = "";
  let cursor = 0;
  for (const candidate of selected) {
    redacted += content.slice(cursor, candidate.start);
    redacted += placeholder(state, candidate.type, content.slice(candidate.start, candidate.end));
    cursor = candidate.end;
  }
  return redacted + content.slice(cursor);
}

function leaked(sources: readonly NormalizedSourceRecord[], state: MappingState): boolean {
  for (const key of state.values.keys()) {
    const value = key.slice(key.indexOf("\0") + 1);
    if (sources.some((source) => source.content.includes(value))) return true;
  }
  return false;
}

export function redactRequest(value: unknown): RedactionResult {
  const request = validateRedactionRequest(value);
  if (request === undefined) throw new Error("invalid_redaction_request");
  const state: MappingState = { values: new Map(), counters: new Map() };
  try {
    const sources = request.sources.map((source) => Object.freeze({ ...source,
      content: redactContent(source.content, state) }));
    const checked = validateRedactionRequest({ schema_version: "1", sources });
    if (checked === undefined) throw new Error("redacted_output_limit");
    if (leaked(checked.sources, state)) throw new Error("must_redact_leak");
    return Object.freeze({ schema_version: "1", sources: checked.sources,
      placeholder_count: state.values.size, must_redact_leaks: 0 });
  } finally {
    state.values.clear();
    state.counters.clear();
  }
}

export interface ProtectionOccurrence {
  readonly start: number;
  readonly end: number;
  readonly type: string;
  readonly placeholder: string;
}

export interface ProtectionApplication {
  readonly content: string;
  readonly planned_replacements: number;
  readonly completed_replacements: number;
}

function validOccurrence(content: string, value: ProtectionOccurrence): boolean {
  return Number.isSafeInteger(value.start) && Number.isSafeInteger(value.end)
    && value.start >= 0 && value.end > value.start && value.end <= content.length
    && /^[A-Z_]+$/u.test(value.type) && /^\[[A-Z_]+_[1-9][0-9]*\]$/u.test(value.placeholder);
}

export function normalizeProtectionPlan(
  content: string, occurrences: readonly ProtectionOccurrence[],
): readonly ProtectionOccurrence[] {
  const ordered = [...occurrences].sort((left, right) => left.start - right.start
    || right.end - left.end || left.placeholder.localeCompare(right.placeholder));
  const normalized: ProtectionOccurrence[] = [];
  for (const occurrence of ordered) {
    if (!validOccurrence(content, occurrence)) throw new Error("protection_span_invalid");
    const previous = normalized.at(-1);
    if (previous === undefined || occurrence.start >= previous.end) { normalized.push(occurrence); continue; }
    if (occurrence.start === previous.start && occurrence.end === previous.end
      && occurrence.placeholder === previous.placeholder) continue;
    if (occurrence.end <= previous.end) continue;
    throw new Error("protection_span_overlap");
  }
  return Object.freeze(normalized);
}

export function applyProtectionPlan(
  content: string, occurrences: readonly ProtectionOccurrence[],
): ProtectionApplication {
  const plan = normalizeProtectionPlan(content, occurrences);
  let transformed = "";
  let cursor = 0;
  for (const occurrence of plan) {
    transformed += content.slice(cursor, occurrence.start) + occurrence.placeholder;
    cursor = occurrence.end;
  }
  transformed += content.slice(cursor);
  return Object.freeze({ content: transformed, planned_replacements: plan.length,
    completed_replacements: plan.length });
}

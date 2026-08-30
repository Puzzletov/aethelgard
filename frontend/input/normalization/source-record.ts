export const MAX_NORMALIZED_SOURCES = 100_000;
export const MAX_NORMALIZED_SOURCE_CODE_POINTS = 100_000;
export const MAX_NORMALIZED_DOCUMENT_CODE_POINTS = 2_000_000;
export const MAX_SOURCE_REFERENCE_BYTES = 128;
const UTF8_ENCODER = new TextEncoder();

export type SourceReference =
  | Readonly<{ kind: "pdf_page"; page: number }>
  | Readonly<{ kind: "docx_paragraph"; paragraph: number }>
  | Readonly<{ kind: "docx_table_cell"; table: number; row: number; column: number }>
  | Readonly<{ kind: "pptx_slide"; slide: number }>
  | Readonly<{ kind: "xlsx_cell"; sheet: number; cell: string }>
  | Readonly<{ kind: "csv_field"; row: number; column: number }>
  | Readonly<{ kind: "txt_lines"; line_start: number; line_end: number }>;

export interface NormalizedSourceRecord {
  readonly schema_version: "1";
  readonly ordinal: number;
  readonly reference: SourceReference;
  readonly content: string;
}

interface NormalizationState {
  readonly records: NormalizedSourceRecord[];
  readonly references: Set<string>;
  totalCodePoints: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactFields(value: Record<string, unknown>, fields: readonly string[]): boolean {
  return Object.keys(value).sort().join("\0") === [...fields].sort().join("\0");
}

function positive(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

function boundedCodePoints(value: string): number | undefined {
  if (value.length === 0) return undefined;
  let count = 0;
  for (const _character of value) {
    count += 1;
    if (count > MAX_NORMALIZED_SOURCE_CODE_POINTS) return undefined;
  }
  return count;
}

function append(state: NormalizationState, reference: SourceReference, content: unknown): boolean {
  if (typeof content !== "string") return false;
  const codePoints = boundedCodePoints(content);
  const key = JSON.stringify(reference);
  if (codePoints === undefined || UTF8_ENCODER.encode(key).byteLength > MAX_SOURCE_REFERENCE_BYTES) return false;
  if (state.references.has(key) || state.totalCodePoints + codePoints > MAX_NORMALIZED_DOCUMENT_CODE_POINTS) return false;
  state.references.add(key);
  state.totalCodePoints += codePoints;
  state.records.push(Object.freeze({
    schema_version: "1", ordinal: state.records.length + 1,
    reference: Object.freeze(reference), content,
  }));
  return true;
}

function normalizePdf(values: readonly unknown[], state: NormalizationState): boolean {
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!isRecord(value) || !exactFields(value, ["page", "content"]) || value.page !== index + 1) return false;
    if (!append(state, { kind: "pdf_page", page: index + 1 }, value.content)) return false;
  }
  return true;
}

function normalizeDocx(values: readonly unknown[], state: NormalizationState): boolean {
  let paragraph = 0;
  let tableCell: readonly [number, number, number] = [0, 0, 0];
  for (const value of values) {
    if (!isRecord(value) || typeof value.kind !== "string") return false;
    if (value.kind === "paragraph" && exactFields(value, ["kind", "paragraph", "content"])
      && positive(value.paragraph) && value.paragraph > paragraph) {
      if (!append(state, { kind: "docx_paragraph", paragraph: value.paragraph }, value.content)) return false;
      paragraph = value.paragraph;
    } else if (value.kind === "table_cell" && exactFields(value, ["kind", "table", "row", "column", "content"])
      && positive(value.table) && positive(value.row) && positive(value.column)) {
      const current: readonly [number, number, number] = [value.table, value.row, value.column];
      if (!tupleAfter(current, tableCell)) return false;
      if (!append(state, { kind: "docx_table_cell", table: value.table, row: value.row, column: value.column }, value.content)) return false;
      tableCell = current;
    } else return false;
  }
  return true;
}

function normalizePptx(values: readonly unknown[], state: NormalizationState): boolean {
  let previous = 0;
  for (const value of values) {
    if (!isRecord(value) || !exactFields(value, ["slide", "content"]) || !positive(value.slide)
      || value.slide <= previous || !append(state, { kind: "pptx_slide", slide: value.slide }, value.content)) return false;
    previous = value.slide;
  }
  return true;
}

function cellRank(value: unknown): readonly [number, number] | undefined {
  if (typeof value !== "string") return undefined;
  const match = /^([A-Z]{1,3})([1-9][0-9]{0,5})$/.exec(value);
  if (match === null) return undefined;
  let column = 0;
  for (const letter of match[1]) column = column * 26 + letter.charCodeAt(0) - 64;
  const row = Number(match[2]);
  if (column > 16_384 || row > 100_000) return undefined;
  return [row, column];
}

export function isSourceReference(value: unknown): value is SourceReference {
  if (!isRecord(value) || typeof value.kind !== "string") return false;
  if (value.kind === "pdf_page") return exactFields(value, ["kind", "page"]) && positive(value.page);
  if (value.kind === "docx_paragraph") {
    return exactFields(value, ["kind", "paragraph"]) && positive(value.paragraph);
  }
  if (value.kind === "docx_table_cell") {
    return exactFields(value, ["kind", "table", "row", "column"])
      && positive(value.table) && positive(value.row) && positive(value.column);
  }
  if (value.kind === "pptx_slide") return exactFields(value, ["kind", "slide"]) && positive(value.slide);
  if (value.kind === "xlsx_cell") {
    return exactFields(value, ["kind", "sheet", "cell"]) && positive(value.sheet)
      && cellRank(value.cell) !== undefined;
  }
  if (value.kind === "csv_field") {
    return exactFields(value, ["kind", "row", "column"]) && positive(value.row) && positive(value.column);
  }
  return value.kind === "txt_lines" && exactFields(value, ["kind", "line_start", "line_end"])
    && positive(value.line_start) && positive(value.line_end) && value.line_end >= value.line_start;
}

function tupleAfter(current: readonly number[], previous: readonly number[]): boolean {
  for (let index = 0; index < current.length; index += 1) {
    if (current[index] !== previous[index]) return current[index] > previous[index];
  }
  return false;
}

function normalizeXlsx(values: readonly unknown[], state: NormalizationState): boolean {
  let previous: readonly [number, number, number] = [0, 0, 0];
  for (const value of values) {
    if (!isRecord(value) || !exactFields(value, ["sheet", "cell", "content"]) || !positive(value.sheet)) return false;
    const cell = cellRank(value.cell);
    if (cell === undefined || typeof value.cell !== "string") return false;
    const current: readonly [number, number, number] = [value.sheet, cell[0], cell[1]];
    if (!tupleAfter(current, previous)) return false;
    if (!append(state, { kind: "xlsx_cell", sheet: value.sheet, cell: value.cell }, value.content)) return false;
    previous = current;
  }
  return true;
}

function normalizeCsv(values: readonly unknown[], state: NormalizationState): boolean {
  let previous: readonly [number, number] = [0, 0];
  for (const value of values) {
    if (!isRecord(value) || !exactFields(value, ["row", "column", "content"])
      || !positive(value.row) || !positive(value.column)) return false;
    if (value.row < previous[0] || (value.row === previous[0] && value.column <= previous[1])) return false;
    if (!append(state, { kind: "csv_field", row: value.row, column: value.column }, value.content)) return false;
    previous = [value.row, value.column];
  }
  return true;
}

function normalizeTxt(values: readonly unknown[], state: NormalizationState): boolean {
  let previousEnd = 0;
  for (const value of values) {
    if (!isRecord(value) || !exactFields(value, ["line_start", "line_end", "content"])
      || !positive(value.line_start) || !positive(value.line_end)
      || value.line_start <= previousEnd || value.line_end < value.line_start) return false;
    if (!append(state, { kind: "txt_lines", line_start: value.line_start, line_end: value.line_end }, value.content)) return false;
    previousEnd = value.line_end;
  }
  return true;
}

function collection(value: Record<string, unknown>, key: "pages" | "sources"): readonly unknown[] | undefined {
  const expected = key === "pages" ? ["ok", "schema_version", "format", "pages"] : ["ok", "schema_version", "format", "sources"];
  const values = value[key];
  if (!exactFields(value, expected) || value.ok !== true || value.schema_version !== "1") return undefined;
  if (!Array.isArray(values) || values.length === 0 || values.length > MAX_NORMALIZED_SOURCES) return undefined;
  return values;
}

export function normalizeSourceRecords(value: unknown): readonly NormalizedSourceRecord[] | undefined {
  if (!isRecord(value) || typeof value.format !== "string") return undefined;
  const key = value.format === "pdf" ? "pages" : "sources";
  const values = collection(value, key);
  if (values === undefined) return undefined;
  const state: NormalizationState = { records: [], references: new Set(), totalCodePoints: 0 };
  const handlers: Readonly<Record<string, (items: readonly unknown[], target: NormalizationState) => boolean>> = {
    pdf: normalizePdf, docx: normalizeDocx, pptx: normalizePptx,
    xlsx: normalizeXlsx, csv: normalizeCsv, txt: normalizeTxt,
  };
  const handler = handlers[value.format];
  if (handler === undefined || !handler(values, state)) return undefined;
  return Object.freeze(state.records);
}

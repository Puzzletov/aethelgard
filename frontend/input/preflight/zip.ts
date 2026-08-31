import { finishCrc32, updateCrc32 } from "./bytes";
import { PreflightFailure } from "./result";

export const MAX_ARCHIVE_ENTRIES = 512;
export const MAX_ARCHIVE_TOTAL_BYTES = 64 * 1024 * 1024;
export const MAX_ARCHIVE_ENTRY_BYTES = 16 * 1024 * 1024;
export const MAX_ARCHIVE_RATIO = 100;
export const MAX_ARCHIVE_NAME_BYTES = 512;
const MAX_INFLATE_CHUNKS = 8_192;
const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;

export interface ZipEntry {
  readonly name: string;
  readonly flags: number;
  readonly method: number;
  readonly crc32: number;
  readonly compressedBytes: number;
  readonly uncompressedBytes: number;
  readonly dataStart: number;
  readonly dataEnd: number;
}

function findEocd(view: DataView): number {
  const minimum = Math.max(0, view.byteLength - 65_557);
  for (let offset = view.byteLength - 22; offset >= minimum; offset -= 1) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) return offset;
  }
  throw new PreflightFailure("archive_malformed");
}

function archiveDirectory(view: DataView, eocd: number) {
  const disk = view.getUint16(eocd + 4, true);
  const directoryDisk = view.getUint16(eocd + 6, true);
  const diskEntries = view.getUint16(eocd + 8, true);
  const entries = view.getUint16(eocd + 10, true);
  const size = view.getUint32(eocd + 12, true);
  const offset = view.getUint32(eocd + 16, true);
  const commentBytes = view.getUint16(eocd + 20, true);
  if (disk !== 0 || directoryDisk !== 0 || diskEntries !== entries || entries === 0xffff) {
    throw new PreflightFailure("archive_malformed");
  }
  if (entries === 0 || entries > MAX_ARCHIVE_ENTRIES) throw new PreflightFailure("archive_limit");
  if (eocd + 22 + commentBytes !== view.byteLength || offset + size !== eocd) {
    throw new PreflightFailure("archive_malformed");
  }
  return Object.freeze({ entries, size, offset });
}

function safeName(raw: Uint8Array): string {
  if (raw.byteLength === 0 || raw.byteLength > MAX_ARCHIVE_NAME_BYTES) {
    throw new PreflightFailure("archive_path");
  }
  let name: string;
  try {
    name = new TextDecoder("utf-8", { fatal: true }).decode(raw);
  } catch {
    throw new PreflightFailure("archive_path");
  }
  const parts = name.split("/");
  const contentParts = name.endsWith("/") ? parts.slice(0, -1) : parts;
  if (name.includes("\\") || name.includes("\0") || name.startsWith("/") || /^[a-z]:/i.test(name)) {
    throw new PreflightFailure("archive_path");
  }
  if (contentParts.some((part) => part === ".." || part === "." || part.length === 0)) {
    throw new PreflightFailure("archive_path");
  }
  return name;
}

function validateEntryLimits(flags: number, method: number, compressed: number, uncompressed: number) {
  if ((flags & 1) !== 0) throw new PreflightFailure("archive_encrypted");
  if (method !== 0 && method !== 8) throw new PreflightFailure("archive_malformed");
  if (compressed === 0xffffffff || uncompressed === 0xffffffff) {
    throw new PreflightFailure("archive_malformed");
  }
  if (uncompressed > MAX_ARCHIVE_ENTRY_BYTES) throw new PreflightFailure("archive_limit");
  if (uncompressed > 0 && (compressed === 0 || uncompressed / compressed > MAX_ARCHIVE_RATIO)) {
    throw new PreflightFailure("archive_limit");
  }
}

function localDataRange(view: DataView, offset: number, expectedName: string, entry: Omit<ZipEntry, "name" | "dataStart" | "dataEnd">) {
  if (offset + 30 > view.byteLength || view.getUint32(offset, true) !== LOCAL_SIGNATURE) {
    throw new PreflightFailure("archive_malformed");
  }
  const flags = view.getUint16(offset + 6, true);
  const method = view.getUint16(offset + 8, true);
  const nameBytes = view.getUint16(offset + 26, true);
  const extraBytes = view.getUint16(offset + 28, true);
  const nameStart = offset + 30;
  const dataStart = nameStart + nameBytes + extraBytes;
  const dataEnd = dataStart + entry.compressedBytes;
  if (dataEnd > view.byteLength || flags !== entry.flags || method !== entry.method) {
    throw new PreflightFailure("archive_malformed");
  }
  const localName = safeName(new Uint8Array(view.buffer, view.byteOffset + nameStart, nameBytes));
  if (localName !== expectedName) throw new PreflightFailure("archive_malformed");
  return Object.freeze({ dataStart, dataEnd });
}

function readEntry(view: DataView, offset: number): Readonly<{ entry: ZipEntry; next: number }> {
  if (offset + 46 > view.byteLength || view.getUint32(offset, true) !== CENTRAL_SIGNATURE) {
    throw new PreflightFailure("archive_malformed");
  }
  const flags = view.getUint16(offset + 8, true);
  const method = view.getUint16(offset + 10, true);
  const crc32 = view.getUint32(offset + 16, true);
  const compressedBytes = view.getUint32(offset + 20, true);
  const uncompressedBytes = view.getUint32(offset + 24, true);
  const nameBytes = view.getUint16(offset + 28, true);
  const extraBytes = view.getUint16(offset + 30, true);
  const commentBytes = view.getUint16(offset + 32, true);
  const disk = view.getUint16(offset + 34, true);
  const localOffset = view.getUint32(offset + 42, true);
  const next = offset + 46 + nameBytes + extraBytes + commentBytes;
  if (disk !== 0 || next > view.byteLength) throw new PreflightFailure("archive_malformed");
  validateEntryLimits(flags, method, compressedBytes, uncompressedBytes);
  const name = safeName(new Uint8Array(view.buffer, view.byteOffset + offset + 46, nameBytes));
  const partial = { flags, method, crc32, compressedBytes, uncompressedBytes };
  const range = localDataRange(view, localOffset, name, partial);
  return Object.freeze({ entry: Object.freeze({ name, ...partial, ...range }), next });
}

export function parseZip(bytes: Uint8Array): readonly ZipEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.byteLength < 22) throw new PreflightFailure("archive_malformed");
  const eocd = findEocd(view);
  const directory = archiveDirectory(view, eocd);
  const entries: ZipEntry[] = [];
  const names = new Set<string>();
  let offset = directory.offset;
  let total = 0;
  for (let index = 0; index < directory.entries; index += 1) {
    const parsed = readEntry(view, offset);
    const canonicalName = parsed.entry.name.toLowerCase();
    if (names.has(canonicalName)) throw new PreflightFailure("archive_malformed");
    names.add(canonicalName);
    total += parsed.entry.uncompressedBytes;
    if (total > MAX_ARCHIVE_TOTAL_BYTES) throw new PreflightFailure("archive_limit");
    if (parsed.entry.dataStart >= directory.offset || parsed.entry.dataEnd > directory.offset) {
      throw new PreflightFailure("archive_malformed");
    }
    entries.push(parsed.entry);
    offset = parsed.next;
  }
  if (offset !== directory.offset + directory.size) throw new PreflightFailure("archive_malformed");
  const ranges = entries.map((entry) => [entry.dataStart, entry.dataEnd] as const).sort((a, b) => a[0] - b[0]);
  for (let index = 1; index < ranges.length; index += 1) {
    if (ranges[index][0] < ranges[index - 1][1]) throw new PreflightFailure("archive_malformed");
  }
  return Object.freeze(entries);
}

async function inflateDeflate(bytes: Uint8Array, entry: ZipEntry, capture: boolean) {
  const compressed = bytes.slice(entry.dataStart, entry.dataEnd);
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let crc = 0xffffffff;
  try {
    for (let count = 0; count < MAX_INFLATE_CHUNKS; count += 1) {
      const item = await reader.read();
      if (item.done) return Object.freeze({ size, crc32: finishCrc32(crc), chunks });
      size += item.value.byteLength;
      if (size > entry.uncompressedBytes || size > MAX_ARCHIVE_ENTRY_BYTES) {
        throw new PreflightFailure("archive_limit");
      }
      crc = updateCrc32(crc, item.value);
      if (capture) chunks.push(item.value.slice());
    }
    throw new PreflightFailure("archive_limit");
  } finally {
    await reader.cancel().catch(() => undefined);
    compressed.fill(0);
  }
}

export async function inflateZipEntry(bytes: Uint8Array, entry: ZipEntry, capture: boolean) {
  let result: Readonly<{ size: number; crc32: number; chunks: Uint8Array[] }>;
  if (entry.method === 0) {
    const value = bytes.subarray(entry.dataStart, entry.dataEnd);
    result = Object.freeze({
      size: value.byteLength,
      crc32: finishCrc32(updateCrc32(0xffffffff, value)),
      chunks: capture ? [value.slice()] : [],
    });
  } else {
    try {
      result = await inflateDeflate(bytes, entry, capture);
    } catch (error) {
      if (error instanceof PreflightFailure) throw error;
      throw new PreflightFailure("archive_malformed");
    }
  }
  if (result.size !== entry.uncompressedBytes || result.crc32 !== entry.crc32) {
    throw new PreflightFailure("archive_malformed");
  }
  if (!capture) return undefined;
  const output = new Uint8Array(result.size);
  let offset = 0;
  for (const chunk of result.chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

const CRC32_TABLE = createCrc32Table();

function createCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let value = 0; value < table.length; value += 1) {
    let current = value;
    for (let bit = 0; bit < 8; bit += 1) {
      current = (current & 1) === 1 ? 0xedb88320 ^ (current >>> 1) : current >>> 1;
    }
    table[value] = current >>> 0;
  }
  return table;
}

export function startsWithAscii(bytes: Uint8Array, text: string): boolean {
  if (bytes.byteLength < text.length) return false;
  for (let index = 0; index < text.length; index += 1) {
    if (bytes[index] !== text.charCodeAt(index)) return false;
  }
  return true;
}

export function containsAscii(bytes: Uint8Array, text: string, start = 0): boolean {
  if (text.length === 0 || start < 0 || start > bytes.byteLength) return false;
  const first = text.charCodeAt(0);
  let offset = start;
  while (offset <= bytes.byteLength - text.length) {
    offset = bytes.indexOf(first, offset);
    if (offset < 0 || offset > bytes.byteLength - text.length) return false;
    let matched = true;
    for (let index = 1; index < text.length; index += 1) {
      if (bytes[offset + index] !== text.charCodeAt(index)) matched = false;
    }
    if (matched) return true;
    offset += 1;
  }
  return false;
}

export function updateCrc32(state: number, bytes: Uint8Array): number {
  let current = state;
  for (const byte of bytes) current = CRC32_TABLE[(current ^ byte) & 0xff] ^ (current >>> 8);
  return current >>> 0;
}

export function finishCrc32(state: number): number {
  return (state ^ 0xffffffff) >>> 0;
}

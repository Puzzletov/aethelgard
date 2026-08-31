import { deflateRawSync } from "node:zlib";

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) === 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function localRecord(name, content, options) {
  const nameBytes = Buffer.from(name);
  const compressed = options.store ? content : deflateRawSync(content);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(options.flags ?? 0, 6);
  header.writeUInt16LE(options.store ? 0 : 8, 8);
  header.writeUInt32LE(crc32(content), 14);
  header.writeUInt32LE(compressed.length, 18);
  header.writeUInt32LE(content.length, 22);
  header.writeUInt16LE(nameBytes.length, 26);
  return { local: Buffer.concat([header, nameBytes, compressed]), nameBytes, compressed, crc: crc32(content) };
}

function centralRecord(name, content, local, offset, options) {
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(options.flags ?? 0, 8);
  header.writeUInt16LE(options.store ? 0 : 8, 10);
  header.writeUInt32LE(local.crc, 16);
  header.writeUInt32LE(local.compressed.length, 20);
  header.writeUInt32LE(options.uncompressedBytes ?? content.length, 24);
  header.writeUInt16LE(local.nameBytes.length, 28);
  header.writeUInt32LE(offset, 42);
  return Buffer.concat([header, Buffer.from(name)]);
}

export function buildZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const entry of entries) {
    const content = Buffer.from(entry.content);
    const local = localRecord(entry.name, content, entry);
    locals.push(local.local);
    centrals.push(centralRecord(entry.name, content, local, offset, entry));
    offset += local.local.length;
  }
  const directory = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(directory.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, eocd]);
}

import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frontend = path.join(root, "frontend");
const manifest = JSON.parse(await readFile(path.join(frontend, "parser", "asset-manifest.json"), "utf8"));
const packageRecord = JSON.parse(await readFile(path.join(frontend, "node_modules", "pyodide", "package.json"), "utf8"));
const source = path.join(frontend, "node_modules", "pyodide");
const target = path.join(frontend, "public", "pyodide");
const maxDownloadBytes = 16 * 1024 * 1024;
const timeoutMs = 60_000;

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function verifiedExisting(targetPath, expectedHash) {
  try {
    return digest(await readFile(targetPath)) === expectedHash;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function installBytes(name, bytes, expectedHash) {
  if (digest(bytes) !== expectedHash) throw new Error(`Asset hash mismatch: ${name}`);
  const targetPath = path.join(target, name);
  if (await verifiedExisting(targetPath, expectedHash)) return;
  try {
    await stat(targetPath);
    throw new Error(`Refusing to replace unexpected asset: ${name}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const partial = `${targetPath}.partial`;
  try {
    await writeFile(partial, bytes, { flag: "wx", mode: 0o644 });
    await rename(partial, targetPath);
  } finally {
    await rm(partial, { force: true });
  }
}

async function boundedDownload(asset) {
  const response = await fetch(asset.url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok || response.body === null) throw new Error(`Asset download failed: ${asset.name}`);
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxDownloadBytes) throw new Error(`Asset is too large: ${asset.name}`);
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  let complete = false;
  try {
    for (let count = 0; count < 4_096; count += 1) {
      const item = await reader.read();
      if (item.done) {
        complete = true;
        break;
      }
      total += item.value.byteLength;
      if (total > maxDownloadBytes) throw new Error(`Asset exceeded its bound: ${asset.name}`);
      chunks.push(item.value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  if (!complete) throw new Error(`Asset chunk limit exceeded: ${asset.name}`);
  const output = Buffer.concat(chunks, total);
  if (output.byteLength !== total) throw new Error(`Asset assembly failed: ${asset.name}`);
  return output;
}

if (packageRecord.version !== manifest.pyodide_version) throw new Error("Installed Pyodide version is not approved.");
await mkdir(target, { recursive: true });
for (const asset of manifest.core) {
  const bytes = await readFile(path.join(source, asset.name));
  await installBytes(asset.name, bytes, asset.sha256);
}
for (const asset of [...manifest.packages, ...manifest.licenses]) {
  if (!await verifiedExisting(path.join(target, asset.name), asset.sha256)) {
    await installBytes(asset.name, await boundedDownload(asset), asset.sha256);
  }
}
process.stdout.write(`${JSON.stringify({
  status: "ok",
  pyodide: manifest.pyodide_version,
  python: manifest.python_version,
  assets: manifest.core.length + manifest.packages.length + manifest.licenses.length,
})}\n`);

import { loadPyodide, type PyodideInterface } from "pyodide";

export interface PythonAsset {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
}

const MAX_ASSET_CHUNKS = 4_096;

async function sha256(bytes: Uint8Array): Promise<string> {
  const input = Uint8Array.from(bytes);
  try {
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", input.buffer));
    return [...digest].map((value) => value.toString(16).padStart(2, "0")).join("");
  } finally {
    input.fill(0);
  }
}

export async function fetchPythonAsset(asset: PythonAsset): Promise<Uint8Array> {
  const response = await fetch(new URL(asset.path, self.location.origin), {
    cache: "force-cache",
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
  if (!response.ok || response.body === null) throw new Error("parser_asset_unavailable");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let complete = false;
  try {
    for (let count = 0; count < MAX_ASSET_CHUNKS; count += 1) {
      const item = await reader.read();
      if (item.done) {
        complete = true;
        break;
      }
      total += item.value.byteLength;
      if (total > asset.bytes) throw new Error("parser_asset_size");
      chunks.push(item.value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  if (!complete || total !== asset.bytes) throw new Error("parser_asset_size");
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  if (await sha256(output) !== asset.sha256) throw new Error("parser_asset_hash");
  return output;
}

export async function loadBrowserPython(packages: readonly string[]): Promise<PyodideInterface> {
  return loadPyodide({
    indexURL: new URL("/pyodide/", self.location.origin).href,
    packages: [...packages],
    stdout: () => undefined,
    stderr: () => undefined,
  });
}

export async function installPythonWheel(pyodide: PyodideInterface, asset: PythonAsset): Promise<void> {
  const wheel = await fetchPythonAsset(asset);
  try {
    pyodide.unpackArchive(wheel, "wheel");
  } finally {
    wheel.fill(0);
  }
}

export async function loadPythonSource(asset: PythonAsset): Promise<string> {
  const bytes = await fetchPythonAsset(asset);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } finally {
    bytes.fill(0);
  }
}

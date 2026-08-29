import { readFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const budgetBytes = 300 * 1024;
const outputRoot = path.resolve("frontend", "out");

function extractScriptSources(html) {
  const pattern = /<script[^>]+src="([^"]+\.js)"/g;
  return [...new Set([...html.matchAll(pattern)].map((match) => match[1]))];
}

async function measureScript(source) {
  const relativePath = source.replace(/^\//, "");
  const bytes = await readFile(path.join(outputRoot, relativePath));
  return Object.freeze({
    source,
    rawBytes: bytes.length,
    gzipBytes: gzipSync(bytes, { level: 9 }).length,
  });
}

const html = await readFile(path.join(outputRoot, "index.html"), "utf8");
const scripts = await Promise.all(extractScriptSources(html).map(measureScript));
const initialRawBytes = scripts.reduce((total, script) => total + script.rawBytes, 0);
const initialGzipBytes = scripts.reduce((total, script) => total + script.gzipBytes, 0);
const result = Object.freeze({
  initialRawBytes,
  initialGzipBytes,
  budgetBytes,
  pass: initialGzipBytes < budgetBytes,
  scripts,
});

console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exitCode = 1;

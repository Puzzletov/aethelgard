import { runBrowserParserProof } from "./browser-parser-proof.mjs";

const expectedText = "Aethelgard PDF parser proof";

function pdfObject(identifier, body) {
  return Buffer.from(`${identifier} 0 obj\n${body}\nendobj\n`, "ascii");
}

function syntheticPdf() {
  const stream = `BT /F1 12 Tf 72 720 Td (${expectedText}) Tj ET`;
  const objects = [
    pdfObject(1, "<</Type/Catalog/Pages 2 0 R>>"),
    pdfObject(2, "<</Type/Pages/Kids[3 0 R]/Count 1>>"),
    pdfObject(3, "<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>"),
    pdfObject(4, "<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>"),
    pdfObject(5, `<</Length ${Buffer.byteLength(stream)}>>\nstream\n${stream}\nendstream`),
  ];
  const parts = [Buffer.from("%PDF-1.7\n", "ascii")];
  const offsets = [0];
  let length = parts[0].byteLength;
  for (const object of objects) {
    offsets.push(length);
    parts.push(object);
    length += object.byteLength;
  }
  const rows = offsets.slice(1).map((value) => `${value.toString().padStart(10, "0")} 00000 n `);
  const xref = ["xref", "0 6", "0000000000 65535 f ", ...rows];
  parts.push(Buffer.from(`${xref.join("\n")}\ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n${length}\n%%EOF\n`, "ascii"));
  return Buffer.concat(parts);
}

function proofWorker() {
  return `
import { loadPyodide } from "/pyodide/pyodide.mjs";
const started = performance.now();
const pyodide = await loadPyodide({ indexURL: new URL("/pyodide/", location.origin).href,
  packages: ["cryptography", "charset-normalizer"], stdout: () => undefined, stderr: () => undefined });
const [wheelResponse, parserResponse, sourceResponse] = await Promise.all([
  fetch("/pyodide/pdfminer_six-20260107-py3-none-any.whl"), fetch("/parser/pdf_parser.py"), fetch("/fixture")]);
if (!wheelResponse.ok || !parserResponse.ok || !sourceResponse.ok) throw new Error("asset_fetch_failed");
const wheel = new Uint8Array(await wheelResponse.arrayBuffer());
const source = await parserResponse.text();
const documentBytes = new Uint8Array(await sourceResponse.arrayBuffer());
pyodide.unpackArchive(wheel, "wheel");
pyodide.FS.writeFile("/tmp/aethelgard-source.pdf", documentBytes);
const parsed = JSON.parse(await pyodide.runPythonAsync(source));
const versions = JSON.parse(await pyodide.runPythonAsync(
  'import importlib.metadata, json, platform\\njson.dumps({"python": platform.python_version(), "pdfminer": importlib.metadata.version("pdfminer.six")})'));
pyodide.FS.unlink("/tmp/aethelgard-source.pdf");
wheel.fill(0);
documentBytes.fill(0);
const valid = parsed.schema_version === "1" && parsed.format === "pdf" && parsed.pages?.length === 1
  && parsed.pages[0].page === 1 && parsed.pages[0].content.includes(${JSON.stringify(expectedText)});
if (!valid) throw new Error("parser_result_invalid");
self.postMessage({ status: "ok", pyodide: pyodide.version, python: versions.python,
  pdfminer: versions.pdfminer, pages: parsed.pages.length,
  elapsed_ms: Math.ceil(performance.now() - started), external_network_requests: 0 });
`;
}

process.stdout.write(`${JSON.stringify(await runBrowserParserProof(syntheticPdf(), proofWorker()))}\n`);

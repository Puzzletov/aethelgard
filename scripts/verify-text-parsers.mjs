import { runBrowserParserProof, supportedBrowserExecutables } from "./browser-parser-proof.mjs";

const csvText = "name,note\nAlice,\"line one\nline two\"\nformula,=1+1\n";
const txtText = "\ufeffFirst line\n\nThird line\n";
const fixture = Buffer.from(JSON.stringify({ csv: csvText, txt: txtText }), "utf8");
const negativeCases = `
async function rejected(path, bytes, parser) {
  pyodide.FS.writeFile(path, bytes);
  try { await pyodide.runPythonAsync(parser); return false; }
  catch { return true; }
  finally { pyodide.FS.unlink(path); bytes.fill(0); }
}
const malformedCsvRejected = await rejected("/tmp/aethelgard-source.csv",
  encoder.encode('a,"unterminated'), csvParser);
const invalidCsvUtf8Rejected = await rejected("/tmp/aethelgard-source.csv",
  new Uint8Array([255, 254]), csvParser);
const csvColumnLimitRejected = await rejected("/tmp/aethelgard-source.csv",
  encoder.encode(new Array(1001).fill("x").join(",")), csvParser);
const csvRowLimitRejected = await rejected("/tmp/aethelgard-source.csv",
  encoder.encode("x\\n".repeat(100001)), csvParser);
const invalidTxtUtf8Rejected = await rejected("/tmp/aethelgard-source.txt",
  new Uint8Array([255, 254]), txtParser);
const txtLineLimitRejected = await rejected("/tmp/aethelgard-source.txt",
  encoder.encode("x\\n".repeat(200001)), txtParser);`;
const resultChecks = `
const csvValid = csv.schema_version === "1" && csv.format === "csv" && csv.sources?.length === 6
  && csv.sources[3].row === 2 && csv.sources[3].column === 2
  && csv.sources[3].content === "line one\\nline two"
  && csv.sources[5].row === 3 && csv.sources[5].column === 2 && csv.sources[5].content === "=1+1";
const txtValid = txt.schema_version === "1" && txt.format === "txt" && txt.sources?.length === 2
  && txt.sources[0].line_start === 1 && txt.sources[0].line_end === 1 && txt.sources[0].content === "First line"
  && txt.sources[1].line_start === 3 && txt.sources[1].line_end === 3 && txt.sources[1].content === "Third line";
if (!csvValid || !txtValid || !malformedCsvRejected || !invalidCsvUtf8Rejected
  || !csvColumnLimitRejected || !csvRowLimitRejected || !invalidTxtUtf8Rejected
  || !txtLineLimitRejected) throw new Error("parser_result_invalid");
self.postMessage({ status: "ok", pyodide: pyodide.version, csv_sources: csv.sources.length,
  txt_sources: txt.sources.length, multiline_csv_row: 2, blank_txt_line_preserved: true,
  malformed_rejected: true, boundary_rejected: true,
  elapsed_ms: Math.ceil(performance.now() - started), external_network_requests: 0 });`;

function proofWorker() {
  return `
import { loadPyodide } from "/pyodide/pyodide.mjs";
const started = performance.now();
const pyodide = await loadPyodide({ indexURL: new URL("/pyodide/", location.origin).href,
  packages: [], stdout: () => undefined, stderr: () => undefined });
const [csvParserResponse, txtParserResponse, fixtureResponse] = await Promise.all([
  fetch("/parser/csv_parser.py"), fetch("/parser/txt_parser.py"), fetch("/fixture")]);
if (!csvParserResponse.ok || !txtParserResponse.ok || !fixtureResponse.ok) throw new Error("asset_fetch_failed");
const csvParser = await csvParserResponse.text();
const txtParser = await txtParserResponse.text();
const fixture = await fixtureResponse.json();
const encoder = new TextEncoder();
const csvBytes = encoder.encode(fixture.csv);
const txtBytes = encoder.encode(fixture.txt);
pyodide.FS.writeFile("/tmp/aethelgard-source.csv", csvBytes);
const csv = JSON.parse(await pyodide.runPythonAsync(csvParser));
pyodide.FS.unlink("/tmp/aethelgard-source.csv");
pyodide.FS.writeFile("/tmp/aethelgard-source.txt", txtBytes);
const txt = JSON.parse(await pyodide.runPythonAsync(txtParser));
pyodide.FS.unlink("/tmp/aethelgard-source.txt");
csvBytes.fill(0);
txtBytes.fill(0);
${negativeCases}
${resultChecks}
`;
}

const proofs = [];
for (const browser of supportedBrowserExecutables()) {
  proofs.push({ browser: browser.name, ...await runBrowserParserProof(fixture, proofWorker(), browser.executable) });
}
const first = proofs[0];
process.stdout.write(`${JSON.stringify({ ...first, browsers: proofs.map((proof) => proof.browser),
  elapsed_ms: Math.max(...proofs.map((proof) => proof.elapsed_ms)),
  external_network_requests: proofs.reduce((total, proof) => total + proof.external_network_requests, 0) })}\n`);

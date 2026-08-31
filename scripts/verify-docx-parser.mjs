import { buildZip } from "../frontend/tests/zip-fixture.mjs";
import { runBrowserParserProof } from "./browser-parser-proof.mjs";

const paragraphText = "Aethelgard DOCX paragraph proof";
const tableText = "Aethelgard DOCX table proof";

function syntheticDocx() {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
  const relationships = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
<w:tbl><w:tr><w:tc><w:p><w:r><w:t>${tableText}</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
<w:p><w:r><w:t>${paragraphText}</w:t></w:r></w:p>
<w:sectPr/></w:body></w:document>`;
  return buildZip([
    { name: "[Content_Types].xml", content: contentTypes },
    { name: "_rels/.rels", content: relationships },
    { name: "word/document.xml", content: document },
  ]);
}

function proofWorker() {
  return `
import { loadPyodide } from "/pyodide/pyodide.mjs";
const started = performance.now();
const pyodide = await loadPyodide({ indexURL: new URL("/pyodide/", location.origin).href,
  packages: ["lxml", "typing-extensions"], stdout: () => undefined, stderr: () => undefined });
const [wheelResponse, parserResponse, sourceResponse] = await Promise.all([
  fetch("/pyodide/python_docx-1.2.0-py3-none-any.whl"), fetch("/parser/docx_parser.py"), fetch("/fixture")]);
if (!wheelResponse.ok || !parserResponse.ok || !sourceResponse.ok) throw new Error("asset_fetch_failed");
const wheel = new Uint8Array(await wheelResponse.arrayBuffer());
const source = await parserResponse.text();
const documentBytes = new Uint8Array(await sourceResponse.arrayBuffer());
pyodide.unpackArchive(wheel, "wheel");
pyodide.FS.writeFile("/tmp/aethelgard-source.docx", documentBytes);
const parsed = JSON.parse(await pyodide.runPythonAsync(source));
const versions = JSON.parse(await pyodide.runPythonAsync(
  'import importlib.metadata, json, platform\\njson.dumps({"python": platform.python_version(), "python_docx": importlib.metadata.version("python-docx"), "lxml": importlib.metadata.version("lxml")})'));
pyodide.FS.unlink("/tmp/aethelgard-source.docx");
wheel.fill(0);
documentBytes.fill(0);
const valid = parsed.schema_version === "1" && parsed.format === "docx" && parsed.sources?.length === 2
  && parsed.sources[0].kind === "table_cell" && parsed.sources[0].table === 1
  && parsed.sources[0].row === 1 && parsed.sources[0].column === 1
  && parsed.sources[0].content === ${JSON.stringify(tableText)}
  && parsed.sources[1].kind === "paragraph" && parsed.sources[1].paragraph === 1
  && parsed.sources[1].content === ${JSON.stringify(paragraphText)};
if (!valid) throw new Error("parser_result_invalid");
self.postMessage({ status: "ok", pyodide: pyodide.version, python: versions.python,
  python_docx: versions.python_docx, lxml: versions.lxml, sources: parsed.sources.length,
  elapsed_ms: Math.ceil(performance.now() - started), external_network_requests: 0 });
`;
}

process.stdout.write(`${JSON.stringify(await runBrowserParserProof(syntheticDocx(), proofWorker()))}\n`);

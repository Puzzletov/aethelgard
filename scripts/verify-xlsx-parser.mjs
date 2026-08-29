import { buildZip } from "../frontend/tests/zip-fixture.mjs";
import { runBrowserParserProof } from "./browser-parser-proof.mjs";

const expectedText = "Aethelgard XLSX cell proof";
const sensitiveSheetName = "Board Secret Name";

function syntheticXlsx() {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;
  const rootRelationships = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${sensitiveSheetName}" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const workbookRelationships = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;
  const worksheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:B2"/><sheetData>
<row r="1"><c r="A1" t="inlineStr"><is><t>${expectedText}</t></is></c></row>
<row r="2"><c r="B2"><f>1+1</f><v>2</v></c></row>
</sheetData></worksheet>`;
  return buildZip([
    { name: "[Content_Types].xml", content: contentTypes },
    { name: "_rels/.rels", content: rootRelationships },
    { name: "xl/workbook.xml", content: workbook },
    { name: "xl/_rels/workbook.xml.rels", content: workbookRelationships },
    { name: "xl/worksheets/sheet1.xml", content: worksheet },
  ]);
}

function proofWorker() {
  return `
import { loadPyodide } from "/pyodide/pyodide.mjs";
const started = performance.now();
const pyodide = await loadPyodide({ indexURL: new URL("/pyodide/", location.origin).href,
  packages: [], stdout: () => undefined, stderr: () => undefined });
const [etResponse, openpyxlResponse, parserResponse, sourceResponse] = await Promise.all([
  fetch("/pyodide/et_xmlfile-2.0.0-py3-none-any.whl"), fetch("/pyodide/openpyxl-3.1.5-py2.py3-none-any.whl"),
  fetch("/parser/xlsx_parser.py"), fetch("/fixture")]);
if (!etResponse.ok || !openpyxlResponse.ok || !parserResponse.ok || !sourceResponse.ok) throw new Error("asset_fetch_failed");
const etWheel = new Uint8Array(await etResponse.arrayBuffer());
const openpyxlWheel = new Uint8Array(await openpyxlResponse.arrayBuffer());
const source = await parserResponse.text();
const documentBytes = new Uint8Array(await sourceResponse.arrayBuffer());
pyodide.unpackArchive(etWheel, "wheel");
pyodide.unpackArchive(openpyxlWheel, "wheel");
pyodide.FS.writeFile("/tmp/aethelgard-source.xlsx", documentBytes);
const parsed = JSON.parse(await pyodide.runPythonAsync(source));
const versions = JSON.parse(await pyodide.runPythonAsync(
  'import importlib.metadata, json\\njson.dumps({"openpyxl": importlib.metadata.version("openpyxl"), "et_xmlfile": importlib.metadata.version("et-xmlfile")})'));
pyodide.FS.unlink("/tmp/aethelgard-source.xlsx");
etWheel.fill(0);
openpyxlWheel.fill(0);
documentBytes.fill(0);
const valid = parsed.schema_version === "1" && parsed.format === "xlsx" && parsed.sources?.length === 2
  && parsed.sources[0].sheet === 1 && parsed.sources[0].cell === "A1"
  && parsed.sources[0].content === ${JSON.stringify(expectedText)}
  && parsed.sources[1].sheet === 1 && parsed.sources[1].cell === "B2" && parsed.sources[1].content === "=1+1"
  && !JSON.stringify(parsed).includes(${JSON.stringify(sensitiveSheetName)});
if (!valid) throw new Error("parser_result_invalid");
self.postMessage({ status: "ok", pyodide: pyodide.version, openpyxl: versions.openpyxl,
  et_xmlfile: versions.et_xmlfile, sources: parsed.sources.length, sheet_names_exposed: false,
  elapsed_ms: Math.ceil(performance.now() - started), external_network_requests: 0 });
`;
}

process.stdout.write(`${JSON.stringify(await runBrowserParserProof(syntheticXlsx(), proofWorker()))}\n`);

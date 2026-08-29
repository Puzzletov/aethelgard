import { buildZip } from "../frontend/tests/zip-fixture.mjs";
import { runBrowserParserProof } from "./browser-parser-proof.mjs";

const expectedText = "Aethelgard PPTX slide proof";
const expectedTableText = "Aethelgard PPTX table proof";

function syntheticPptx() {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="png" ContentType="image/png"/>
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
<Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>`;
  const rootRelationships = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`;
  const presentation = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst><p:sldSz cx="9144000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;
  const presentationRelationships = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
</Relationships>`;
  const slide = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>
<p:sp><p:nvSpPr><p:cNvPr id="2" name="Text 1"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr/>
<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>${expectedText}</a:t></a:r></a:p></p:txBody></p:sp>
<p:pic><p:nvPicPr><p:cNvPr id="3" name="Ignored image"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>
<p:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr/></p:pic>
<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="4" name="Table 1"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr><p:xfrm/>
<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl>
<a:tblPr firstRow="1"/><a:tblGrid><a:gridCol w="914400"/></a:tblGrid><a:tr h="370840"><a:tc>
<a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>${expectedTableText}</a:t></a:r></a:p></a:txBody><a:tcPr/>
</a:tc></a:tr></a:tbl></a:graphicData></a:graphic></p:graphicFrame>
</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
  const slideRelationships = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>
</Relationships>`;
  const image = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlR/I8AAAAASUVORK5CYII=", "base64");
  return buildZip([
    { name: "[Content_Types].xml", content: contentTypes },
    { name: "_rels/.rels", content: rootRelationships },
    { name: "ppt/presentation.xml", content: presentation },
    { name: "ppt/_rels/presentation.xml.rels", content: presentationRelationships },
    { name: "ppt/slides/slide1.xml", content: slide },
    { name: "ppt/slides/_rels/slide1.xml.rels", content: slideRelationships },
    { name: "ppt/media/image1.png", content: image },
  ]);
}

function proofWorker() {
  return `
import { loadPyodide } from "/pyodide/pyodide.mjs";
const started = performance.now();
const pyodide = await loadPyodide({ indexURL: new URL("/pyodide/", location.origin).href,
  packages: ["lxml", "typing-extensions"], stdout: () => undefined, stderr: () => undefined });
const [wheelResponse, parserResponse, sourceResponse] = await Promise.all([
  fetch("/pyodide/python_pptx-1.0.2-py3-none-any.whl"), fetch("/parser/pptx_parser.py"), fetch("/fixture")]);
if (!wheelResponse.ok || !parserResponse.ok || !sourceResponse.ok) throw new Error("asset_fetch_failed");
const wheel = new Uint8Array(await wheelResponse.arrayBuffer());
const source = await parserResponse.text();
const documentBytes = new Uint8Array(await sourceResponse.arrayBuffer());
pyodide.unpackArchive(wheel, "wheel");
pyodide.FS.unlink("/home/pyodide/pptx/templates/default.pptx");
pyodide.FS.unlink("/home/pyodide/pptx/templates/xlsx-icon.emf");
const omitted = JSON.parse(await pyodide.runPythonAsync(
  'import importlib.util, json\\njson.dumps({"pillow": importlib.util.find_spec("PIL") is None, "xlsxwriter": importlib.util.find_spec("xlsxwriter") is None})'));
pyodide.FS.writeFile("/tmp/aethelgard-source.pptx", documentBytes);
const parsed = JSON.parse(await pyodide.runPythonAsync(source));
const version = await pyodide.runPythonAsync('import importlib.metadata\\nimportlib.metadata.version("python-pptx")');
pyodide.FS.unlink("/tmp/aethelgard-source.pptx");
wheel.fill(0);
documentBytes.fill(0);
const valid = parsed.schema_version === "1" && parsed.format === "pptx" && parsed.sources?.length === 1
  && parsed.sources[0].slide === 1
  && parsed.sources[0].content === ${JSON.stringify(`${expectedText}\n${expectedTableText}`)};
if (!valid || !omitted.pillow || !omitted.xlsxwriter) throw new Error("parser_result_invalid");
self.postMessage({ status: "ok", pyodide: pyodide.version, python_pptx: version,
  slides: parsed.sources.length, pillow_omitted: omitted.pillow, xlsxwriter_omitted: omitted.xlsxwriter,
  package_data_pruned: true,
  elapsed_ms: Math.ceil(performance.now() - started), external_network_requests: 0 });
`;
}

process.stdout.write(`${JSON.stringify(await runBrowserParserProof(syntheticPptx(), proofWorker()))}\n`);

import { gzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

import { runBrowserPageProof, supportedBrowserExecutables } from "./browser-parser-proof.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entry = `
import React from "react";
import { createRoot } from "react-dom/client";
import { AnalysisChart } from "./components/analysis-chart.tsx";
const reference = { kind: "pdf_page", page: 1 };
const point = (label, value) => ({ label, value, evidence: [reference] });
const chart = { schema_version: "1", id: "savings", title: "Validated savings", unit: "percent",
  kind: "bar", points: [point("Current", 12), point("Target", 18)] };
const root = createRoot(document.body.appendChild(document.createElement("main")));
const wait = () => new Promise((resolve) => setTimeout(resolve, 20));
async function count(selector, expected) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (document.querySelectorAll(selector).length === expected) return true; await wait();
  }
  return false;
}
export async function runProof() {
  root.render(React.createElement(React.Fragment, null,
    React.createElement(AnalysisChart, { data: chart }),
    React.createElement(AnalysisChart, { data: { ...chart, id: "trend", kind: "line" } })));
  const goldenReady = await count("figure.analysis-chart", 2);
  const golden = goldenReady && document.querySelectorAll(".chart-data tbody tr").length === 4
    && document.querySelectorAll('.chart-data a[href^="#source-"]').length === 4
    && document.querySelectorAll('[role="img"]').length === 2
    && document.body.textContent.includes("12 percent")
    && document.body.textContent.includes("PDF page 1");
  const points = Array.from({ length: 64 }, (_, index) => point("Point " + (index + 1), index));
  root.render(React.createElement(AnalysisChart, { data: { ...chart, points } }));
  const bound = await count(".chart-data tbody tr", 64);
  root.render(React.createElement(AnalysisChart, { data: { ...chart, points: [] } }));
  await wait(); await wait();
  const empty = document.querySelector("figure") === null;
  root.render(React.createElement(AnalysisChart, { data: { ...chart, kind: "pie" } }));
  await wait(); await wait();
  const invalid = document.querySelector("figure") === null;
  const remote = performance.getEntriesByType("resource").filter((item) =>
    item.name.startsWith("http") && !item.name.includes("127.0.0.1")).length;
  return { status: golden && bound && empty && invalid && remote === 0 ? "ok" : "failed",
    golden, accessible: golden, bound, empty, invalid, remote_requests: remote };
}`;

const built = await build({ absWorkingDir: root, stdin: { contents: entry,
  resolveDir: path.join(root, "frontend"), sourcefile: "chart-proof.tsx", loader: "tsx" },
  bundle: true, minify: true, write: false, format: "esm", platform: "browser",
  target: ["chrome120"], logLevel: "silent" });
const source = built.outputFiles[0].text;
const bundleGzipBytes = gzipSync(source, { level: 9 }).length;
const results = [];
for (const browser of supportedBrowserExecutables()) {
  results.push({ browser: browser.name, ...await runBrowserPageProof(source, browser.executable) });
}
if (bundleGzipBytes > 307_200 || results.some((item) => item.status !== "ok")) {
  throw new Error(JSON.stringify({ bundle_gzip_bytes: bundleGzipBytes, results }));
}
process.stdout.write(`${JSON.stringify({ status: "ok", bundle_gzip_bytes: bundleGzipBytes, results })}\n`);

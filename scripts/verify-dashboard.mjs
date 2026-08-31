import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

import { runBrowserPageProof, supportedBrowserExecutables } from "./browser-parser-proof.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entry = `
import React from "react";
import { createRoot } from "react-dom/client";
import { AnalysisDashboard } from "./components/analysis-dashboard.tsx";
const reference = { kind: "pdf_page", page: 1 };
const sources = [{ schema_version: "1", ordinal: 1, reference, content: "[PERSON_1]" }];
const oracle = { schema_version: "1", executive_summary: "<img src=x onerror=alert(1)>",
  findings: [{ id: "f1", title: "Finding", analysis: "Evidence", confidence: "high", evidence: [reference] }],
  recommendations: [{ id: "r1", title: "Act", action: "Review", priority: "high", confidence: "medium", evidence: [reference] }],
  risks: [], quantitative_candidates: [],
  critique_resolutions: [{ steelman_item_id: "c1", status: "resolved", explanation: "Done" }] };
let writes = 0;
for (const method of ["setItem", "removeItem", "clear"]) {
  const native = Storage.prototype[method]; Storage.prototype[method] = function(...args) { writes += 1; return native.apply(this, args); };
}
const root = createRoot(document.body.appendChild(document.createElement("main")));
const wait = () => new Promise((resolve) => setTimeout(resolve, 10));
async function find(selector) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const value = document.querySelector(selector); if (value !== null) return value; await wait();
  }
  throw new Error("dashboard_render_timeout:" + selector);
}
export async function runProof() {
  root.render(React.createElement(AnalysisDashboard, { result: oracle, sources }));
  const link = await find('a[href^="#source-"]'); link.focus();
  const success = document.querySelector("h2")?.textContent === "Analysis"
    && document.body.textContent.includes("Confidence: high") && document.activeElement === link
    && document.querySelector("img") === null && document.body.textContent.includes("<img src=x");
  root.render(React.createElement(AnalysisDashboard, { result: { schema_version: "1", ok: false,
    category: "service", code: "service_unavailable", message: "Analysis is unavailable. Try again later.", retry: "later" }, sources: [] }));
  const alert = await find('[role="alert"]');
  const fault = alert.textContent.includes("No report was created.") === true;
  return { status: success && fault && writes === 0 ? "ok" : "failed", semantic_success: success,
    semantic_fault: fault, escaped: document.querySelector("img") === null, storage_writes: writes };
}`;

const built = await build({ absWorkingDir: root, stdin: { contents: entry, resolveDir: path.join(root, "frontend"),
  sourcefile: "dashboard-proof.tsx", loader: "tsx" }, bundle: true, write: false, format: "esm",
  platform: "browser", target: ["chrome120"], logLevel: "silent" });
const results = [];
for (const browser of supportedBrowserExecutables()) {
  results.push({ browser: browser.name,
    ...await runBrowserPageProof(built.outputFiles[0].text, browser.executable) });
}
if (results.some((result) => result.status !== "ok")) throw new Error(JSON.stringify(results));
process.stdout.write(`${JSON.stringify({ status: "ok", results })}\n`);

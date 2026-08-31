import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

import { runBrowserPageProof, supportedBrowserExecutables } from "./browser-parser-proof.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const styles = await readFile(path.join(root, "frontend", "app", "globals.css"), "utf8");
const entry = `
import React from "react";
import { createRoot } from "react-dom/client";
import { AnalysisDashboard } from "./components/analysis-dashboard.tsx";
import { cssTokenVariables } from "./design/tokens.ts";
for (const [name, value] of Object.entries(cssTokenVariables)) {
  document.documentElement.style.setProperty(name, String(value));
}
const stylesheet = document.head.appendChild(document.createElement("style"));
stylesheet.textContent = ${JSON.stringify(styles)};
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
  const dashboard = document.querySelector(".analysis-dashboard");
  const heading = document.querySelector(".analysis-heading h2");
  const summary = document.querySelector(".executive-summary p");
  const visualMetrics = dashboard === null || heading === null || summary === null ? null : {
    paper: getComputedStyle(document.body).backgroundColor,
    rule: getComputedStyle(dashboard).borderTopWidth,
    heading: getComputedStyle(heading).fontFamily,
    summary: getComputedStyle(summary).fontFamily,
    evidence: getComputedStyle(link).textUnderlineOffset,
  };
  const visual = visualMetrics !== null && visualMetrics.paper === "rgb(243, 239, 230)"
    && Number.parseFloat(visualMetrics.rule) >= 3.9 && visualMetrics.heading.includes("Fraunces")
    && visualMetrics.summary.includes("Fraunces") && visualMetrics.evidence !== "auto";
  const semantic = document.querySelectorAll("section[aria-labelledby]").length >= 7
    && document.querySelectorAll("h2").length === 1 && document.querySelectorAll("h3").length >= 7
    && ![...document.querySelectorAll("[tabindex]")].some((item) => Number(item.getAttribute("tabindex")) > 0);
  const reducedMotion = [...stylesheet.sheet.cssRules].some((rule) =>
    rule instanceof CSSMediaRule && rule.conditionText.includes("prefers-reduced-motion"));
  const keyboardFocus = document.activeElement === link;
  const success = document.querySelector("h2")?.textContent === "Analysis"
    && document.body.textContent.includes("Confidence: high") && keyboardFocus
    && document.querySelector("img") === null && document.body.textContent.includes("<img src=x")
    && visual && semantic && reducedMotion;
  root.render(React.createElement(AnalysisDashboard, { result: { schema_version: "1", ok: false,
    category: "service", code: "service_unavailable", message: "Analysis is unavailable. Try again later.", retry: "later" }, sources: [] }));
  const alert = await find('[role="alert"]');
  const fault = alert.textContent.includes("No report was created.") === true;
  return { status: success && fault && writes === 0 ? "ok" : "failed", semantic_success: semantic,
    visual_regression: visual, visual_metrics: visualMetrics, keyboard_focus: keyboardFocus,
    reduced_motion: reducedMotion, semantic_fault: fault,
    escaped: document.querySelector("img") === null, storage_writes: writes };
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

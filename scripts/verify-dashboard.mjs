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
for (const [name, value] of Object.entries(cssTokenVariables)) document.documentElement.style.setProperty(name, String(value));
document.head.appendChild(document.createElement("style")).textContent = ${JSON.stringify(styles)};
const analysis = { schema_version: "1", executive_summary: "<img src=x onerror=alert(1)>",
  findings: ["Evidence supports measured growth."], risks: ["Material delivery risk."],
  recommendations: ["Review the remaining control."] };
let writes = 0;
for (const method of ["setItem", "removeItem", "clear"]) { const native = Storage.prototype[method];
  Storage.prototype[method] = function(...args) { writes += 1; return native.apply(this, args); }; }
const root = createRoot(document.body.appendChild(document.createElement("main")));
const wait = () => new Promise((resolve) => setTimeout(resolve, 10));
async function find(selector) { for (let attempt = 0; attempt < 50; attempt += 1) {
  const value = document.querySelector(selector); if (value !== null) return value; await wait(); }
  throw new Error("dashboard_render_timeout:" + selector); }
async function count(selector, expected) { for (let attempt = 0; attempt < 50; attempt += 1) {
  if (document.querySelectorAll(selector).length === expected) return; await wait(); }
  throw new Error("dashboard_count_timeout:" + selector); }
export async function runProof() {
  const started = performance.timeOrigin; root.render(React.createElement(AnalysisDashboard, { result: analysis }));
  const link = await find('.analysis-index a'); link.focus();
  const keyboardFocus = document.activeElement === link;
  const interactiveMs = performance.timeOrigin + performance.now() - started;
  const dashboard = document.querySelector(".analysis-dashboard");
  const heading = document.querySelector(".analysis-heading h2");
  const summary = document.querySelector(".executive-summary p");
  const metrics = dashboard === null || heading === null || summary === null ? null : {
    paper: getComputedStyle(document.body).backgroundColor, rule: getComputedStyle(dashboard).borderTopWidth,
    heading: getComputedStyle(heading).fontFamily, summary: getComputedStyle(summary).fontFamily };
  const visual = metrics !== null && metrics.paper === "rgb(243, 239, 230)"
    && Number.parseFloat(metrics.rule) >= 3.9 && metrics.heading.includes("Fraunces") && metrics.summary.includes("Fraunces");
  const headings = [...document.querySelectorAll(".analysis-dashboard h3")].map((item) => item.textContent);
  const goldenOrder = JSON.stringify(headings) === JSON.stringify(["Executive summary", "Findings",
    "Risks / considerations", "Recommendations"]);
  const index = [...document.querySelectorAll(".analysis-index a")].map((item) => item.getAttribute("href"));
  const deterministicIndex = JSON.stringify(index) === JSON.stringify(["#summary", "#findings", "#risks", "#recommendations"]);
  const semantic = document.querySelectorAll("section[aria-labelledby]").length >= 5
    && document.querySelectorAll("h2").length === 1 && document.querySelectorAll("h3").length === 4;
  const reducedMotion = [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules]).some((rule) =>
    rule instanceof CSSMediaRule && rule.conditionText.includes("prefers-reduced-motion"));
  const preserved = document.body.textContent.includes("Material delivery risk")
    && document.body.textContent.includes("Review the remaining control");
  const noMethodology = !/Strawman|Steelman|Oracle/u.test(document.body.textContent ?? "");
  root.render(React.createElement(AnalysisDashboard, { result: { ...analysis,
    findings: Array.from({ length: 12 }, (_, index) => "Finding " + (index + 1)) } }));
  await count("#findings .result-list > li", 12);
  const boundCase = document.querySelectorAll("#findings .result-list > li").length === 12;
  const failure = { schema_version: "1", ok: false, category: "analysis", code: "analysis_unavailable",
    message: "Analysis temporarily unavailable.", retry: "later" };
  root.render(React.createElement(AnalysisDashboard, { result: failure }));
  const alert = await find('[role="alert"]');
  const fault = alert.textContent.includes(failure.message) && alert.textContent.includes("Analysis paused");
  return { status: visual && semantic && goldenOrder && deterministicIndex && preserved && noMethodology
      && boundCase && fault && writes === 0 ? "ok" : "failed",
    semantic_success: semantic, interactive_ms: Math.ceil(interactiveMs), visual_regression: visual,
    visual_metrics: metrics, keyboard_focus: keyboardFocus, reduced_motion: reducedMotion,
    golden_order: goldenOrder, deterministic_index: deterministicIndex, no_methodology: noMethodology,
    content_preserved: preserved, bound_case: boundCase, semantic_fault: fault,
    escaped: document.querySelector("img") === null, storage_writes: writes };
}`;

const built = await build({ absWorkingDir: root, stdin: { contents: entry,
  resolveDir: path.join(root, "frontend"), sourcefile: "dashboard-proof.tsx", loader: "tsx" },
  bundle: true, write: false, format: "esm", platform: "browser", target: ["chrome120"], logLevel: "silent" });
const results = [];
for (const browser of supportedBrowserExecutables()) results.push({ browser: browser.name,
  ...await runBrowserPageProof(built.outputFiles[0].text, browser.executable) });
if (results.some((result) => result.status !== "ok")) throw new Error(JSON.stringify(results));
process.stdout.write(`${JSON.stringify({ status: "ok", results })}\n`);

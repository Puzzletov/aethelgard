import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

import { runBrowserPageProof, supportedBrowserExecutables } from "./browser-parser-proof.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entry = `
import React from "react";
import { createRoot } from "react-dom/client";
import { DownloadControls } from "./components/download-controls.tsx";
const reference = { kind: "pdf_page", page: 1 };
const response = { schema_version: "1", dashboard: { schema_version: "1", focus: "full", title: "Review",
  executive_summary: "Summary.", findings: [{ id: "f1", title: "Finding", analysis: "Analysis.",
    confidence: "high", evidence: [reference] }], recommendations: [{ id: "r1", title: "Act",
    action: "Review.", priority: "high", confidence: "high", evidence: [reference] }], risks: [], charts: [],
  verification: { ed25519_key_id: "ed25519:" + "a".repeat(32),
    mldsa65_key_id: "mldsa65:" + "b".repeat(32) } },
  pdf: { bytes_b64: btoa("%PDF-1.7\\n%%EOF"), signature_manifest: { schema_version: "1",
    pdf_sha256: "c".repeat(64), ed25519_algorithm: "Ed25519", ed25519_public_key_id: "ed25519:" + "a".repeat(32),
    ed25519_signature_b64: btoa("e".repeat(64)), mldsa65_algorithm: "ML-DSA-65",
    mldsa65_public_key_id: "mldsa65:" + "b".repeat(32), mldsa65_signature_b64: btoa("m".repeat(3309)) } },
  xlsx_b64: btoa("PK workbook"), text_utf8: "Report text.\\n" };
const blobs = new Map(); const revoked = []; const clicks = []; const lifetimes = []; const pending = [];
let created = 0; let writes = 0;
URL.createObjectURL = (blob) => { const url = "blob:proof-" + (++created); blobs.set(url, blob); return url; };
URL.revokeObjectURL = (url) => revoked.push(url);
HTMLAnchorElement.prototype.click = function() { clicks.push({ url: this.href, name: this.download }); };
const nativeTimeout = window.setTimeout.bind(window);
const nativeQueueMicrotask = globalThis.queueMicrotask.bind(globalThis);
window.setTimeout = (callback, milliseconds, ...args) => {
  if (milliseconds === 300000) lifetimes.push(milliseconds);
  return nativeTimeout(callback, milliseconds, ...args);
};
for (const method of ["setItem", "removeItem", "clear"]) {
  const native = Storage.prototype[method]; Storage.prototype[method] = function(...args) {
    writes += 1; return native.apply(this, args);
  };
}
const rootNode = createRoot(document.body.appendChild(document.createElement("main")));
const wait = () => new Promise((resolve) => nativeTimeout(resolve, 20));
async function buttons(count) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (document.querySelectorAll("button").length === count) return [...document.querySelectorAll("button")];
    await wait();
  }
  throw new Error("download_controls_timeout");
}
export async function runProof() {
  rootNode.render(React.createElement(DownloadControls, { response }));
  const controls = await buttons(4); const userTriggered = created === 0 && clicks.length === 0;
  globalThis.queueMicrotask = (callback) => pending.push(callback);
  controls[0].click(); window.dispatchEvent(new PageTransitionEvent("pagehide"));
  while (pending.length > 0) pending.shift()();
  for (const control of controls.slice(1)) { control.click(); while (pending.length > 0) pending.shift()(); }
  globalThis.queueMicrotask = nativeQueueMicrotask;
  const names = clicks.map((item) => item.name);
  const types = [...blobs.values()].map((blob) => blob.type);
  const contents = [];
  for (const blob of blobs.values()) contents.push(await blob.text());
  const exact = contents[0] === "%PDF-1.7\\n%%EOF" && contents[2] === "PK workbook"
    && contents[3] === "Report text.\\n" && contents[1].endsWith("}\\n");
  const lifecycle = revoked.length === 4 && new Set(revoked).size === 4
    && lifetimes.length === 4 && lifetimes.every((value) => value === 300000);
  const originalCreate = URL.createObjectURL; URL.createObjectURL = () => { throw new Error("allocation"); };
  controls[0].click(); await wait(); const failure = document.querySelector('[role="status"]')?.textContent
    === "Download could not be prepared."; URL.createObjectURL = originalCreate;
  const remote = performance.getEntriesByType("resource").filter((item) =>
    item.name.startsWith("http") && !item.name.includes("127.0.0.1")).length;
  const expectedNames = ["aethelgard-report.pdf", "aethelgard-report.sig.json",
    "aethelgard-report.xlsx", "aethelgard-report.txt"];
  const expectedTypes = ["application/pdf", "application/json",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain;charset=utf-8"];
  const success = userTriggered && JSON.stringify(names) === JSON.stringify(expectedNames)
    && JSON.stringify(types) === JSON.stringify(expectedTypes) && exact && lifecycle && failure
    && writes === 0 && remote === 0;
  return { status: success ? "ok" : "failed", user_triggered: userTriggered, exact, lifecycle, failure,
    names, types, storage_writes: writes, remote_requests: remote };
}`;

const built = await build({ absWorkingDir: root, stdin: { contents: entry,
  resolveDir: path.join(root, "frontend"), sourcefile: "downloads-proof.tsx", loader: "tsx" },
bundle: true, minify: true, write: false, format: "esm", platform: "browser",
target: ["chrome120"], logLevel: "silent" });
const results = [];
for (const browser of supportedBrowserExecutables()) {
  results.push({ browser: browser.name,
    ...await runBrowserPageProof(built.outputFiles[0].text, browser.executable) });
}
if (results.some((result) => result.status !== "ok")) throw new Error(JSON.stringify(results));
process.stdout.write(`${JSON.stringify({ status: "ok", results })}\n`);

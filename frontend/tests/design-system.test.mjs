import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const frontendRoot = new URL("../", import.meta.url);
const expectedFonts = Object.freeze({
  "fraunces-latin.woff2": "7234ed860a9cc83045413c4faee63c960a8f2d1917adcf728119307d56e0d783",
  "public-sans-latin.woff2": "5ed4d31c988e73b258894244f209069ebe77dc7e564861954b21198b6de90d68",
});

async function readText(path) {
  return readFile(new URL(path, frontendRoot), "utf8");
}

test("the static shell uses the shared typed design tokens", async () => {
  const [layout, tokens, styles] = await Promise.all([
    readText("app/layout.tsx"),
    readText("../src/design/visual-tokens.ts"),
    readText("app/globals.css"),
  ]);

  assert.match(layout, /style={cssTokenVariables}/);
  assert.match(tokens, /paper: "#f3efe6"/);
  assert.match(tokens, /charcoal: "#242522"/);
  assert.match(tokens, /terracotta: "#a84f35"/);
  assert.match(styles, /var\(--color-terracotta\)/);
});

test("fonts are local, licensed, and pinned", async () => {
  const styles = await readText("app/globals.css");
  assert.doesNotMatch(styles, /https?:\/\//);
  assert.match(styles, /font-family: "Fraunces"/);
  assert.match(styles, /font-family: "Public Sans"/);

  for (const [file, expectedHash] of Object.entries(expectedFonts)) {
    const bytes = await readFile(new URL(`public/fonts/${file}`, frontendRoot));
    const actualHash = createHash("sha256").update(bytes).digest("hex");
    assert.equal(actualHash, expectedHash);
  }
  await readText("public/fonts/LICENSE-Fraunces.txt");
  await readText("public/fonts/LICENSE-Public-Sans.txt");
});

test("the shell exposes only the approved browser mission control", async () => {
  const page = await readText("app/page.tsx");
  const picker = await readText("components/document-picker.tsx");
  assert.doesNotMatch(`${page}\n${picker}`, /chat|email|BYOK|dangerouslySetInnerHTML/i);
  assert.match(page, /DocumentPicker/);
  assert.match(page, /Skip to main content/);
  assert.match(page, /Operating principles/);
  assert.match(picker, /AnalysisDashboard/);
  assert.match(picker, /TurnstileWidget/);
});

test("the complete mission surface uses one restrained accessible visual system", async () => {
  const [styles, picker, dashboard] = await Promise.all([
    readText("app/globals.css"),
    readText("components/document-picker.tsx"),
    readText("components/analysis-dashboard.tsx"),
  ]);
  assert.match(styles, /\.mission-controls/);
  assert.match(styles, /\.analysis-dashboard/);
  assert.match(styles, /\.executive-summary/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /button:focus-visible/);
  assert.doesNotMatch(styles, /gradient|backdrop-filter|border-radius:\s*[2-9]\d/iu);
  assert.match(picker, /<fieldset className="mission-controls"/);
  assert.match(picker, /className="analyze-button"/);
  assert.match(dashboard, /<header className="analysis-heading"/);
  assert.match(dashboard, /className="executive-summary"/);
  assert.doesNotMatch(`${picker}\n${dashboard}`, /dangerouslySetInnerHTML|tabIndex=\{[1-9]\}/u);
});

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
    readText("design/tokens.ts"),
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

test("the shell has no dashboard, parser, or AI control", async () => {
  const page = await readText("app/page.tsx");
  assert.doesNotMatch(page, /fetch\(|dashboard|chat/i);
  assert.match(page, /DocumentPicker/);
  assert.match(page, /Skip to main content/);
  assert.match(page, /Operating principles/);
});

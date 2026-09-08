import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("the homepage leads with the working document journey", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  assert.ok(page.indexOf("<DocumentPicker />") < page.indexOf("<ProcessNote />"));
  assert.doesNotMatch(page, /PortfolioExplanation|StaticSample|Operating principles/u);
  for (const phrase of ["Original stays local", "Configured identifiers redacted locally", "No application history"]) {
    assert.match(page, new RegExp(phrase, "u"));
  }
});

test("proof surfaces remain directly accessible without overtaking the primary action", async () => {
  const [page, styles] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);
  for (const href of ["/sample", "/verify", "/case-study", "/trust", "/privacy"]) {
    assert.match(page, new RegExp(`href="${href}"`, "u"));
  }
  assert.match(styles, /@media \(max-width: 48rem\)[\s\S]*\.case-study > section,[\s\S]*\.trust-page section/);
  assert.doesNotMatch(page, /dangerouslySetInnerHTML|target="_blank"/u);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageUrl = new URL("../app/case-study/page.tsx", import.meta.url);

test("case study is bounded and matches the approved architecture decisions", async () => {
  const page = await readFile(pageUrl, "utf8");
  assert.ok([...page].length <= 40_000);
  for (const phrase of ["Exact-zero changed the boundary", "disposable browser module Workers",
    "external binding", "Reasoning stays inside one request", "one bounded Groq request",
    "MVP stops at the finished analysis", "Strict response validation", "raw documents"]) {
    assert.match(page, new RegExp(phrase, "u"));
  }
  assert.doesNotMatch(page, /Strawman, Steelman and Oracle|OpenRouter Free/iu);
  assert.doesNotMatch(page, /Cloud Run|FastAPI|server-side parsing is current|unhackable/iu);
});

test("case study exposes an accessible static topology and evidence links", async () => {
  const page = await readFile(pageUrl, "utf8");
  assert.match(page, /href="#case-study-content"/);
  assert.match(page, /<main className="case-study page-frame" id="case-study-content">/);
  assert.match(page, /<ol className="architecture-flow" aria-label=/);
  for (const href of ["/trust", "/sample", "/verify", "/"]) {
    assert.match(page, new RegExp(`href="${href}"`, "u"));
  }
  assert.doesNotMatch(page, /dangerouslySetInnerHTML|target="_blank"|<img/u);
});

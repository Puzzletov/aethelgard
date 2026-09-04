import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("README is bounded, current and contains every required entry-point claim", async () => {
  const readme = await readFile(new URL("README.md", root), "utf8");
  assert.ok([...readme].length <= 20_000);
  for (const phrase of ["Strawman → Steelman → Oracle", "Raw files, unredacted extracted text",
    "GBP 0.00 and USD 0.00", "desktop\\s+Chrome and Edge", "does not claim to malware-scan",
    "Phase 4 trust and portfolio finish is\\s+in\\s+progress"]) assert.match(readme, new RegExp(phrase, "u"));
  assert.doesNotMatch(readme, /Cloud Run|FastAPI|Google Secret|email delivery|BYOK|Sentry/iu);
  assert.doesNotMatch(readme, /[ \t]+$/gmu);
  assert.equal((readme.match(/^```/gmu) ?? []).length % 2, 0);
});

test("README commands exist and every relative Markdown link resolves", async () => {
  const [readme, rootPackage, frontendPackage] = await Promise.all([
    readFile(new URL("README.md", root), "utf8"),
    readFile(new URL("package.json", root), "utf8").then(JSON.parse),
    readFile(new URL("frontend/package.json", root), "utf8").then(JSON.parse),
  ]);
  for (const command of ["test", "build", "verify:report"]) assert.ok(rootPackage.scripts[command]);
  assert.ok(frontendPackage.scripts.dev);
  const links = [...readme.matchAll(/\[[^\]]+\]\((?!https?:)([^)]+)\)/gu)].map((match) => match[1]);
  assert.ok(links.length >= 4);
  await Promise.all(links.map((link) => access(new URL(link, root))));
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const frontendRoot = new URL("../", import.meta.url);
const repositoryRoot = new URL("../../", import.meta.url);

test("the frontend blocks search indexing", async () => {
  const layout = await readFile(new URL("app/layout.tsx", frontendRoot), "utf8");
  const robots = await readFile(new URL("public/robots.txt", frontendRoot), "utf8");

  assert.match(layout, /robots:\s*{/);
  assert.match(layout, /index:\s*false/);
  assert.match(layout, /follow:\s*false/);
  assert.match(layout, /noarchive:\s*true/);
  assert.equal(robots.replaceAll("\r\n", "\n"), "User-agent: *\nDisallow: /\n");
});

test("the static export has no server start command", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("package.json", frontendRoot), "utf8"),
  );

  assert.equal(packageJson.scripts.start, undefined);
});

test("empty secret templates are trackable", async () => {
  const gitignore = await readFile(new URL(".gitignore", repositoryRoot), "utf8");
  const envExample = await readFile(new URL(".env.example", repositoryRoot), "utf8");
  const workerExample = await readFile(
    new URL(".dev.vars.example", repositoryRoot),
    "utf8",
  );

  assert.match(gitignore, /^!\.dev\.vars\.example$/m);
  for (const content of [envExample, workerExample]) {
    const variables = content
      .split(/\r?\n/)
      .filter((line) => line.length > 0 && !line.startsWith("#"));

    assert.ok(variables.length > 0);
    for (const line of variables) {
      assert.match(line, /^[A-Z][A-Z0-9_]*=$/);
    }
  }
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import nextConfig from "../next.config.js";

test("the frontend builds as a static Cloudflare Pages site", () => {
  assert.equal(nextConfig.output, "export");
});

test("generated static export source copies are not treated as project source", async () => {
  const config = JSON.parse(await readFile(new URL("../tsconfig.json", import.meta.url), "utf8"));
  assert.ok(config.exclude.includes("out"));
  assert.ok(config.include.includes(".next/types/**/*.ts"));
});

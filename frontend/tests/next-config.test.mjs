import assert from "node:assert/strict";
import test from "node:test";

import nextConfig from "../next.config.js";

test("the frontend builds as a static Cloudflare Pages site", () => {
  assert.equal(nextConfig.output, "export");
});

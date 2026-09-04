import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("resource gate emits every exact bounded release measurement", async () => {
  const source = await readFile(new URL("../scripts/measure-resources.mjs", import.meta.url), "utf8");
  for (const field of ["initial_js_gzip_bytes", "static_asset_max_bytes", "public_worker_gzip_bytes",
    "trusted_worker_gzip_bytes", "public_cpu_p99_ms", "trusted_peak_memory_bytes", "response_max_bytes"]) {
    assert.match(source, new RegExp(`\\b${field}\\b`));
  }
  for (const bound of ["307_200", "26_214_400", "2_516_582", "100_663_296", "8_388_608"]) {
    assert.match(source, new RegExp(bound));
  }
  assert.match(source, /index < 1_000/);
  assert.match(source, /Math\.ceil\(timings\.length \* 0\.99\)/);
});

import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const sitekey = process.env.AETHELGARD_TEST_SITEKEY;
const endpoint = process.env.AETHELGARD_MINIMAL_ENDPOINT;
if (sitekey !== "1x00000000000000000000AA") throw new Error("official_test_sitekey_required");
if (endpoint !== "https://aethelgard-minimal-edge.justbwas.workers.dev/analyze") {
  throw new Error("minimal_edge_endpoint_required");
}
const output = path.join(directory, "dist");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all([
  cp(path.join(directory, "web", "index.html"), path.join(output, "index.html")),
  cp(path.join(directory, "web", "styles.css"), path.join(output, "styles.css")),
  build({ entryPoints: [path.join(directory, "web", "app.ts")], outfile: path.join(output, "app.js"),
    bundle: true, format: "esm", platform: "browser", minify: true, sourcemap: false,
    define: { __TURNSTILE_SITEKEY__: JSON.stringify(sitekey), __TURNSTILE_ACTION__: JSON.stringify("test"),
      __ANALYZE_ENDPOINT__: JSON.stringify(endpoint) },
    logLevel: "silent" }),
  build({ entryPoints: [path.join(directory, "..", "..", "frontend", "workers", "parser.worker.ts")],
    outfile: path.join(output, "parser.worker.mjs"), bundle: true, format: "esm", platform: "browser",
    target: ["chrome120"], minify: true, sourcemap: false, legalComments: "none", logLevel: "silent",
    plugins: [{ name: "self-hosted-pyodide", setup(workerBuild) {
      workerBuild.onResolve({ filter: /^pyodide$/ }, () => ({ path: "/pyodide/pyodide.mjs", external: true }));
    } }] }),
  cp(path.join(directory, "..", "..", "frontend", "public", "pyodide"), path.join(output, "pyodide"),
    { recursive: true }),
  cp(path.join(directory, "..", "..", "frontend", "public", "parser"), path.join(output, "parser"),
    { recursive: true }),
]);
process.stdout.write("minimal-e2e build PASS\n");

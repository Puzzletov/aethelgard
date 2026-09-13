import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const sitekey = "0x4AAAAAAEGLv7UgKYeWsVdW";
const endpoint = "https://aethelgard-managed-golden-edge.justbwas.workers.dev/analyze";
const output = path.join(directory, "managed-dist");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all([
  cp(path.join(directory, "web", "index.html"), path.join(output, "index.html")),
  cp(path.join(directory, "web", "styles.css"), path.join(output, "styles.css")),
  build({ entryPoints: [path.join(directory, "web", "app.ts")], outfile: path.join(output, "app.js"),
    bundle: true, format: "esm", platform: "browser", minify: true, sourcemap: false,
    define: { __TURNSTILE_SITEKEY__: JSON.stringify(sitekey), __TURNSTILE_ACTION__: JSON.stringify("analyze"),
      __ANALYZE_ENDPOINT__: JSON.stringify(endpoint) }, logLevel: "silent" }),
]);
process.stdout.write("managed minimal-e2e build PASS\n");

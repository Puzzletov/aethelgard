import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = process.argv[2] === undefined
  ? path.join(root, "frontend", "public", "parser.worker.mjs")
  : path.resolve(process.argv[2]);

await build({
  absWorkingDir: root,
  entryPoints: ["./frontend/workers/parser.worker.ts"],
  outfile: output,
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["chrome120"],
  minify: true,
  legalComments: "none",
  logLevel: "silent",
  plugins: [{
    name: "self-hosted-pyodide",
    setup(pluginBuild) {
      pluginBuild.onResolve({ filter: /^pyodide$/ }, () => ({
        path: "/pyodide/pyodide.mjs",
        external: true,
      }));
    },
  }],
});

import { readFile } from "node:fs/promises";

import { lintArchitecture } from "./architecture-spec.mjs";

const architecture = await readFile(new URL("../ARCHITECTURE.md", import.meta.url), "utf8");
const errors = lintArchitecture(architecture);
if (errors.length > 0) {
  process.stderr.write(`${errors.map((error) => `architecture: ${error}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("architecture:lint PASS\n");
}

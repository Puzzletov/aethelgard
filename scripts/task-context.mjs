import { readFile } from "node:fs/promises";

import { taskContext } from "./architecture-spec.mjs";

const taskId = process.argv[2];
if (taskId === undefined || !/^\d+\.\d+$/.test(taskId)) {
  throw new Error("Usage: npm run task:context -- N.x");
}
const architecture = await readFile(new URL("../ARCHITECTURE.md", import.meta.url), "utf8");
process.stdout.write(`${taskContext(architecture, taskId)}\n`);

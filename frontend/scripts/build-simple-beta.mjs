import { spawnSync } from "node:child_process";
import path from "node:path";

const npmCli = process.env.npm_execpath ?? path.join(path.dirname(process.execPath),
  "node_modules", "npm", "bin", "npm-cli.js");
const result = spawnSync(process.execPath, [npmCli, "run", "build"], {
  cwd: new URL("..", import.meta.url),
  env: { ...process.env, NEXT_PUBLIC_AETHELGARD_SIMPLE_BETA: "1" },
  stdio: "inherit",
});
if (result.error !== undefined) throw result.error;
process.exitCode = result.status ?? 1;

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const repository = new URL("..", import.meta.url);
const revision = process.argv[2] === "--index" ? ":ARCHITECTURE.md" : "HEAD:ARCHITECTURE.md";
const bytes = execFileSync("git", ["cat-file", "blob", revision], {
  cwd: repository, encoding: "buffer", maxBuffer: 16 * 1024 * 1024,
});
process.stdout.write(`${createHash("sha256").update(bytes).digest("hex")}\n`);

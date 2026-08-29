import { spawn } from "node:child_process";

const [command, ...arguments_] = process.argv.slice(2);
if (command === undefined || command.length === 0) throw new Error("A CI command is required.");

const timeoutMs = 20 * 60 * 1_000;
let warningFound = false;
const warningPattern = /(?:^|[^a-z])warn(?:ing)?(?:[^a-z]|$)/i;
const windowsNpm = process.platform === "win32" && command === "npm";
const executable = windowsNpm ? (process.env.ComSpec ?? "cmd.exe") : command;
const childArguments = windowsNpm ? ["/d", "/s", "/c", "npm.cmd", ...arguments_] : arguments_;
const child = spawn(executable, childArguments, {
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});

function forward(stream, destination) {
  let carry = "";
  stream.on("data", (chunk) => {
    const text = chunk.toString("utf8");
    destination.write(text);
    const searchable = carry + text;
    if (warningPattern.test(searchable)) warningFound = true;
    carry = searchable.slice(-32);
  });
}

forward(child.stdout, process.stdout);
forward(child.stderr, process.stderr);
const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMs);
const status = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", (code, signal) => resolve({ code, signal }));
});
clearTimeout(timer);
if (status.code !== 0 || status.signal !== null || warningFound) {
  process.stderr.write(`${JSON.stringify({
    status: "failed",
    command,
    exit_code: status.code,
    signal: status.signal,
    warning_found: warningFound,
  })}\n`);
  process.exitCode = 1;
}

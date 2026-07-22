import { spawn } from "node:child_process";

const children = [
  spawn(process.execPath, ["scripts/codex-bridge.mjs"], { stdio: "inherit" }),
  spawn("npm", ["run", "dev"], { stdio: "inherit" }),
];

function stop(signal = "SIGTERM") {
  for (const child of children) if (!child.killed) child.kill(signal);
}
process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));
for (const child of children) child.on("exit", (code) => { if (code && code !== 0) process.exitCode = code; });

#!/usr/bin/env node

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const pythonCommand = process.platform === "win32" ? "python" : "python3";
const processes = [];
let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of processes) child.kill();
  process.exit(exitCode);
}

function start(name, command, args) {
  const child = spawn(command, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  processes.push(child);
  child.on("error", (error) => {
    console.error(`${name} failed to start: ${error.message}`);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping && code !== 0) {
      console.error(`${name} stopped unexpectedly (exit code ${code ?? "unknown"}).`);
      stop(code || 1);
    }
  });
}

console.log("Starting BloomCare web app and payment API...");
console.log("Web: http://127.0.0.1:8080");
console.log("API: http://127.0.0.1:8787/health");
start("Web server", npmCommand, ["--prefix", "BLOOMCARE-main", "run", "dev"]);
start("Payment API", pythonCommand, ["server/payment_api.py"]);
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());

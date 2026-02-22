import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..");
const lockPath = path.join(repoRoot, "versions.lock.json");
const outputDir = path.join(repoRoot, "web", "public", "pyodide", "runtime");

const lock = JSON.parse(await fs.readFile(lockPath, "utf-8"));
const pyodideVersion = lock.pyodide;

const coreFiles = [
  "pyodide.mjs",
  "pyodide.js",
  "pyodide.asm.js",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json"
];

const base = `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full`;

await fs.mkdir(outputDir, { recursive: true });

async function fetchFile(file) {
  const url = `${base}/${file}`;
  const destination = path.join(outputDir, file);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  await fs.writeFile(destination, bytes);
  console.log(`Fetched ${file}`);
}

for (const file of coreFiles) {
  await fetchFile(file);
}

const pyodideLockPath = path.join(outputDir, "pyodide-lock.json");
const pyodideLock = JSON.parse(await fs.readFile(pyodideLockPath, "utf-8"));
const packages = pyodideLock.packages || {};

function collectPackageFiles(packageName, seenNames, seenFiles) {
  if (seenNames.has(packageName)) {
    return;
  }
  seenNames.add(packageName);

  const entry = packages[packageName];
  if (!entry) {
    throw new Error(`Package '${packageName}' is not present in pyodide-lock.json`);
  }

  if (entry.file_name) {
    seenFiles.add(entry.file_name);
  }

  const depends = Array.isArray(entry.depends) ? entry.depends : [];
  for (const dependency of depends) {
    collectPackageFiles(dependency, seenNames, seenFiles);
  }
}

const requiredNames = new Set();
const requiredFiles = new Set();
collectPackageFiles("micropip", requiredNames, requiredFiles);

for (const file of [...requiredFiles].sort()) {
  await fetchFile(file);
}

console.log(`Pyodide ${pyodideVersion} runtime assets downloaded to ${outputDir}`);

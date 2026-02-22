import { access, readFile } from "node:fs/promises";
import path from "node:path";

const requiredPaths = [
  "public/catalog.json",
  "public/runtime-manifest.json",
  "public/pyodide/runtime/pyodide.mjs",
  "public/pyodide/runtime/pyodide-lock.json",
  "public/pyodide/wheels/manifest.json"
];

async function exists(relativePath) {
  const fullPath = path.resolve(relativePath);
  try {
    await access(fullPath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const missing = [];

  for (const relativePath of requiredPaths) {
    const found = await exists(relativePath);
    if (!found) {
      missing.push(relativePath);
    }
  }

  if (missing.length === 0) {
    const lockPath = path.resolve("public/pyodide/runtime/pyodide-lock.json");
    const lock = JSON.parse(await readFile(lockPath, "utf-8"));
    const packages = lock.packages || {};

    const seenNames = new Set();
    const dependencyFiles = new Set();

    const collect = (packageName) => {
      if (seenNames.has(packageName)) {
        return;
      }
      seenNames.add(packageName);

      const entry = packages[packageName];
      if (!entry) {
        missing.push(`public/pyodide/runtime/<missing package entry: ${packageName}>`);
        return;
      }

      if (entry.file_name) {
        dependencyFiles.add(entry.file_name);
      }

      const depends = Array.isArray(entry.depends) ? entry.depends : [];
      for (const dependency of depends) {
        collect(dependency);
      }
    };

    collect("micropip");
    for (const fileName of dependencyFiles) {
      const rel = `public/pyodide/runtime/${fileName}`;
      const found = await exists(rel);
      if (!found) {
        missing.push(rel);
      }
    }
  }

  if (missing.length === 0) {
    console.log("Static asset verification passed.");
    return;
  }

  console.error("Missing required static assets:");
  for (const item of [...new Set(missing)]) {
    console.error(`- ${item}`);
  }
  console.error("");
  console.error("Build blocked to avoid deploying a broken GitHub Pages site.");
  console.error("Run these commands from repo root:");
  console.error("1) python catalog_build/build_catalog.py");
  console.error("2) cd web && npm run pyodide:fetch");
  console.error("3) cd web && npm run wheels:fetch");

  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

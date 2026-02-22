import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const distDir = path.resolve("./dist");
const prefix = process.env.PAGES_PREFIX || "/fakerui";
const port = Number.parseInt(process.env.CHECK_PORT || "4180", 10);
const liveUrl = process.env.LIVE_URL || "";

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html";
  if (filePath.endsWith(".js")) return "application/javascript";
  if (filePath.endsWith(".mjs")) return "application/javascript";
  if (filePath.endsWith(".css")) return "text/css";
  if (filePath.endsWith(".json")) return "application/json";
  if (filePath.endsWith(".wasm")) return "application/wasm";
  if (filePath.endsWith(".zip")) return "application/zip";
  return "application/octet-stream";
}

function toRelativePath(urlPathname) {
  if (!urlPathname.startsWith(prefix)) {
    return null;
  }

  let relative = urlPathname.slice(prefix.length);
  if (relative === "" || relative === "/") {
    relative = "/index.html";
  }
  return relative.replace(/\\/g, "/");
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  const relativePath = toRelativePath(url.pathname);

  if (!relativePath) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  const filePath = path.join(distDir, relativePath);

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      const indexPath = path.join(filePath, "index.html");
      const body = await readFile(indexPath);
      res.setHeader("Content-Type", "text/html");
      res.end(body);
      return;
    }

    const body = await readFile(filePath);
    res.setHeader("Content-Type", contentType(filePath));
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
});

async function run() {
  const useLocalServer = liveUrl.trim() === "";
  if (useLocalServer) {
    await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(`[console.error] ${msg.text()}`);
    }
  });

  page.on("pageerror", (err) => {
    errors.push(`[pageerror] ${err.message}`);
  });

  const targetUrl = useLocalServer ? `http://127.0.0.1:${port}${prefix}/` : liveUrl;
  await page.goto(targetUrl, { waitUntil: "networkidle" });

  const hasLoadError = (await page.locator("text=Failed to Load FakerUI").count()) > 0;
  const title = await page.locator("h1").first().textContent();

  console.log(`URL: ${targetUrl}`);
  console.log(`TITLE: ${title || "N/A"}`);
  console.log(`HAS_LOAD_ERROR: ${hasLoadError}`);
  if (errors.length > 0) {
    console.log("BROWSER_ERRORS:");
    for (const error of errors) {
      console.log(error);
    }
  }

  await browser.close();
  if (useLocalServer) {
    await new Promise((resolve) => server.close(resolve));
  }

  if (hasLoadError) {
    process.exitCode = 1;
  }
}

run().catch(async (error) => {
  console.error(error);
  if (server.listening) {
    await new Promise((resolve) => server.close(resolve));
  }
  process.exitCode = 1;
});

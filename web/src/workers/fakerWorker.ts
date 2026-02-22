/// <reference lib="webworker" />

import type { WorkerRequest, WorkerResponse } from "../pyodide/protocol";

interface InitState {
  whitelist: Set<string>;
  fakerVersion: string;
  pluginPacks: Array<{ name: string; version: string; python_package?: string }>;
  basePath: string;
}

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

let pyodide: any = null;
let initState: InitState | null = null;
let runtimeReady = false;

const METHOD_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const CHUNK_SIZE = 250;

function normalizeBasePath(basePath: string): string {
  if (!basePath) {
    return "/";
  }
  return basePath.endsWith("/") ? basePath : `${basePath}/`;
}

function scopedUrl(relativePath: string): string {
  const basePath = initState ? initState.basePath : "/";
  const baseUrl = new URL(basePath, self.location.origin);
  const normalizedPath = relativePath.replace(/^\/+/, "");
  return new URL(normalizedPath, baseUrl).toString();
}

async function loadPyodideRuntime(): Promise<any> {
  if (pyodide) {
    return pyodide;
  }

  const moduleUrl = scopedUrl("pyodide/runtime/pyodide.mjs");
  const pyodideModule = (await import(/* @vite-ignore */ moduleUrl)) as {
    loadPyodide: (options: { indexURL: string }) => Promise<any>;
  };

  pyodide = await pyodideModule.loadPyodide({ indexURL: scopedUrl("pyodide/runtime/") });
  await pyodide.loadPackage("micropip");
  return pyodide;
}

async function installPythonPackages(runtime: any, state: InitState): Promise<void> {
  const micropip = runtime.pyimport("micropip");

  let packageSpecs: string[] = [
    `faker==${state.fakerVersion}`,
    ...state.pluginPacks
      .filter((pack) => Boolean(pack.python_package))
      .map((pack) => `${pack.python_package}==${pack.version}`)
  ];

  try {
    const wheelManifestResponse = await fetch(scopedUrl("pyodide/wheels/manifest.json"), { cache: "no-store" });
    if (wheelManifestResponse.ok) {
      const wheelManifest = (await wheelManifestResponse.json()) as { paths?: string[] };
      if (Array.isArray(wheelManifest.paths) && wheelManifest.paths.length > 0) {
        packageSpecs = wheelManifest.paths.map((path) =>
          /^https?:\/\//i.test(path) ? path : scopedUrl(path)
        );
      }
    }
  } catch {
    // Keep fallback package specs; first-load online install still works.
  }

  for (const spec of packageSpecs) {
    await micropip.install(spec);
  }
}

async function bootstrapPython(runtime: any, whitelist: string[]): Promise<void> {
  const bootstrapCode = `
import json
import re
import socket
from faker import Faker

_ALLOWED_METHODS = set()


def _network_block(*args, **kwargs):
    raise RuntimeError("Network access is disabled in FakerUI runtime")

# Best-effort network sandbox in Python runtime.
socket.socket = _network_block


def fakerui_configure_whitelist(method_names):
    global _ALLOWED_METHODS
    _ALLOWED_METHODS = set(method_names)


def _validate_method(method_name):
    if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", method_name):
        raise ValueError("Invalid method name")
    if method_name not in _ALLOWED_METHODS:
        raise ValueError(f"Method not allowed: {method_name}")


def _parse_kwargs(kwargs_json):
    if kwargs_json is None or kwargs_json == "":
        return {}
    parsed = json.loads(kwargs_json)
    if not isinstance(parsed, dict):
        raise ValueError("kwargs JSON must decode to an object")
    return parsed


def fakerui_generate(method_name, locale, count, seed, use_unique, kwargs_json):
    _validate_method(method_name)
    kwargs = _parse_kwargs(kwargs_json)

    fake = Faker(locale if locale else None)
    if seed is not None:
        fake.seed_instance(int(seed))

    target = fake.unique if use_unique else fake
    formatter = getattr(target, method_name)

    output = []
    for _ in range(int(count)):
        output.append(formatter(**kwargs))

    return output


def fakerui_schema(fields_json, locale, count, seed):
    fields = json.loads(fields_json)
    if not isinstance(fields, list):
        raise ValueError("fields must be a list")

    fake = Faker(locale if locale else None)
    if seed is not None:
        fake.seed_instance(int(seed))

    rows = []
    for _ in range(int(count)):
        row = {}
        for field in fields:
            field_name = field.get("name")
            method_name = field.get("method")
            kwargs = field.get("kwargs", {}) or {}

            if not isinstance(field_name, str) or not field_name:
                raise ValueError("Each field requires a non-empty name")
            if not isinstance(kwargs, dict):
                raise ValueError(f"Field kwargs must be object for {field_name}")

            _validate_method(method_name)
            row[field_name] = getattr(fake, method_name)(**kwargs)

        rows.append(row)

    return rows
`;

  await runtime.runPythonAsync(bootstrapCode);
  const configure = runtime.globals.get("fakerui_configure_whitelist");
  try {
    configure(whitelist);
  } finally {
    configure.destroy?.();
  }
}

async function ensureRuntimeReady(): Promise<void> {
  if (runtimeReady || !initState) {
    return;
  }

  const runtime = await loadPyodideRuntime();
  await installPythonPackages(runtime, initState);
  await bootstrapPython(runtime, Array.from(initState.whitelist));
  runtimeReady = true;
}

function postResponse(response: WorkerResponse): void {
  ctx.postMessage(response);
}

function assertValidCount(count: number): void {
  if (!Number.isInteger(count) || count < 1 || count > 5000) {
    throw new Error("count must be an integer between 1 and 5000");
  }
}

function assertAllowedMethod(method: string): void {
  if (!initState) {
    throw new Error("Worker is not initialized");
  }

  if (!METHOD_PATTERN.test(method)) {
    throw new Error("Invalid method name");
  }

  if (!initState.whitelist.has(method)) {
    throw new Error(`Method is not whitelisted: ${method}`);
  }
}

function toJsValue(proxy: any): any {
  if (!proxy) {
    return proxy;
  }

  if (typeof proxy.toJs === "function") {
    const value = proxy.toJs({ dict_converter: Object.fromEntries });
    proxy.destroy?.();
    return value;
  }

  return proxy;
}

function callPythonGenerate(args: {
  method: string;
  locale: string;
  count: number;
  seed: number | null;
  unique: boolean;
  kwargs: Record<string, unknown>;
}): unknown[] {
  const fn = pyodide.globals.get("fakerui_generate");
  try {
    const resultProxy = fn(
      args.method,
      args.locale,
      args.count,
      args.seed,
      args.unique,
      JSON.stringify(args.kwargs)
    );
    return toJsValue(resultProxy) as unknown[];
  } finally {
    fn.destroy?.();
  }
}

function callPythonSchema(args: {
  locale: string;
  count: number;
  seed: number | null;
  fields: Array<{ name: string; method: string; kwargs: Record<string, unknown> }>;
}): Record<string, unknown>[] {
  const fn = pyodide.globals.get("fakerui_schema");
  try {
    const resultProxy = fn(JSON.stringify(args.fields), args.locale, args.count, args.seed);
    return toJsValue(resultProxy) as Record<string, unknown>[];
  } finally {
    fn.destroy?.();
  }
}

async function handleGenerate(request: Extract<WorkerRequest, { type: "generate" }>): Promise<void> {
  assertValidCount(request.count);
  assertAllowedMethod(request.method);
  await ensureRuntimeReady();

  if (request.unique || request.count <= CHUNK_SIZE) {
    const rows = callPythonGenerate({
      method: request.method,
      locale: request.locale,
      count: request.count,
      seed: request.seed,
      unique: request.unique,
      kwargs: request.kwargs
    });
    postResponse({ id: request.id, type: "progress", progress: 1 });
    postResponse({ id: request.id, type: "result", payload: rows });
    return;
  }

  const rows: unknown[] = [];
  let emitted = 0;

  while (emitted < request.count) {
    const chunk = Math.min(CHUNK_SIZE, request.count - emitted);
    const chunkSeed = request.seed === null ? null : request.seed + emitted;
    const chunkRows = callPythonGenerate({
      method: request.method,
      locale: request.locale,
      count: chunk,
      seed: chunkSeed,
      unique: false,
      kwargs: request.kwargs
    });

    rows.push(...chunkRows);
    emitted += chunk;
    postResponse({ id: request.id, type: "progress", progress: emitted / request.count });
  }

  postResponse({ id: request.id, type: "result", payload: rows });
}

async function handleSchema(request: Extract<WorkerRequest, { type: "schema" }>): Promise<void> {
  assertValidCount(request.count);
  for (const field of request.fields) {
    assertAllowedMethod(field.method);
    if (!field.name.trim()) {
      throw new Error("Schema field names cannot be empty");
    }
  }

  await ensureRuntimeReady();

  if (request.count <= CHUNK_SIZE) {
    const rows = callPythonSchema({
      locale: request.locale,
      count: request.count,
      seed: request.seed,
      fields: request.fields
    });
    postResponse({ id: request.id, type: "progress", progress: 1 });
    postResponse({ id: request.id, type: "result", payload: rows });
    return;
  }

  const rows: Record<string, unknown>[] = [];
  let emitted = 0;

  while (emitted < request.count) {
    const chunk = Math.min(CHUNK_SIZE, request.count - emitted);
    const chunkSeed = request.seed === null ? null : request.seed + emitted;
    const chunkRows = callPythonSchema({
      locale: request.locale,
      count: chunk,
      seed: chunkSeed,
      fields: request.fields
    });

    rows.push(...chunkRows);
    emitted += chunk;
    postResponse({ id: request.id, type: "progress", progress: emitted / request.count });
  }

  postResponse({ id: request.id, type: "result", payload: rows });
}

ctx.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  try {
    if (request.type === "init") {
      initState = {
        whitelist: new Set(request.whitelist),
        fakerVersion: request.fakerVersion,
        pluginPacks: request.pluginPacks,
        basePath: normalizeBasePath(request.basePath)
      };

      await ensureRuntimeReady();
      postResponse({
        id: request.id,
        type: "ready",
        whitelistCount: initState.whitelist.size
      });
      return;
    }

    if (request.type === "list") {
      const whitelist = initState ? Array.from(initState.whitelist).sort() : [];
      postResponse({ id: request.id, type: "result", payload: whitelist });
      return;
    }

    if (!initState) {
      throw new Error("Worker must be initialized before generation");
    }

    if (request.type === "generate") {
      await handleGenerate(request);
      return;
    }

    if (request.type === "schema") {
      await handleSchema(request);
      return;
    }
  } catch (error) {
    postResponse({
      id: request.id,
      type: "error",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

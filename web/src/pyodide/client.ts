import type { GenerateOptions, SchemaOptions } from "../lib/types";
import type { WorkerRequest, WorkerResponse } from "./protocol";

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

class FakerRuntimeClient {
  private worker: Worker | null = null;
  private requestCounter = 0;
  private pending = new Map<string, PendingRequest>();
  private initPromise: Promise<void> | null = null;

  private ensureWorker(): Worker {
    if (this.worker) {
      return this.worker;
    }

    this.worker = new Worker(new URL("../workers/fakerWorker.ts", import.meta.url), { type: "module" });
    this.worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
      this.handleMessage(event.data);
    });
    this.worker.addEventListener("error", (event) => {
      console.error("Worker error", event.error || event.message);
    });

    return this.worker;
  }

  private handleMessage(message: WorkerResponse): void {
    const pending = this.pending.get(message.id);
    if (!pending) {
      return;
    }

    if (message.type === "progress") {
      pending.onProgress?.(message.progress);
      return;
    }

    if (message.type === "error") {
      this.pending.delete(message.id);
      pending.reject(new Error(message.error));
      return;
    }

    this.pending.delete(message.id);
    if (message.type === "ready") {
      pending.resolve(message);
      return;
    }

    pending.resolve(message.payload);
  }

  private callWorker(request: WorkerRequest, onProgress?: (progress: number) => void): Promise<unknown> {
    const worker = this.ensureWorker();

    return new Promise<unknown>((resolve, reject) => {
      this.pending.set(request.id, { resolve, reject, onProgress });
      worker.postMessage(request);
    });
  }

  async init(options: {
    whitelist: string[];
    fakerVersion: string;
    pyodideVersion: string;
    pluginPacks: Array<{ name: string; version: string; python_package?: string }>;
    basePath: string;
  }): Promise<void> {
    if (!this.initPromise) {
      const id = `init-${++this.requestCounter}`;
      const request: WorkerRequest = {
        id,
        type: "init",
        whitelist: options.whitelist,
        fakerVersion: options.fakerVersion,
        pyodideVersion: options.pyodideVersion,
        pluginPacks: options.pluginPacks,
        basePath: options.basePath
      };
      this.initPromise = this.callWorker(request).then(() => undefined);
    }

    await this.initPromise;
  }

  async listAllowedMethods(): Promise<string[]> {
    const id = `list-${++this.requestCounter}`;
    const response = await this.callWorker({ id, type: "list" });
    return response as string[];
  }

  async generate(options: GenerateOptions): Promise<unknown[]> {
    const id = `generate-${++this.requestCounter}`;
    const request: WorkerRequest = {
      id,
      type: "generate",
      method: options.method,
      locale: options.locale,
      count: options.count,
      seed: options.seed,
      unique: options.unique,
      kwargs: options.kwargs
    };
    const response = await this.callWorker(request, options.onProgress);
    return response as unknown[];
  }

  async generateSchema(options: SchemaOptions): Promise<Record<string, unknown>[]> {
    const id = `schema-${++this.requestCounter}`;
    const request: WorkerRequest = {
      id,
      type: "schema",
      locale: options.locale,
      count: options.count,
      seed: options.seed,
      fields: options.fields
    };
    const response = await this.callWorker(request, options.onProgress);
    return response as Record<string, unknown>[];
  }
}

export const fakerRuntimeClient = new FakerRuntimeClient();

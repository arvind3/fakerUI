export type WorkerRequest =
  | {
      id: string;
      type: "init";
      whitelist: string[];
      fakerVersion: string;
      pyodideVersion: string;
      pluginPacks: Array<{ name: string; version: string; python_package?: string }>;
      basePath: string;
    }
  | {
      id: string;
      type: "generate";
      method: string;
      locale: string;
      count: number;
      seed: number | null;
      unique: boolean;
      kwargs: Record<string, unknown>;
    }
  | {
      id: string;
      type: "schema";
      locale: string;
      count: number;
      seed: number | null;
      fields: Array<{ name: string; method: string; kwargs: Record<string, unknown> }>;
    }
  | {
      id: string;
      type: "list";
    };

export type WorkerResponse =
  | {
      id: string;
      type: "ready";
      whitelistCount: number;
    }
  | {
      id: string;
      type: "result";
      payload: unknown;
    }
  | {
      id: string;
      type: "progress";
      progress: number;
    }
  | {
      id: string;
      type: "error";
      error: string;
    };

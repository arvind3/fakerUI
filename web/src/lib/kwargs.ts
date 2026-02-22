import type { ParameterMetadata } from "./types";

function parseBoolean(value: string): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export function coerceParameterValue(rawValue: string, parameter: ParameterMetadata): unknown {
  const value = rawValue.trim();
  if (value === "") {
    return undefined;
  }

  const annotation = (parameter.annotation || "").toLowerCase();
  const defaultValue = (parameter.default || "").toLowerCase();

  if (annotation.includes("bool") || defaultValue === "true" || defaultValue === "false") {
    const parsed = parseBoolean(value.toLowerCase());
    if (parsed !== null) {
      return parsed;
    }
  }

  if (annotation.includes("int")) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  if (annotation.includes("float")) {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  if ((value.startsWith("{") && value.endsWith("}")) || (value.startsWith("[") && value.endsWith("]"))) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
}

export function parseKwargsJson(value: string): { parsed: Record<string, unknown>; error: string | null } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { parsed: {}, error: null };
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
      return { parsed: {}, error: "Kwargs JSON must decode to an object." };
    }
    return { parsed: parsed as Record<string, unknown>, error: null };
  } catch (error) {
    return {
      parsed: {},
      error: error instanceof Error ? error.message : "Invalid JSON"
    };
  }
}

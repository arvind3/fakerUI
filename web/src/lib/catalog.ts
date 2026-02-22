import type { CatalogData, RuntimeManifest } from "./types";

function assetUrl(file: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const root = new URL(base, window.location.origin);
  return new URL(file, root).toString();
}

export async function loadCatalog(): Promise<CatalogData> {
  const response = await fetch(assetUrl("catalog.json"), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load catalog.json: ${response.status}`);
  }
  return (await response.json()) as CatalogData;
}

export async function loadRuntimeManifest(): Promise<RuntimeManifest | null> {
  const response = await fetch(assetUrl("runtime-manifest.json"), { cache: "no-store" });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as RuntimeManifest;
}

export function moduleGroupName(moduleName: string): string {
  const parts = moduleName.split(".");
  return parts.length >= 3 ? parts.slice(0, 3).join(".") : moduleName;
}

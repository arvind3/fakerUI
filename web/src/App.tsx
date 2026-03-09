import { useCallback, useEffect, useState } from "react";

import type { ActiveFormatter, CatalogData, RuntimeManifest, SchemaField } from "./lib/types";
import { loadCatalog, loadRuntimeManifest } from "./lib/catalog";
import { fakerRuntimeClient } from "./pyodide/client";
import { CatalogPage } from "./pages/CatalogPage";
import { CoveragePage } from "./pages/CoveragePage";
import { HomePage } from "./pages/HomePage";
import { SchemaBuilderPage } from "./pages/SchemaBuilderPage";
import { TemplatesPage } from "./pages/TemplatesPage";
import { TryPanel } from "./components/TryPanel";

type Page = "home" | "catalog" | "schema" | "coverage" | "templates";
type RuntimeState = "idle" | "loading" | "ready" | "error";

export default function App(): JSX.Element {
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [runtimeManifest, setRuntimeManifest] = useState<RuntimeManifest | null>(null);
  const [page, setPage] = useState<Page>("home");
  const [selectedFormatter, setSelectedFormatter] = useState<ActiveFormatter | null>(null);
  const [runtimeState, setRuntimeState] = useState<RuntimeState>("idle");
  const [error, setError] = useState<string | null>(null);

  // Catalog pre-filter: incremented to force remount when navigating from home
  const [catalogKey, setCatalogKey] = useState(0);
  const [catalogInitialQuery, setCatalogInitialQuery] = useState("");

  // Schema pre-fill from templates
  const [schemaInitialFields, setSchemaInitialFields] = useState<SchemaField[] | null>(null);
  const [schemaKey, setSchemaKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [loadedCatalog, loadedManifest] = await Promise.all([loadCatalog(), loadRuntimeManifest()]);
        if (!cancelled) {
          setCatalog(loadedCatalog);
          setRuntimeManifest(loadedManifest);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : String(loadError));
        }
      }
    };

    load().catch((unhandled) => {
      if (!cancelled) {
        setError(unhandled instanceof Error ? unhandled.message : String(unhandled));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const ensureRuntime = useCallback(async () => {
    if (!catalog) {
      throw new Error("Catalog is not loaded yet");
    }

    if (runtimeState === "ready") {
      return;
    }

    setRuntimeState("loading");
    try {
      await fakerRuntimeClient.init({
        whitelist: catalog.whitelist,
        fakerVersion: catalog.faker_version,
        pyodideVersion: catalog.pyodide_version,
        pluginPacks: catalog.plugin_packs,
        basePath: import.meta.env.BASE_URL
      });
      setRuntimeState("ready");
    } catch (runtimeError) {
      setRuntimeState("error");
      throw runtimeError;
    }
  }, [catalog, runtimeState]);

  const handleNavigateToCatalog = useCallback((query: string) => {
    setCatalogInitialQuery(query);
    setCatalogKey((k) => k + 1);
    setPage("catalog");
  }, []);

  const handleUseTemplate = useCallback((fields: SchemaField[]) => {
    setSchemaInitialFields(fields);
    setSchemaKey((k) => k + 1);
    setPage("schema");
  }, []);

  if (error) {
    return (
      <main className="app-shell">
        <section className="panel" role="alert" aria-live="assertive">
          <h1>Failed to Load Synthora</h1>
          <p>{error}</p>
          <p>
            Build catalog first with <code>python ../catalog_build/build_catalog.py</code>.
          </p>
        </section>
      </main>
    );
  }

  if (!catalog) {
    return (
      <main className="app-shell" aria-busy="true">
        <section className="panel loading-panel">
          <h1>Loading Synthora</h1>
          <p>Preparing providers and formatter metadata&hellip;</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell" id="main-content">
      <header className="app-header panel">
        <div className="app-header-brand">
          <button
            type="button"
            className="brand-btn"
            onClick={() => setPage("home")}
            aria-label="Synthora home"
          >
            <img
              src={`${import.meta.env.BASE_URL}brand/synthora-logo-horizontal.svg`}
              alt="Synthora"
              height="34"
              style={{ display: "block" }}
            />
          </button>
        </div>

        <nav className="top-nav" aria-label="Primary">
          <button
            type="button"
            className={page === "home" ? "active" : ""}
            onClick={() => setPage("home")}
            aria-current={page === "home" ? "page" : undefined}
          >
            Home
          </button>
          <button
            type="button"
            className={page === "catalog" ? "active" : ""}
            onClick={() => setPage("catalog")}
            aria-current={page === "catalog" ? "page" : undefined}
          >
            Explore
          </button>
          <button
            type="button"
            className={page === "schema" ? "active" : ""}
            onClick={() => setPage("schema")}
            aria-current={page === "schema" ? "page" : undefined}
          >
            Build Dataset
          </button>
          <button
            type="button"
            className={page === "templates" ? "active" : ""}
            onClick={() => setPage("templates")}
            aria-current={page === "templates" ? "page" : undefined}
          >
            Templates
          </button>
        </nav>

      </header>

      {page === "home" && (
        <HomePage
          onNavigateToCatalog={handleNavigateToCatalog}
          onNavigateToSchema={() => setPage("schema")}
        />
      )}

      {page === "catalog" && (
        <CatalogPage
          key={catalogKey}
          catalog={catalog}
          initialQuery={catalogInitialQuery}
          onTry={(formatter) => {
            setSelectedFormatter(formatter);
          }}
        />
      )}

      {page === "schema" && (
        <SchemaBuilderPage
          key={schemaKey}
          catalog={catalog}
          ensureRuntime={ensureRuntime}
          initialFields={schemaInitialFields ?? undefined}
        />
      )}

      {page === "templates" && <TemplatesPage onUseTemplate={handleUseTemplate} />}

      {page === "coverage" && <CoveragePage catalog={catalog} runtimeManifest={runtimeManifest} />}

      <TryPanel
        open={selectedFormatter !== null}
        formatter={selectedFormatter}
        locales={catalog.available_locales}
        ensureRuntime={ensureRuntime}
        onClose={() => setSelectedFormatter(null)}
      />
    </main>
  );
}

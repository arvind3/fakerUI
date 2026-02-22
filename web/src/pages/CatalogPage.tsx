import { useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";

import { moduleGroupName } from "../lib/catalog";
import type { ActiveFormatter, CatalogData, ProviderEntry } from "../lib/types";

const POPULAR_METHOD_NAMES = ["name", "email", "address", "sentence", "url", "date", "credit_card_number", "uuid4"];

interface CatalogPageProps {
  catalog: CatalogData;
  initialQuery?: string;
  onTry: (formatter: ActiveFormatter) => void;
}

interface SearchRecord {
  provider: ProviderEntry;
  searchText: string;
}

function groupLabel(groupName: string): string {
  const parts = groupName.split(".");
  const raw = parts[parts.length - 1] ?? groupName;
  return raw.charAt(0).toUpperCase() + raw.slice(1).replace(/_/g, " ");
}

export function CatalogPage({ catalog, initialQuery = "", onTry }: CatalogPageProps): JSX.Element {
  const [query, setQuery] = useState(initialQuery);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(catalog.providers[0]?.id ?? null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null);

  const formatterByName = useMemo(() => {
    const mapping = new Map<string, ActiveFormatter>();
    for (const formatter of catalog.active_formatters) {
      mapping.set(formatter.name, formatter);
    }
    return mapping;
  }, [catalog.active_formatters]);

  const popularFormatters = useMemo(() => {
    return POPULAR_METHOD_NAMES.flatMap((name) => {
      const f = formatterByName.get(name);
      return f ? [f] : [];
    });
  }, [formatterByName]);

  const records = useMemo<SearchRecord[]>(
    () =>
      catalog.providers.map((provider) => ({
        provider,
        searchText: `${provider.module} ${provider.class_name} ${provider.methods
          .map((method) => `${method.name} ${method.doc}`)
          .join(" ")}`
      })),
    [catalog.providers]
  );

  const fuse = useMemo(
    () =>
      new Fuse(records, {
        includeScore: true,
        threshold: 0.32,
        ignoreLocation: true,
        keys: ["searchText"]
      }),
    [records]
  );

  const searchFiltered = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return catalog.providers;
    return fuse.search(trimmed).map((result) => result.item.provider);
  }, [catalog.providers, fuse, query]);

  const availableGroups = useMemo(() => {
    const seen = new Set<string>();
    const groups: string[] = [];
    for (const provider of searchFiltered) {
      const g = moduleGroupName(provider.module);
      if (!seen.has(g)) {
        seen.add(g);
        groups.push(g);
      }
    }
    return groups.sort((a, b) => a.localeCompare(b));
  }, [searchFiltered]);

  const filteredProviders = useMemo(() => {
    if (!activeGroup) return searchFiltered;
    return searchFiltered.filter((p) => moduleGroupName(p.module) === activeGroup);
  }, [searchFiltered, activeGroup]);

  useEffect(() => {
    if (!selectedProviderId || !filteredProviders.some((provider) => provider.id === selectedProviderId)) {
      setSelectedProviderId(filteredProviders[0]?.id ?? null);
    }
  }, [filteredProviders, selectedProviderId]);

  useEffect(() => {
    if (activeGroup && !availableGroups.includes(activeGroup)) {
      setActiveGroup(null);
    }
  }, [availableGroups, activeGroup]);

  const groupedProviders = useMemo(() => {
    const groups = new Map<string, ProviderEntry[]>();
    for (const provider of filteredProviders) {
      const group = moduleGroupName(provider.module);
      const existing = groups.get(group) || [];
      existing.push(provider);
      groups.set(group, existing);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredProviders]);

  const selectedProvider = filteredProviders.find((provider) => provider.id === selectedProviderId) ?? null;

  return (
    <section aria-label="Explore" className="catalog-page-wrap">
      {/* 3-step guided indicator */}
      <div className="catalog-steps" aria-label="Steps to use Explore">
        <div className="catalog-step catalog-step--active">
          <span className="step-num">1</span>
          <span>Search or pick a category</span>
        </div>
        <span className="step-arrow" aria-hidden="true">›</span>
        <div className={`catalog-step${selectedProviderId ? " catalog-step--active" : ""}`}>
          <span className="step-num">2</span>
          <span>Choose a provider</span>
        </div>
        <span className="step-arrow" aria-hidden="true">›</span>
        <div className={`catalog-step${hoveredMethod ? " catalog-step--active" : ""}`}>
          <span className="step-num">3</span>
          <span>Click Try</span>
        </div>
      </div>

      {/* Search + category filter bar */}
      <div className="catalog-controls">
        <input
          id="catalog-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search methods — try: email, city, credit card, uuid…"
          aria-label="Search providers and methods"
          className="catalog-search-input"
        />
        {availableGroups.length > 1 && (
          <div className="filter-pills" role="group" aria-label="Filter by category">
            <button
              type="button"
              className={`filter-pill${!activeGroup ? " active" : ""}`}
              onClick={() => setActiveGroup(null)}
            >
              All
            </button>
            {availableGroups.map((g) => (
              <button
                key={g}
                type="button"
                className={`filter-pill${activeGroup === g ? " active" : ""}`}
                onClick={() => setActiveGroup(activeGroup === g ? null : g)}
                aria-pressed={activeGroup === g}
              >
                {groupLabel(g)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Two-panel viewport — both panels scroll independently */}
      <div className="catalog-viewport">
        <aside className="catalog-sidebar" aria-label="Providers list">
          <div className="provider-groups" role="tree" aria-label="Provider groups">
            {groupedProviders.map(([groupName, providers]) => (
              <section className="provider-group" key={groupName}>
                <h3>
                  {groupLabel(groupName)}{" "}
                  <span className="count">{providers.reduce((s, p) => s + p.methods.length, 0)}</span>
                </h3>
                {providers.map((provider) => (
                  <button
                    type="button"
                    key={provider.id}
                    className={provider.id === selectedProviderId ? "provider-link active" : "provider-link"}
                    onClick={() => setSelectedProviderId(provider.id)}
                    aria-current={provider.id === selectedProviderId ? "true" : undefined}
                  >
                    <span>{provider.class_name}</span>
                    <span className="count">{provider.methods.length}</span>
                  </button>
                ))}
              </section>
            ))}
          </div>
        </aside>

        <article className="catalog-main" aria-live="polite">
          {!query && !activeGroup && popularFormatters.length > 0 && (
            <section className="popular-section">
              <h3>Quick access</h3>
              <div className="popular-methods">
                {popularFormatters.map((formatter) => (
                  <button
                    key={formatter.name}
                    type="button"
                    className="method-quick-btn"
                    onClick={() => onTry(formatter)}
                    aria-label={`Try ${formatter.name}`}
                  >
                    {formatter.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          {!selectedProvider && <p className="muted">No provider matches your search.</p>}

          {selectedProvider && (
            <>
              <header className="provider-header">
                <p className="eyebrow">{selectedProvider.source}</p>
                <h2>{groupLabel(moduleGroupName(selectedProvider.module))}</h2>
                <p className="muted">{selectedProvider.description || "No provider description available."}</p>
              </header>

              <div className="method-card-grid">
                {selectedProvider.methods.map((method) => {
                  const formatter = formatterByName.get(method.name);
                  const paramCount = method.parameters?.length ?? 0;
                  return (
                    <div
                      key={`${selectedProvider.id}-${method.name}`}
                      className={`method-card${!formatter ? " method-card--disabled" : ""}`}
                      onMouseEnter={() => setHoveredMethod(method.name)}
                      onMouseLeave={() => setHoveredMethod(null)}
                    >
                      <div className="method-card-name">
                        <code>{method.name}()</code>
                      </div>
                      <p className="method-card-doc">{method.doc || "No docstring available."}</p>
                      <div className="method-card-footer">
                        <span className="method-card-params">
                          {paramCount === 0 ? "no params" : `${paramCount} param${paramCount !== 1 ? "s" : ""}`}
                        </span>
                        <button
                          type="button"
                          className="try-btn"
                          onClick={() => {
                            if (formatter) onTry(formatter);
                          }}
                          disabled={!formatter}
                          aria-label={`Try ${method.name}`}
                        >
                          Try →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </article>
      </div>
    </section>
  );
}

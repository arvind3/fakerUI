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

  // Apply fuzzy search first
  const searchFiltered = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return catalog.providers;
    }
    return fuse.search(trimmed).map((result) => result.item.provider);
  }, [catalog.providers, fuse, query]);

  // Derive available group names from search results (always show all groups matching the search)
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

  // Apply group filter
  const filteredProviders = useMemo(() => {
    if (!activeGroup) return searchFiltered;
    return searchFiltered.filter((p) => moduleGroupName(p.module) === activeGroup);
  }, [searchFiltered, activeGroup]);

  useEffect(() => {
    if (!selectedProviderId || !filteredProviders.some((provider) => provider.id === selectedProviderId)) {
      setSelectedProviderId(filteredProviders[0]?.id ?? null);
    }
  }, [filteredProviders, selectedProviderId]);

  // Reset active group when it's no longer in results
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
    <section className="catalog-grid panel" aria-label="Explore">
      <aside className="catalog-sidebar" aria-label="Providers list">
        <label htmlFor="catalog-search" className="field-label">
          Search providers and methods
        </label>
        <input
          id="catalog-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try: email city credit card uuid"
          aria-describedby="search-help"
        />
        <p id="search-help" className="muted">
          Fuzzy search across provider modules and method names.
        </p>

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

        <div className="provider-groups" role="tree" aria-label="Provider groups">
          {groupedProviders.map(([groupName, providers]) => (
            <section className="provider-group" key={groupName}>
              <h3>
                {groupLabel(groupName)} <span className="count">{providers.length}</span>
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
          <section className="popular-section panel">
            <h3>Popular methods</h3>
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

        {!selectedProvider && <p>No provider matches your search.</p>}

        {selectedProvider && (
          <>
            <header className="provider-header">
              <p className="eyebrow">{selectedProvider.source}</p>
              <h2>{selectedProvider.module}</h2>
              <p>{selectedProvider.description || "No provider description available."}</p>
              <p>
                <strong>Locale availability:</strong>{" "}
                {selectedProvider.locales_hint.length > 0
                  ? selectedProvider.locales_hint.join(", ")
                  : "Global / mixed locale support"}
              </p>
            </header>

            <div className="table-wrap">
              <table>
                <caption>Methods exposed by {selectedProvider.class_name}</caption>
                <thead>
                  <tr>
                    <th scope="col">Method</th>
                    <th scope="col">Signature</th>
                    <th scope="col">Summary</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProvider.methods.map((method) => {
                    const formatter = formatterByName.get(method.name);
                    return (
                      <tr key={`${selectedProvider.id}-${method.name}`}>
                        <td>
                          <code>{method.name}</code>
                        </td>
                        <td>
                          <code>{method.signature}</code>
                        </td>
                        <td>{method.doc || "No docstring summary."}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              if (formatter) {
                                onTry(formatter);
                              }
                            }}
                            disabled={!formatter}
                            aria-label={`Try ${method.name}`}
                          >
                            Try
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </article>
    </section>
  );
}

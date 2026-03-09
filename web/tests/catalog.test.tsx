import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "../src/App";

const mockCatalog = {
  schema_version: 1,
  generated_at: "2026-02-19T00:00:00Z",
  faker_version: "19.13.0",
  pyodide_version: "0.27.2",
  available_locales: ["en_US"],
  coverage_scope: {
    builtin: "Built-in providers (Faker v19.13.0)",
    plugin_packs: [],
    not_included: "Not included: arbitrary third-party/custom providers not bundled"
  },
  plugin_packs: [],
  providers: [
    {
      id: "faker.providers.person:Provider",
      module: "faker.providers.person",
      class_name: "Provider",
      source: "builtin",
      locales_hint: [],
      description: "Person provider",
      methods: [
        {
          name: "name",
          signature: "()",
          doc: "Generate name",
          parameters: []
        }
      ]
    }
  ],
  active_formatters: [
    {
      name: "name",
      provider_module: "faker.providers.person",
      provider_class: "Provider",
      source: "builtin",
      signature: "()",
      doc: "Generate name",
      parameters: []
    }
  ],
  whitelist: ["name"]
};

const mockManifest = {
  generated_at: "2026-02-19T00:00:00Z",
  faker_version: "19.13.0",
  pyodide_version: "0.27.2",
  plugin_packs: [],
  coverage_scope: mockCatalog.coverage_scope,
  whitelist_count: 1,
  provider_count: 1
};

const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
  const url = String(input);
  if (url.endsWith("/catalog.json")) {
    return new Response(JSON.stringify(mockCatalog), { status: 200 });
  }
  if (url.endsWith("/runtime-manifest.json")) {
    return new Response(JSON.stringify(mockManifest), { status: 200 });
  }
  return new Response("not found", { status: 404 });
});

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockClear();
});

describe("App", () => {
  it("renders catalog data from catalog.json", async () => {
    render(<App />);

    // Brand button is always visible
    expect(await screen.findByRole("button", { name: "Synthora home" })).toBeInTheDocument();

    // Navigate to Explore (Catalog) page
    const exploreBtn = await screen.findByRole("button", { name: /^Explore$/i });
    fireEvent.click(exploreBtn);

    // Catalog renders Try buttons for whitelisted methods (popular shortcut + table row)
    const tryBtns = await screen.findAllByRole("button", { name: "Try name" });
    expect(tryBtns.length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
  });
});

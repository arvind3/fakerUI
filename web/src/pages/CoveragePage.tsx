import type { CatalogData, RuntimeManifest } from "../lib/types";

interface CoveragePageProps {
  catalog: CatalogData;
  runtimeManifest: RuntimeManifest | null;
}

export function CoveragePage({ catalog, runtimeManifest }: CoveragePageProps): JSX.Element {
  const manifest = runtimeManifest || {
    generated_at: catalog.generated_at,
    faker_version: catalog.faker_version,
    pyodide_version: catalog.pyodide_version,
    plugin_packs: catalog.plugin_packs,
    coverage_scope: catalog.coverage_scope,
    whitelist_count: catalog.whitelist.length,
    provider_count: catalog.providers.length
  };

  return (
    <section className="panel coverage-page" aria-label="Coverage information">
      <header>
        <p className="eyebrow">Coverage and version policy</p>
        <h2>What "No Gaps" means here</h2>
      </header>

      <ul className="coverage-list">
        <li>
          <strong>{manifest.coverage_scope.builtin}</strong>
        </li>
        {manifest.coverage_scope.plugin_packs.map((pack) => (
          <li key={pack.name}>
            <strong>{pack.label}</strong>
          </li>
        ))}
        <li>
          <strong>{manifest.coverage_scope.not_included}</strong>
        </li>
      </ul>

      <section>
        <h3>Exact versions</h3>
        <table>
          <tbody>
            <tr>
              <th scope="row">Catalog generated at</th>
              <td>{manifest.generated_at}</td>
            </tr>
            <tr>
              <th scope="row">Faker pinned version</th>
              <td>{manifest.faker_version}</td>
            </tr>
            <tr>
              <th scope="row">Pyodide version</th>
              <td>{manifest.pyodide_version}</td>
            </tr>
            <tr>
              <th scope="row">Providers indexed</th>
              <td>{manifest.provider_count}</td>
            </tr>
            <tr>
              <th scope="row">Whitelisted callable methods</th>
              <td>{manifest.whitelist_count}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3>How coverage is enforced</h3>
        <ol>
          <li>Build-time Python introspection emits a complete `catalog.json` for the pinned Faker version.</li>
          <li>Runtime only allows methods present in catalog `whitelist`.</li>
          <li>Pyodide generation runs entirely in-browser and does not require external APIs.</li>
        </ol>
      </section>

      <section>
        <h3>Limitations</h3>
        <ul>
          <li>Custom third-party providers are excluded unless bundled through `plugin_packs/manifest.json`.</li>
          <li>Parameter inference is best-effort from Python signatures and docstrings.</li>
          <li>Advanced kwargs are user-provided JSON and validated as objects only.</li>
        </ul>
      </section>
    </section>
  );
}

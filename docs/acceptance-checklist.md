# Acceptance Checklist

Use this checklist before tagging a release or announcing a public demo.

## 1) Environment and Build Inputs

- [ ] `versions.lock.json` pins Faker and Pyodide versions.
- [ ] `plugin_packs/manifest.json` and `versions.lock.json` agree on enabled plugin packs.
- [ ] Python and Node versions meet project requirements.

## 2) Catalog and Runtime Asset Generation

- [ ] `python catalog_build/build_catalog.py` succeeds.
- [ ] `web/public/catalog.json` and `web/public/runtime-manifest.json` are generated.
- [ ] `cd web && npm run pyodide:fetch` succeeds.
- [ ] `cd web && npm run wheels:fetch` succeeds.
- [ ] `cd web && npm run build` passes asset verification (`npm run verify:assets`).

## 3) Coverage Integrity ("No Gaps" for Bundled Scope)

- [ ] `python -m pytest catalog_build/tests -q` passes.
- [ ] Catalog `whitelist` exactly matches active runtime formatter names.
- [ ] Coverage page displays built-in providers label with exact Faker version.
- [ ] Coverage page displays plugin pack labels with version.
- [ ] Coverage page displays out-of-scope disclaimer for unbundled custom providers.

## 4) Core User Journeys

- [ ] Home page hero displays dark Midnight background with white Synthora logo, Instrument Serif headline, sub-line, and single "Explore the Product →" CTA.
- [ ] Header shows Synthora logo (min 34px height) without a runtime status badge.
- [ ] All pages align to 1100px max-width grid with consistent 40px horizontal padding.
- [ ] Template cards display with 32px (2rem) internal padding.
- [ ] Templates page lists "Retail Industry" (capital I) section.
- [ ] Catalog search returns expected providers/methods for common queries.
- [ ] Try panel can generate output with locale, count, and seed.
- [ ] Try panel can export JSON and CSV.
- [ ] Schema Builder can generate multi-field datasets.
- [ ] Schema Builder export works for JSON and CSV.

## 5) Safety and Guardrails

- [ ] Worker rejects non-whitelisted methods.
- [ ] Invalid kwargs JSON is blocked with a clear validation message.
- [ ] Runtime does not require any backend API for generation.

## 6) Offline and Performance Behavior

- [ ] Service worker registers successfully.
- [ ] App works after reload in offline mode once assets are cached.
- [ ] Pyodide runtime loads lazily (not at initial page render).
- [ ] Large count generation shows progress and keeps UI responsive.

## 7) Automated Quality Gates

- [ ] `python -m pytest catalog_build/tests -q` passes in CI.
- [ ] `cd web && npm run test` passes in CI.
- [ ] `cd web && npm run e2e` passes or is explicitly marked non-blocking with rationale.
- [ ] GitHub Pages workflow completes successfully.

## 8) Release and Product Readiness

- [ ] README is up to date with current setup and usage instructions.
- [ ] Coverage policy and limitations are documented in `docs/coverage-policy.md`.
- [ ] Release/versioning notes are updated in `docs/release-versioning.md`.
- [ ] Product copy is aligned with actual scope and maturity (no overclaiming).

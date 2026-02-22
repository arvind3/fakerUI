# FakerUI

Create realistic test data in the browser with a complete, searchable Faker catalog for a pinned version.

FakerUI is a static GitHub Pages product that combines:
- build-time Python introspection (truthful coverage metadata)
- in-browser Faker generation via Pyodide (no backend)
- optional plugin packs (explicitly labeled)

Live site: https://arvind3.github.io/fakerUI/
Repository: https://github.com/arvind3/fakerUI

## Product Status

Current status: developer-grade product.

- Core functionality is stable and covered by tests.
- Security and offline behavior are implemented.
- UI/UX is functional but not yet production-polished for a customer-facing launch.

If you need polished design systems, deeper onboarding UX, and enterprise-grade observability, treat this as a strong foundation rather than a finished product.

## Who This Is For

- QA and engineers who need realistic sample data quickly
- product teams building demos, tests, and mock datasets
- non-technical users using the Schema Builder for CSV/JSON exports

## What You Can Do

- Browse all bundled Faker providers/methods for a pinned version
- Fuzzy-search methods and provider modules
- Generate sample data per method (locale, count, seed, unique mode, kwargs)
- Build table-like datasets with multiple faker fields (Schema Builder)
- Export results as JSON/CSV
- Work offline after first load (service worker cache)

## Coverage Model ("No Gaps")

In this project, "no gaps" means:

- all built-in formatters for the pinned Faker version are cataloged
- all enabled plugin pack formatters are cataloged
- runtime only allows calling methods in that generated whitelist

Scope labels shown in UI:
- Built-in providers (Faker vX.Y.Z)
- Plugin Pack: name + version
- Not included: arbitrary third-party/custom providers not bundled

See `docs/coverage-policy.md` for full policy details.

## Architecture At A Glance

1. `catalog_build/build_catalog.py` introspects Faker + enabled packs and writes:
   - `web/public/catalog.json`
   - `web/public/runtime-manifest.json`
2. React app (`web/`) renders Catalog, Try Panel, Schema Builder, Coverage page.
3. Web worker (`web/src/workers/fakerWorker.ts`) lazy-loads Pyodide and runs generation safely.
4. Service worker (`web/public/sw.js`) caches app + catalog + runtime assets for offline use.

## Quick Start (Windows PowerShell)

Prerequisites:
- Python 3.12+ (`python --version`)
- Node.js 20+ (`node --version`)

From repo root:

```powershell
python -m pip install -r catalog_build/requirements.txt
python catalog_build/build_catalog.py

cd web
npm install
npm run pyodide:fetch
npm run wheels:fetch
npm run dev
```

Then open the local URL printed by Vite (usually `http://127.0.0.1:5173/`).

## Quick Start (macOS/Linux)

From repo root:

```bash
python3 -m pip install -r catalog_build/requirements.txt
python3 catalog_build/build_catalog.py

cd web
npm install
npm run pyodide:fetch
npm run wheels:fetch
npm run dev
```

## Standard Dev Workflow

When changing Faker version, plugin packs, or runtime logic:

```bash
# repo root
python catalog_build/build_catalog.py

# web/
npm run pyodide:fetch
npm run wheels:fetch
npm run build
```

Build is intentionally blocked if required generated assets are missing.

## Testing

From repo root:

```bash
# Python catalog tests
python -m pytest catalog_build/tests -q
```

From `web/`:

```bash
# Unit tests
npm run test

# E2E smoke test
npx playwright install chromium
npm run e2e
```

Live deployment smoke check:

```bash
cd web
npm run live:check
```

Override live URL:

PowerShell:
```powershell
$env:LIVE_URL = "https://<username>.github.io/<repo>/"
npm run live:check
```

Bash:
```bash
LIVE_URL="https://<username>.github.io/<repo>/" npm run live:check
```

## Deploy (GitHub Pages)

Deployment is automated by `.github/workflows/pages.yml` on push to `main`/`master`.

Pipeline:
- install Python + Node dependencies
- build catalog
- run Python tests + frontend tests
- fetch Pyodide runtime + wheels
- build `web/dist`
- deploy Pages artifact

`VITE_BASE_PATH` is set automatically for project-site routing.

## Security and Safety

- strict method whitelist derived from generated catalog
- regex validation of method names
- kwargs must be valid JSON object
- no `eval` of arbitrary Python in UI path
- best-effort network blocking in Python runtime
- no backend API required for generation

## Repository Structure

- `catalog_build/`: build-time catalog + wheel tooling + Python tests
- `plugin_packs/`: plugin manifest (enabled/disabled packs)
- `versions.lock.json`: pinned Faker/Pyodide/plugin versions
- `web/src/`: React UI + worker client/runtime bridge
- `web/public/sw.js`: offline caching service worker
- `web/e2e/`: Playwright smoke tests
- `docs/`: policy, release notes, product copy, acceptance checklist

## Troubleshooting

### `python` opens Microsoft Store or is not found

- Disable Windows App Execution Aliases for `python.exe` and `python3.exe`, or
- use full path to Python, or
- ensure installed Python is before `WindowsApps` in `PATH`.

### `npm run build` fails with missing static assets

Run:

```bash
python catalog_build/build_catalog.py
cd web
npm run pyodide:fetch
npm run wheels:fetch
```

### First load feels slow

Expected. Pyodide and wheel assets are large and only fetched once, then cached by service worker.

### Live site loads but shows "Failed to Load FakerUI"

Usually means catalog/runtime assets were not generated before build/deploy.

## Product Documentation

- Coverage policy: `docs/coverage-policy.md`
- Acceptance checklist: `docs/acceptance-checklist.md`
- Release/versioning notes: `docs/release-versioning.md`
- Product copy snippets: `docs/product-copy.md`

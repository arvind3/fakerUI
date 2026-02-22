# Contributing

## Development setup

1. Install Python deps: `python -m pip install -r catalog_build/requirements.txt`
2. Install web deps: `cd web && npm install`
3. Build catalog: `python catalog_build/build_catalog.py`
4. Fetch runtime assets: `cd web && npm run pyodide:fetch && npm run wheels:fetch`

## Add or update a plugin pack

1. Edit `plugin_packs/manifest.json` and add a pack entry:
- `name`
- `python_package`
- `version`
- `provider_modules`
- `enabled`
2. Mirror pinning in `versions.lock.json` under `plugin_packs`.
3. Install package in your Python environment and rebuild catalog.
4. Run tests:
- `pytest catalog_build/tests`
- `cd web && npm run test`
5. If enabled pack changed runtime deps, refresh wheels:
- `cd web && npm run wheels:fetch`

## Pull request checklist

- [ ] Catalog builds successfully
- [ ] Python tests pass
- [ ] Frontend tests pass
- [ ] E2E smoke passes
- [ ] Coverage labels updated when pack scope changes
- [ ] Docs updated (`README.md`, `docs/coverage-policy.md`)

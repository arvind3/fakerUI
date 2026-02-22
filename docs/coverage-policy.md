# Coverage Policy

"No gaps" in this project has a specific, testable definition:

1. Every active formatter in the pinned Faker version appears in `catalog.json`.
2. Every enabled plugin pack formatter appears in `catalog.json`.
3. Runtime generation only permits methods present in catalog `whitelist`.

## In scope

- Built-in providers for pinned Faker version from `versions.lock.json`.
- Providers from plugin packs marked `enabled: true` and bundled in this repo.

## Out of scope

- Arbitrary third-party/custom providers that are not bundled as enabled plugin packs.

## Enforcement points

- Build-time: `catalog_build/build_catalog.py`
- Tests: `catalog_build/tests/test_catalog_build.py`
- Runtime guard: `web/src/workers/fakerWorker.ts`
- User-facing disclosure: `web/src/pages/CoveragePage.tsx`

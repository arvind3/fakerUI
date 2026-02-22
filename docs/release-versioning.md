# Release and Versioning Notes

- Pin Faker, Pyodide, and plugin pack versions in `versions.lock.json`.
- Any version bump requires:
1. Rebuild catalog
2. Refresh wheels and Pyodide runtime assets
3. Run Python + frontend + E2E tests
4. Update release notes entry

## Suggested release cadence

- Patch: bug fixes, UI improvements, test updates
- Minor: new plugin pack support, schema builder UX updates
- Major: breaking catalog schema or runtime protocol changes

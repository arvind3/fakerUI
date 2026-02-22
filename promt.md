You are a senior full-stack engineer + DevEx architect. Create a production-grade GitHub Pages app that provides a “Full Feature UI with No Gaps” experience for the Python Faker library using a HYBRID approach:

GOAL (Hybrid, best UX + most truthful “no gaps” claim)
1) Static catalog UI generated via Python introspection at build time (guaranteed complete list for the pinned Faker version + any bundled plugin packs).
2) Interactive generator in the browser using Pyodide (runs Faker in WASM; can generate data live).
3) Optional “plugin packs” (pre-bundled community providers) to broaden coverage while staying honest about what’s included.

NON-NEGOTIABLE REQUIREMENTS
- Must be deployable on GitHub Pages (static hosting).
- Must be “no gaps” for:
  - All built-in Faker providers/methods for a pinned Faker version
  - Any included plugin packs bundled into the build
- Must clearly label coverage scope in the UI:
  - “Built-in providers (Faker vX.Y.Z)”
  - “Plugin Pack: <name> (version list)”
  - “Not included: arbitrary third-party/custom providers not bundled”
- Must work fully offline after first load (cache assets via service worker).
- Must be accessible (keyboard navigation, ARIA, high-contrast support).
- Must be safe: no external API calls required to generate data; everything runs in-browser.

USER EXPERIENCE REQUIREMENTS (UI)
A) Home / Catalog
- Search bar (instant, fuzzy) across provider names + method names.
- Left nav: Providers grouped by module; show counts (#methods).
- Main panel: Provider details:
  - provider name, locale availability (if detectable), short description
  - table of methods with:
    - method name
    - signature/parameters (best-effort)
    - docstring summary (first line)
    - “Try” button
B) Method Try Panel (Interactive)
- When user clicks “Try”, open a panel to:
  - choose locale (dropdown)
  - choose count (1..5000)
  - choose output format: Table / JSON / CSV
  - (advanced) seed input for deterministic output
  - (advanced) uniqueness toggle (best-effort using faker.unique)
  - generate + preview + downloadge
- For methods with parameters:
  - auto-generate form fields from introspected signature when possible
  - fallback to a “raw Python kwargs JSON” input with validation + examples
C) Schema Builder
- Allow non-technical users to create a dataset:
  - Add fields: <field name> + select Faker method
  - set per-field options/kwargs
  - set row count, locale, seed
  - generate dataset and download (CSV/JSON)
D) Coverage / About page
- Show exact versions:
  - Faker version pinned for catalog + runtime
  - Pyodide version
  - plugin pack versions
- Show how “no gaps” is achieved (introspection at build + runtime)
- Show limitations clearly

TECHNICAL REQUIREMENTS (Architecture)
- Repo structure must include:
  1) `catalog_build/` Python scripts that introspect Faker and produce `public/catalog.json`
     - catalog must include: provider modules, provider classes, method names, signatures, docstrings (first line), parameter metadata when possible
  2) `web/` front-end app (React + Vite preferred OR vanilla if simpler) that renders from `catalog.json`
  3) `web/pyodide/` runtime loader that:
     - loads Pyodide
     - installs Faker into Pyodide environment (prefer offline wheel bundling or pyodide packages)
     - exposes a JS API for:
       - list providers/methods (for validation)
       - generate values (method + locale + seed + kwargs + count)
       - schema generation (fields list)
  4) `plugin_packs/` mechanism:
     - define packs in a manifest file
     - during build, include additional providers in catalog + Pyodide environment
- Must pin versions in a lockfile/manifest.
- Must include unit tests:
  - Python: catalog generation tests (ensures every provider/method from Faker appears in catalog)
  - Frontend: basic tests for rendering catalog and generating output
  - E2E smoke test (Playwright) that builds site, loads, searches, generates sample output
- Must include GitHub Actions workflow:
  - build catalog
  - build frontend
  - run tests
  - deploy to GitHub Pages
- Must include performance work:
  - lazy load Pyodide only when user enters “Try” or “Generator”
  - use web workers for generation to keep UI responsive
  - show progress for large counts
- Must include caching:
  - service worker caching of catalog + app assets + pyodide assets
- Must include security:
  - sandbox Pyodide execution (no network)
  - input validation for kwargs JSON
  - avoid eval of arbitrary Python; only allow calling whitelisted Faker methods from catalog
- Must include good documentation:
  - README with local dev steps
  - CONTRIBUTING with how to add plugin packs
  - “Coverage policy”: what counts as “no gaps”
  - Release/versioning notes

DELIVERABLES
1) A complete file tree plan with explanations.
2) Key implementation code:
   - Python introspection script (catalog generator)
   - Frontend core pages/components (Catalog, TryPanel, SchemaBuilder)
   - Pyodide bridge (JS ↔ Python) with whitelisting
   - Service worker setup
3) GitHub Actions workflow YAML for Pages deployment.
4) A short “Product copy” for the site explaining what it does for non-technical users.
5) A checklist of acceptance criteria that prove “no gaps” for bundled providers.

CONSTRAINTS
- Keep it realistic for GitHub Pages: no server-side backend.
- If some Faker features cannot be parameterized safely, implement them as “advanced mode” with clear warnings.
- Prefer open-source libs that work well on Pages and are lightweight.

Now implement it: produce the repo plan and the actual code skeleton (not pseudo-code) for the critical parts so I can copy/paste into a repo and run.

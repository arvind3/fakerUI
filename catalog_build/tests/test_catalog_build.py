from __future__ import annotations

import sys
from pathlib import Path

from faker import Faker

ROOT = Path(__file__).resolve().parents[2]
CATALOG_BUILD_DIR = ROOT / "catalog_build"
if str(CATALOG_BUILD_DIR) not in sys.path:
    sys.path.insert(0, str(CATALOG_BUILD_DIR))

from build_catalog import DEFAULT_LOCK, DEFAULT_MANIFEST, add_plugin_providers, build_catalog, iter_provider_methods
from plugin_loader import enabled_packs, load_plugin_packs


def runtime_formatters() -> set[str]:
    fake = Faker()
    packs = enabled_packs(load_plugin_packs(DEFAULT_MANIFEST, DEFAULT_LOCK))
    add_plugin_providers(fake, packs)
    names: set[str] = set()
    for provider in fake.get_providers():
        for method_name, _ in iter_provider_methods(provider):
            if callable(getattr(fake, method_name, None)):
                names.add(method_name)
    return names


def test_catalog_has_no_gaps_for_runtime_formatters() -> None:
    catalog = build_catalog(DEFAULT_MANIFEST, DEFAULT_LOCK)
    catalog_formatters = {item["name"] for item in catalog["active_formatters"]}
    missing = runtime_formatters() - catalog_formatters
    assert not missing, f"Missing formatter names from catalog: {sorted(missing)}"


def test_whitelist_exactly_matches_active_formatters() -> None:
    catalog = build_catalog(DEFAULT_MANIFEST, DEFAULT_LOCK)
    whitelist = set(catalog["whitelist"])
    active = {item["name"] for item in catalog["active_formatters"]}
    assert whitelist == active


def test_whitelist_is_not_empty() -> None:
    catalog = build_catalog(DEFAULT_MANIFEST, DEFAULT_LOCK)
    assert len(catalog["whitelist"]) > 0


def test_every_provider_has_methods() -> None:
    catalog = build_catalog(DEFAULT_MANIFEST, DEFAULT_LOCK)
    providers_without_methods = [provider["module"] for provider in catalog["providers"] if not provider["methods"]]
    assert not providers_without_methods, f"Providers missing methods: {providers_without_methods}"

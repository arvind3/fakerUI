from __future__ import annotations

import argparse
import importlib
import inspect
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import faker as faker_pkg
from faker import Faker

from plugin_loader import PluginPack, enabled_packs, load_plugin_packs

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = REPO_ROOT / "plugin_packs" / "manifest.json"
DEFAULT_LOCK = REPO_ROOT / "versions.lock.json"
DEFAULT_OUTPUT = REPO_ROOT / "web" / "public" / "catalog.json"
DEFAULT_RUNTIME_MANIFEST = REPO_ROOT / "web" / "public" / "runtime-manifest.json"
LOCALE_PATTERN = re.compile(r"^[a-z]{2}(?:_[A-Z]{2})?$")


def read_versions(lock_path: Path) -> dict[str, Any]:
    if not lock_path.exists():
        return {}
    return json.loads(lock_path.read_text(encoding="utf-8"))


def provider_source(module_name: str, packs: list[PluginPack]) -> str:
    for pack in packs:
        for provider_module in pack.provider_modules:
            if module_name == provider_module or module_name.startswith(f"{provider_module}."):
                return f"plugin:{pack.name}"
    return "builtin"


def detect_locales_from_module(module_name: str) -> list[str]:
    locales = [segment for segment in module_name.split(".") if LOCALE_PATTERN.match(segment)]
    return sorted(set(locales))


def summarize_docstring(obj: Any) -> str:
    doc = inspect.getdoc(obj) or ""
    return doc.strip().splitlines()[0] if doc else ""


def serialize_annotation(annotation: Any) -> str | None:
    if annotation is inspect._empty:
        return None
    try:
        return str(annotation)
    except Exception:
        return None


def serialize_default(value: Any) -> str | None:
    if value is inspect._empty:
        return None
    try:
        return repr(value)
    except Exception:
        return None


def method_signature_metadata(callable_obj: Any) -> tuple[str, list[dict[str, Any]]]:
    try:
        signature = inspect.signature(callable_obj)
    except (TypeError, ValueError):
        return "()", []

    parameters: list[dict[str, Any]] = []
    for parameter in signature.parameters.values():
        if parameter.name == "self":
            continue
        parameters.append(
            {
                "name": parameter.name,
                "kind": str(parameter.kind),
                "required": parameter.default is inspect._empty,
                "default": serialize_default(parameter.default),
                "annotation": serialize_annotation(parameter.annotation),
            }
        )

    return str(signature), parameters


def iter_provider_methods(provider_instance: Any) -> list[tuple[str, Any]]:
    methods: list[tuple[str, Any]] = []
    seen: set[str] = set()

    for name, candidate in inspect.getmembers(provider_instance, predicate=callable):
        if name.startswith("_"):
            continue
        if name in seen:
            continue
        seen.add(name)
        methods.append((name, candidate))

    return methods


def add_plugin_providers(fake: Faker, packs: list[PluginPack]) -> None:
    for pack in packs:
        for provider_module in pack.provider_modules:
            module = importlib.import_module(provider_module)
            provider_class = getattr(module, "Provider", None)
            if provider_class is None:
                raise RuntimeError(
                    f"Plugin pack '{pack.name}' module '{provider_module}' does not export Provider"
                )
            fake.add_provider(provider_class)


def active_formatters(fake: Faker, packs: list[PluginPack]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    seen: set[str] = set()

    for provider in fake.get_providers():
        module_name = provider.__class__.__module__
        class_name = provider.__class__.__name__
        source = provider_source(module_name, packs)

        for method_name, _ in iter_provider_methods(provider):
            if method_name in seen:
                continue

            callable_obj = getattr(fake, method_name, None)
            if not callable(callable_obj):
                continue

            seen.add(method_name)
            signature, parameters = method_signature_metadata(callable_obj)
            items.append(
                {
                    "name": method_name,
                    "provider_module": module_name,
                    "provider_class": class_name,
                    "source": source,
                    "signature": signature,
                    "doc": summarize_docstring(callable_obj),
                    "parameters": parameters,
                }
            )

    items.sort(key=lambda item: item["name"])
    return items


def build_catalog(manifest_path: Path, lock_path: Path) -> dict[str, Any]:
    versions = read_versions(lock_path)
    all_packs = load_plugin_packs(manifest_path, lock_path)
    packs = enabled_packs(all_packs)

    fake = Faker()
    add_plugin_providers(fake, packs)

    providers_payload: list[dict[str, Any]] = []
    for provider in fake.get_providers():
        module_name = provider.__class__.__module__
        class_name = provider.__class__.__name__
        methods_payload: list[dict[str, Any]] = []

        for method_name, callable_obj in iter_provider_methods(provider):
            signature, parameters = method_signature_metadata(callable_obj)
            methods_payload.append(
                {
                    "name": method_name,
                    "signature": signature,
                    "doc": summarize_docstring(callable_obj),
                    "parameters": parameters,
                }
            )

        methods_payload.sort(key=lambda method: method["name"])

        providers_payload.append(
            {
                "id": f"{module_name}:{class_name}",
                "module": module_name,
                "class_name": class_name,
                "source": provider_source(module_name, packs),
                "locales_hint": detect_locales_from_module(module_name),
                "description": summarize_docstring(provider.__class__),
                "methods": methods_payload,
            }
        )

    providers_payload.sort(key=lambda provider: provider["module"])

    faker_version = getattr(faker_pkg, "__version__", versions.get("faker", "unknown"))
    pyodide_version = versions.get("pyodide", "unknown")

    active = active_formatters(fake, packs)

    return {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "faker_version": faker_version,
        "pyodide_version": pyodide_version,
        "available_locales": sorted(getattr(fake, "locales", []) or []),
        "coverage_scope": {
            "builtin": f"Built-in providers (Faker v{faker_version})",
            "plugin_packs": [
                {
                    "name": pack.name,
                    "version": pack.version,
                    "provider_modules": list(pack.provider_modules),
                    "label": f"Plugin Pack: {pack.name} ({pack.version})",
                }
                for pack in packs
            ],
            "not_included": "Not included: arbitrary third-party/custom providers not bundled",
        },
        "plugin_packs": [
            {
                "name": pack.name,
                "version": pack.version,
                "provider_modules": list(pack.provider_modules),
                "python_package": pack.python_package,
            }
            for pack in packs
        ],
        "providers": providers_payload,
        "active_formatters": active,
        "whitelist": sorted({item["name"] for item in active}),
    }


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=False), encoding="utf-8")


def build_runtime_manifest(catalog: dict[str, Any]) -> dict[str, Any]:
    return {
        "generated_at": catalog["generated_at"],
        "faker_version": catalog["faker_version"],
        "pyodide_version": catalog["pyodide_version"],
        "plugin_packs": catalog["plugin_packs"],
        "coverage_scope": catalog["coverage_scope"],
        "whitelist_count": len(catalog.get("whitelist", [])),
        "provider_count": len(catalog.get("providers", [])),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build Faker catalog for static UI and Pyodide runtime")
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--lock", type=Path, default=DEFAULT_LOCK)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--runtime-manifest", type=Path, default=DEFAULT_RUNTIME_MANIFEST)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    catalog = build_catalog(manifest_path=args.manifest, lock_path=args.lock)
    write_json(args.output, catalog)
    write_json(args.runtime_manifest, build_runtime_manifest(catalog))
    print(f"Wrote catalog: {args.output}")
    print(f"Wrote runtime manifest: {args.runtime_manifest}")


if __name__ == "__main__":
    main()

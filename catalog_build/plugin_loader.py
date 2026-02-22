from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class PluginPack:
    name: str
    version: str
    enabled: bool
    provider_modules: tuple[str, ...]
    python_package: str | None = None
    description: str = ""

    @property
    def package_spec(self) -> str | None:
        if not self.python_package:
            return None
        return f"{self.python_package}=={self.version}" if self.version else self.python_package


def _load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def load_plugin_packs(manifest_path: Path, lock_path: Path) -> list[PluginPack]:
    manifest_data = _load_json(manifest_path)
    lock_data = _load_json(lock_path)

    lock_index: dict[str, dict[str, Any]] = {
        item["name"]: item for item in lock_data.get("plugin_packs", []) if "name" in item
    }

    packs: list[PluginPack] = []
    for raw in manifest_data.get("packs", []):
        if "name" not in raw:
            continue

        lock_entry = lock_index.get(raw["name"], {})
        version = str(lock_entry.get("version", raw.get("version", ""))).strip()
        enabled = bool(lock_entry.get("enabled", raw.get("enabled", False)))
        provider_modules = tuple(lock_entry.get("provider_modules", raw.get("provider_modules", [])))
        python_package = lock_entry.get("python_package", raw.get("python_package"))

        packs.append(
            PluginPack(
                name=raw["name"],
                description=str(raw.get("description", "")),
                version=version,
                enabled=enabled,
                provider_modules=provider_modules,
                python_package=python_package,
            )
        )

    return packs


def enabled_packs(packs: list[PluginPack]) -> list[PluginPack]:
    return [pack for pack in packs if pack.enabled]

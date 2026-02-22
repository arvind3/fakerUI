from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

from plugin_loader import enabled_packs, load_plugin_packs

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_LOCK = REPO_ROOT / "versions.lock.json"
DEFAULT_MANIFEST = REPO_ROOT / "plugin_packs" / "manifest.json"
DEFAULT_DEST = REPO_ROOT / "web" / "public" / "pyodide" / "wheels"


def read_lock(lock_path: Path) -> dict:
    if not lock_path.exists():
        raise FileNotFoundError(f"Missing lock file: {lock_path}")
    return json.loads(lock_path.read_text(encoding="utf-8"))


def build_package_list(lock_data: dict, manifest_path: Path, lock_path: Path) -> list[str]:
    packages = [f"Faker=={lock_data['faker']}"]

    packs = enabled_packs(load_plugin_packs(manifest_path, lock_path))
    for pack in packs:
        if pack.package_spec:
            packages.append(pack.package_spec)

    return packages


def download_wheels(packages: list[str], destination: Path) -> list[str]:
    destination.mkdir(parents=True, exist_ok=True)

    cmd = [
        sys.executable,
        "-m",
        "pip",
        "download",
        "--only-binary=:all:",
        "--dest",
        str(destination),
        *packages,
    ]
    subprocess.run(cmd, check=True)

    wheels = sorted(path.name for path in destination.glob("*.whl"))
    if not wheels:
        raise RuntimeError("No wheels were downloaded")
    return wheels


def write_wheel_manifest(destination: Path, packages: list[str], wheels: list[str]) -> None:
    payload = {
        "packages": packages,
        "wheels": wheels,
        "paths": [f"pyodide/wheels/{wheel}" for wheel in wheels],
    }
    (destination / "manifest.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Download wheel bundle for Pyodide runtime")
    parser.add_argument("--lock", type=Path, default=DEFAULT_LOCK)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--dest", type=Path, default=DEFAULT_DEST)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    lock_data = read_lock(args.lock)
    packages = build_package_list(lock_data=lock_data, manifest_path=args.manifest, lock_path=args.lock)
    wheels = download_wheels(packages=packages, destination=args.dest)
    write_wheel_manifest(destination=args.dest, packages=packages, wheels=wheels)
    print(f"Downloaded {len(wheels)} wheels to {args.dest}")


if __name__ == "__main__":
    main()

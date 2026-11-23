#!/usr/bin/env python3
"""
Automated Google VPS (Ubuntu 24) Deployment Packager.
Packages the Call Center POC into a clean, ready-to-deploy archive excluding local temporary files.
"""
import os
import sys
import shutil
import tarfile
import zipfile
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = Path(__file__).resolve().parents[1]
DIST_DIR = ROOT_DIR / "dist" / "google_vps"
PACKAGE_TAR = DIST_DIR / "callcenter_google_vps.tar.gz"

EXCLUDE_PATTERNS = {
    "__pycache__",
    ".pytest_cache",
    ".git",
    "node_modules",
    ".next",
    ".dart_tool",
    ".idea",
    "build",
    "dist",
    "*.pyc",
    "*.pyo",
    "*.log",
    ".env.local",
    "Thumbs.db",
    ".DS_Store",
    "scratch",
    "output_test.mp3",
    "output_test.wav",
}

INCLUDE_PATHS = [
    "apps/web",
    "apps/mobile",
    "services/api",
    "infrastructure",
    "scripts",
    "docker-compose.yml",
    "docker-compose.prod.yml",
    "package.json",
    "package-lock.json",
    ".env.example",
    "README.md",
]


def should_exclude(rel_path: str) -> bool:
    parts = Path(rel_path).parts
    for part in parts:
        if part in EXCLUDE_PATTERNS:
            return True
        for pattern in EXCLUDE_PATTERNS:
            if pattern.startswith("*") and part.endswith(pattern[1:]):
                return True
    return False


def build_vps_package():
    print("=" * 70)
    print("🚀 Packaging AI Call Center POC for Google VPS (Ubuntu 24)")
    print("=" * 70)

    DIST_DIR.mkdir(parents=True, exist_ok=True)

    if PACKAGE_TAR.exists():
        PACKAGE_TAR.unlink()

    print(f"📦 Creating archive: {PACKAGE_TAR}...")

    with tarfile.open(PACKAGE_TAR, "w:gz") as tar:
        for item_name in INCLUDE_PATHS:
            item_path = ROOT_DIR / item_name
            if not item_path.exists():
                print(f"  ⚠️ Skipping missing item: {item_name}")
                continue

            if item_path.is_file():
                tar.add(item_path, arcname=item_name)
                print(f"  ✓ Added file: {item_name}")
            elif item_path.is_dir():
                print(f"  ✓ Adding directory: {item_name}...")
                for root, dirs, files in os.walk(item_path):
                    # Filter directories in-place to prevent traversing excluded ones
                    dirs[:] = [d for d in dirs if not should_exclude(d)]
                    for f in files:
                        file_full = Path(root) / f
                        rel_file = file_full.relative_to(ROOT_DIR)
                        if not should_exclude(str(rel_file)):
                            tar.add(file_full, arcname=str(rel_file).replace("\\", "/"))

    size_mb = PACKAGE_TAR.stat().st_size / (1024 * 1024)
    print("=" * 70)
    print(f"✅ Package ready: {PACKAGE_TAR} ({size_mb:.2f} MB)")
    print("=" * 70)


if __name__ == "__main__":
    build_vps_package()

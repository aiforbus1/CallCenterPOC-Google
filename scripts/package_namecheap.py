#!/usr/bin/env python3
"""
Automated Namecheap Deployment Packager for AI Call Center POC.
Builds a clean, production-ready ZIP archive for Namecheap cPanel ('Setup Python App')
and Namecheap VPS installations.
"""
import os
import sys
import shutil
import zipfile
from pathlib import Path

# Set UTF-8 stdout
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = Path(__file__).resolve().parents[1]
API_DIR = ROOT_DIR / "services" / "api"
DIST_DIR = ROOT_DIR / "dist" / "namecheap"
PACKAGE_ZIP = DIST_DIR / "callcenter_api_namecheap.zip"

EXCLUDE_PATTERNS = {
    "__pycache__",
    ".pytest_cache",
    ".git",
    ".gitignore",
    ".env",  # Don't include local dev .env with local secrets
    ".env.local",
    "tests",
    "scratch",
    "*.pyc",
    "*.pyo",
    "*.log",
    "Thumbs.db",
    ".DS_Store",
}


def should_exclude(path: Path) -> bool:
    for part in path.parts:
        if part in EXCLUDE_PATTERNS:
            return True
        for pattern in EXCLUDE_PATTERNS:
            if pattern.startswith("*") and part.endswith(pattern[1:]):
                return True
    return False


def create_migration_helper(staging_dir: Path):
    """Creates a convenient bash helper to run migrations and seed DB on Namecheap."""
    script_content = """#!/usr/bin/env bash
# ==============================================================================
# Helper Script to Run Database Migrations and Seed Initial Admin & 122 Settings
# ==============================================================================
set -e

echo "=== [1/2] Running Alembic Migrations to Latest Schema ==="
python -m alembic upgrade head

echo "=== [2/2] Seeding Database with Initial Admin & Police 122 Data ==="
python seed.py

echo "=== Database setup completed successfully! ==="
"""
    helper_path = staging_dir / "setup_db.sh"
    with open(helper_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(script_content)


def build_package():
    print("=" * 70)
    print("🚀 Packaging AI Call Center API for Namecheap Python Hosting")
    print("=" * 70)

    if not API_DIR.exists():
        print(f"❌ Error: API directory not found at {API_DIR}")
        sys.exit(1)

    # Clean and create dist directory
    DIST_DIR.mkdir(parents=True, exist_ok=True)

    staging_dir = DIST_DIR / "callcenter_api"
    if staging_dir.exists():
        shutil.rmtree(staging_dir, ignore_errors=True)
    staging_dir.mkdir(parents=True, exist_ok=True)

    print(f"📁 Staging files from {API_DIR}...")

    # Copy app/ directory
    shutil.copytree(
        API_DIR / "app",
        staging_dir / "app",
        ignore=shutil.ignore_patterns("__pycache__", "*.pyc", "*.pyo"),
    )

    # Copy migrations/ directory
    shutil.copytree(
        API_DIR / "migrations",
        staging_dir / "migrations",
        ignore=shutil.ignore_patterns("__pycache__", "*.pyc", "*.pyo"),
    )

    # Copy single files
    for filename in [
        "alembic.ini",
        "requirements.txt",
        "passenger_wsgi.py",
        ".htaccess",
        ".env.production.example",
    ]:
        src = API_DIR / filename
        if src.exists():
            shutil.copy2(src, staging_dir / filename)
            print(f"  ✓ Copied {filename}")
        else:
            print(f"  ⚠️ Warning: {filename} not found in {API_DIR}")

    # Copy seed script to root of package as seed.py for simple execution
    seed_src = ROOT_DIR / "scripts" / "seed.py"
    if seed_src.exists():
        shutil.copy2(seed_src, staging_dir / "seed.py")
        print("  ✓ Copied seed.py to package root")

    # Create setup_db.sh helper
    create_migration_helper(staging_dir)
    print("  ✓ Created setup_db.sh migration helper")

    # Build ZIP archive
    print(f"\n📦 Compressing into {PACKAGE_ZIP}...")
    with zipfile.ZipFile(PACKAGE_ZIP, "w", zipfile.ZIP_DEFLATED) as zipf:
        for file_path in staging_dir.rglob("*"):
            if not file_path.is_file():
                continue
            if should_exclude(file_path):
                continue
            rel_path = file_path.relative_to(staging_dir)
            zipf.write(file_path, arcname=rel_path)

    # Build TAR.GZ archive (natively reliable on Linux/cPanel)
    package_tar = DIST_DIR / "callcenter_api_namecheap.tar.gz"
    print(f"📦 Compressing into {package_tar}...")
    import tarfile
    with tarfile.open(package_tar, "w:gz") as tar:
        for item in staging_dir.iterdir():
            tar.add(item, arcname=item.name)

    # Copy to docs/
    docs_dir = ROOT_DIR / "docs"
    docs_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(PACKAGE_ZIP, docs_dir / "callcenter_api_namecheap.zip")
    shutil.copy2(package_tar, docs_dir / "callcenter_api_namecheap.tar.gz")

    # Calculate file size
    zip_size_kb = PACKAGE_ZIP.stat().st_size / 1024
    tar_size_kb = package_tar.stat().st_size / 1024
    print(f"✅ ZIP Package:    {PACKAGE_ZIP} ({zip_size_kb:.1f} KB)")
    print(f"✅ TAR.GZ Package: {package_tar} ({tar_size_kb:.1f} KB)")
    print("=" * 70)


if __name__ == "__main__":
    build_package()

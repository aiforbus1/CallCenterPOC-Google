#!/usr/bin/env python3
"""
Automated Web Management Portal Packager.
Exports Next.js frontend to static files and bundles it for deployment.
"""
import os
import shutil
import subprocess
import sys
import tarfile
import zipfile
from pathlib import Path

# Set UTF-8 stdout
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = Path(__file__).resolve().parents[1]
WEB_DIR = ROOT_DIR / "apps" / "web"
DIST_DIR = ROOT_DIR / "dist" / "namecheap"
PACKAGE_ZIP = DIST_DIR / "admin_portal_namecheap.zip"
PACKAGE_TAR = DIST_DIR / "admin_portal_namecheap.tar.gz"


def build_web_package():
    print("=" * 70)
    print("🚀 Packaging Web Management Console (Next.js)")
    print("=" * 70)

    if not WEB_DIR.exists():
        print(f"❌ Error: Web directory not found at {WEB_DIR}")
        sys.exit(1)

    out_dir = WEB_DIR / "out"

    # Check if rebuild requested or out/ missing
    rebuild = "--rebuild" in sys.argv or not out_dir.exists()
    if rebuild:
        print("⚙️ Running 'npm run build' to generate static export...")
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        result = subprocess.run([npm_cmd, "run", "build"], cwd=str(WEB_DIR))
        if result.returncode != 0:
            print("❌ Build failed!")
            sys.exit(1)

    # Ensure .htaccess is included in out
    htaccess_src = WEB_DIR / ".htaccess.namecheap"
    if htaccess_src.exists():
        shutil.copy2(htaccess_src, out_dir / ".htaccess")
        print("  ✓ Added .htaccess for Apache rewrite rules")

    DIST_DIR.mkdir(parents=True, exist_ok=True)

    print(f"\n📦 Compressing into {PACKAGE_ZIP}...")
    with zipfile.ZipFile(PACKAGE_ZIP, "w", zipfile.ZIP_DEFLATED) as zipf:
        for file_path in out_dir.rglob("*"):
            if not file_path.is_file():
                continue
            rel_path = file_path.relative_to(out_dir)
            zipf.write(file_path, arcname=rel_path)

    print(f"📦 Compressing into {PACKAGE_TAR}...")
    with tarfile.open(PACKAGE_TAR, "w:gz") as tar:
        for item in out_dir.iterdir():
            tar.add(item, arcname=item.name)

    # Copy to docs/
    docs_dir = ROOT_DIR / "docs"
    docs_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(PACKAGE_ZIP, docs_dir / "admin_portal_namecheap.zip")
    shutil.copy2(PACKAGE_TAR, docs_dir / "admin_portal_namecheap.tar.gz")

    zip_size_mb = PACKAGE_ZIP.stat().st_size / (1024 * 1024)
    print(f"✅ Web Portal ZIP:    {PACKAGE_ZIP} ({zip_size_mb:.2f} MB)")
    print("=" * 70)


if __name__ == "__main__":
    build_web_package()

#!/usr/bin/env python3
"""
Release Automation & Version Bump Script for AI Call Center POC.

Updates versions across:
- apps/web/package.json
- apps/mobile/pubspec.yaml
- services/api/app/main.py

Creates a git tag and prepares release for GitHub Actions automation.

Usage:
    python scripts/create_release.py --bump patch
    python scripts/create_release.py --version 1.1.0
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
API_MAIN = ROOT_DIR / "services" / "api" / "app" / "main.py"
WEB_PKG = ROOT_DIR / "apps" / "web" / "package.json"
MOBILE_PUBSPEC = ROOT_DIR / "apps" / "mobile" / "pubspec.yaml"


def get_current_version() -> str:
    if WEB_PKG.exists():
        with open(WEB_PKG, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("version", "1.0.0")
    return "1.0.0"


def bump_semver(current: str, part: str) -> str:
    m = re.match(r"^(\d+)\.(\d+)\.(\d+)", current)
    if not m:
        return "1.0.1"
    major, minor, patch = int(m.group(1)), int(m.group(2)), int(m.group(3))
    if part == "major":
        return f"{major + 1}.0.0"
    elif part == "minor":
        return f"{major}.{minor + 1}.0"
    elif part == "patch":
        return f"{major}.{minor}.{patch + 1}"
    return current


def update_files(new_ver: str):
    # 1. Update web package.json
    if WEB_PKG.exists():
        with open(WEB_PKG, "r", encoding="utf-8") as f:
            data = json.load(f)
        data["version"] = new_ver
        with open(WEB_PKG, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            f.write("\n")
        print(f"  ✓ Updated {WEB_PKG.name} to {new_ver}")

    # 2. Update api main.py
    if API_MAIN.exists():
        content = API_MAIN.read_text(encoding="utf-8")
        updated = re.sub(r'version="[^"]+"', f'version="{new_ver}"', content)
        API_MAIN.write_text(updated, encoding="utf-8")
        print(f"  ✓ Updated {API_MAIN.name} to {new_ver}")

    # 3. Update mobile pubspec.yaml
    if MOBILE_PUBSPEC.exists():
        content = MOBILE_PUBSPEC.read_text(encoding="utf-8")
        updated = re.sub(r'version:\s*[0-9\.\+\-]+', f'version: {new_ver}+1', content)
        MOBILE_PUBSPEC.write_text(updated, encoding="utf-8")
        print(f"  ✓ Updated {MOBILE_PUBSPEC.name} to {new_ver}+1")


def main():
    parser = argparse.ArgumentParser(description="Create a new release and version tag")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--bump", choices=["major", "minor", "patch"], help="Bump semantic version part")
    group.add_argument("--version", help="Explicit version (e.g. 1.2.0)")
    parser.add_argument("--tag", action="store_true", help="Create git commit and git tag automatically")
    parser.add_argument("--push", action="store_true", help="Push commit and tag to remote origin")

    args = parser.parse_args()
    current = get_current_version()
    new_version = args.version if args.version else bump_semver(current, args.bump)

    print(f"Bumping version: {current} ➔ {new_version}")
    update_files(new_version)

    tag_name = f"v{new_version}"

    if args.tag:
        subprocess.run(["git", "add", "apps/web/package.json", "services/api/app/main.py", "apps/mobile/pubspec.yaml"])
        subprocess.run(["git", "commit", "-m", f"chore(release): bump version to {tag_name}"])
        subprocess.run(["git", "tag", "-a", tag_name, "-m", f"Release {tag_name}"])
        print(f"  ✓ Created git tag: {tag_name}")

        if args.push:
            subprocess.run(["git", "push", "origin", "main"])
            subprocess.run(["git", "push", "origin", tag_name])
            print(f"  🚀 Pushed {tag_name} to origin!")
    else:
        print("\nNext steps:")
        print(f"  git commit -am 'chore(release): bump to {tag_name}'")
        print(f"  git tag -a {tag_name} -m 'Release {tag_name}'")
        print(f"  git push origin {tag_name}")


if __name__ == "__main__":
    main()

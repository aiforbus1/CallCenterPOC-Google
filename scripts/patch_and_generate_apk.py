#!/usr/bin/env python3
"""
Automated Mobile App Packager & Resigner for Google VPS (Ubuntu 24.04).
Patches the backend API URL to the Google VPS IP (34.41.238.202:8000),
sets the default admin user and password, and resigns the Android APKs.
"""
import os
import sys
import shutil
import zipfile
import hashlib
import base64
import datetime
from pathlib import Path

from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import pkcs7, Encoding

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = Path(__file__).resolve().parents[1]
DIST_DIR = ROOT_DIR / "dist" / "google_vps"
RELEASE_APK = ROOT_DIR / "apps" / "mobile" / "build" / "app" / "outputs" / "apk" / "release" / "app-release.apk"
DEBUG_APK = ROOT_DIR / "apps" / "mobile" / "build" / "app" / "outputs" / "apk" / "debug" / "app-debug.apk"

# String replacements (preserving exact byte lengths for native ELF .so files)
REPLACEMENTS_RELEASE = {
    b"http://100.109.247.54:8000/api/v1": b"http://34.41.238.202:8000/api/v1/", # 33 bytes
    b"https://eairoadmap.com/122Nagda/api/v1": b"http://34.41.238.202:8000/api/v1/././", # 38 bytes
    b"operator@callcenter.local": b"admin122@callcenter.local", # 25 bytes
    b"Operator123456!": b"Admin123456789!", # 15 bytes
}

REPLACEMENTS_DEBUG = {
    b"http://100.109.247.54:8000/api/v1": b"http://34.41.238.202:8000/api/v1",
    b"https://eairoadmap.com/122Nagda/api/v1": b"http://34.41.238.202:8000/api/v1",
    b"operator@callcenter.local": b"admin122@callcenter.local",
    b"Operator123456!": b"Admin123456789!",
}


def generate_keystore():
    """Generates a self-signed RSA key and X.509 certificate for APK signing."""
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, "AI Call Center"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Police 122 Hotline"),
        x509.NameAttribute(NameOID.COUNTRY_NAME, "EG"),
    ])
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1))
        .not_valid_after(datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=3650))
        .sign(key, hashes.SHA256())
    )
    return key, cert


def resign_apk(input_apk_path: Path, output_apk_path: Path, replacements: dict, is_release: bool):
    print(f"\n📦 Processing {input_apk_path.name} -> {output_apk_path.name}...")
    key, cert = generate_keystore()

    with zipfile.ZipFile(input_apk_path, "r") as src_zip:
        entries = {}
        for item in src_zip.infolist():
            # Skip old signatures in META-INF
            if item.filename.startswith("META-INF/") and (item.filename.endswith(".SF") or item.filename.endswith(".RSA") or item.filename.endswith(".DSA") or item.filename.endswith("MANIFEST.MF")):
                continue
            
            data = src_zip.read(item.filename)
            
            # Apply patches
            if is_release and item.filename.endswith(".so"):
                for old_val, new_val in replacements.items():
                    if old_val in data:
                        data = data.replace(old_val, new_val)
                        print(f"  ✓ Patched in {item.filename}: {old_val[:20]}... -> {new_val[:20]}...")
            elif not is_release and "kernel_blob.bin" in item.filename:
                for old_val, new_val in replacements.items():
                    if old_val in data:
                        data = data.replace(old_val, new_val)
                        print(f"  ✓ Patched in {item.filename}: {old_val[:20]}... -> {new_val[:20]}...")

            entries[item.filename] = data

    # 1. Build MANIFEST.MF
    manifest_lines = [
        "Manifest-Version: 1.0",
        "Created-By: AI Call Center Google VPS Packager",
        "",
    ]
    manifest_entries = {}
    for name, content in sorted(entries.items()):
        digest = base64.b64encode(hashlib.sha256(content).digest()).decode("ascii")
        entry_text = f"Name: {name}\r\nSHA-256-Digest: {digest}\r\n\r\n"
        manifest_entries[name] = entry_text
        manifest_lines.append(f"Name: {name}")
        manifest_lines.append(f"SHA-256-Digest: {digest}")
        manifest_lines.append("")

    manifest_bytes = "\r\n".join(manifest_lines).encode("utf-8")
    entries["META-INF/MANIFEST.MF"] = manifest_bytes

    # 2. Build CERT.SF
    main_manifest_digest = base64.b64encode(hashlib.sha256(manifest_bytes).digest()).decode("ascii")
    sf_lines = [
        "Signature-Version: 1.0",
        "Created-By: 1.0 (Android)",
        f"SHA-256-Digest-Manifest: {main_manifest_digest}",
        "",
    ]
    for name, entry_text in manifest_entries.items():
        entry_digest = base64.b64encode(hashlib.sha256(entry_text.encode("utf-8")).digest()).decode("ascii")
        sf_lines.append(f"Name: {name}")
        sf_lines.append(f"SHA-256-Digest: {entry_digest}")
        sf_lines.append("")

    sf_bytes = "\r\n".join(sf_lines).encode("utf-8")
    entries["META-INF/CERT.SF"] = sf_bytes

    # 3. Build CERT.RSA (PKCS#7 signature over CERT.SF)
    builder = pkcs7.PKCS7SignatureBuilder().set_data(sf_bytes)
    builder = builder.add_signer(cert, key, hashes.SHA256())
    rsa_bytes = builder.sign(Encoding.DER, [pkcs7.PKCS7Options.DetachedSignature])
    entries["META-INF/CERT.RSA"] = rsa_bytes

    # Write output APK
    output_apk_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output_apk_path, "w", zipfile.ZIP_DEFLATED) as out_zip:
        for name, content in entries.items():
            out_zip.writestr(name, content)

    size_mb = output_apk_path.stat().st_size / (1024 * 1024)
    print(f"✅ Generated signed APK: {output_apk_path} ({size_mb:.2f} MB)")


def main():
    print("=" * 70)
    print("🚀 GENERATING MOBILE APP FOR GOOGLE VPS (34.41.238.202)")
    print("======================================================================")
    print("Default Settings Baked In:")
    print("  • Google VPS IP:     http://34.41.238.202:8000/api/v1")
    print("  • Default User:       admin122@callcenter.local (also admin@callcenter.local)")
    print("  • Default Password:   Admin123456789! (also Admin123456!)")
    print("=" * 70)

    DIST_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Resign Release APK
    if RELEASE_APK.exists():
        dist_release = DIST_DIR / "app-release.apk"
        resign_apk(RELEASE_APK, dist_release, REPLACEMENTS_RELEASE, is_release=True)
        # Update local build output as well
        shutil.copy2(dist_release, RELEASE_APK)

    # 2. Resign Debug APK
    if DEBUG_APK.exists():
        dist_debug = DIST_DIR / "app-debug.apk"
        resign_apk(DEBUG_APK, dist_debug, REPLACEMENTS_DEBUG, is_release=False)
        shutil.copy2(dist_debug, DEBUG_APK)

    print("\n" + "=" * 70)
    print("🎉 Mobile APKs successfully generated and ready for installation!")
    print(f"  Release APK: {DIST_DIR / 'app-release.apk'}")
    print(f"  Debug APK:   {DIST_DIR / 'app-debug.apk'}")
    print("=" * 70)


if __name__ == "__main__":
    main()

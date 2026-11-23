#!/usr/bin/env python3
"""
Proper Android APK Signer with APK Signature Scheme v1/v2/v3 and 4-byte zipalign.
Preserves original Gradle uncompressed native libraries (.so) and page-alignment.
"""
import os
import sys
import shutil
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
DIST_DIR = ROOT_DIR / "dist" / "google_vps"
GRADLE_OUT = ROOT_DIR / "apps" / "mobile" / "build" / "app" / "outputs" / "flutter-apk"
TOOLS_DIR = Path(r"C:\Users\pc\AppData\Local\Android\Sdk\build-tools\34.0.0")
JRE_BIN = Path(r"C:\Users\pc\AppData\Local\AdoptiumJRE\jdk-17.0.21+9-jre\bin")

ZIPALIGN = TOOLS_DIR / "zipalign.exe"
APKSIGNER = TOOLS_DIR / "apksigner.bat"
KEYTOOL = JRE_BIN / "keytool.exe"
KEYSTORE = ROOT_DIR / "scripts" / "release.keystore"
KEYSTORE_PASS = "callcenter123"
KEY_ALIAS = "callcenter"

os.environ["PATH"] = f"{JRE_BIN};{os.environ['PATH']}"


def ensure_keystore():
    if KEYSTORE.exists():
        return
    print(f"Creating release keystore at {KEYSTORE}...")
    cmd = [
        str(KEYTOOL),
        "-genkey",
        "-v",
        "-keystore", str(KEYSTORE),
        "-alias", KEY_ALIAS,
        "-keyalg", "RSA",
        "-keysize", "2048",
        "-validity", "10000",
        "-storepass", KEYSTORE_PASS,
        "-keypass", KEYSTORE_PASS,
        "-dname", "CN=Police 122 Hotline, OU=Operations, O=Ministry of Interior, L=Cairo, ST=Cairo, C=EG"
    ]
    subprocess.run(cmd, check=True)
    print("✓ Keystore created successfully.")


def sign_apk(input_apk: Path, output_apk: Path):
    print(f"\nSigning {input_apk.name} -> {output_apk.name}...")
    
    # Verify alignment first
    verify_align = [str(ZIPALIGN), "-c", "-p", "4", str(input_apk)]
    res = subprocess.run(verify_align, capture_output=True, text=True)
    if res.returncode != 0:
        print("  Aligning APK...")
        temp_aligned = input_apk.with_suffix(".aligned.tmp.apk")
        if temp_aligned.exists():
            temp_aligned.unlink()
        subprocess.run([str(ZIPALIGN), "-f", "-p", "4", str(input_apk), str(temp_aligned)], check=True)
        src_for_signing = temp_aligned
    else:
        print("  ✓ Zip alignment verified (4-byte page-aligned).")
        src_for_signing = input_apk

    # Sign with apksigner (v1, v2, and v3 schemes)
    if output_apk.exists():
        output_apk.unlink()

    sign_cmd = [
        str(APKSIGNER),
        "sign",
        "--ks", str(KEYSTORE),
        "--ks-key-alias", KEY_ALIAS,
        "--ks-pass", f"pass:{KEYSTORE_PASS}",
        "--key-pass", f"pass:{KEYSTORE_PASS}",
        "--v1-signing-enabled", "true",
        "--v2-signing-enabled", "true",
        "--v3-signing-enabled", "true",
        "--out", str(output_apk),
        str(src_for_signing)
    ]
    res = subprocess.run(sign_cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"apksigner failed: {res.stderr}\n{res.stdout}")
    print("  ✓ APK signed with Signature Schemes v1, v2, and v3.")

    # Clean up temp
    if src_for_signing != input_apk and src_for_signing.exists():
        src_for_signing.unlink()

    # Verify signature
    verify_cmd = [str(APKSIGNER), "verify", "--verbose", str(output_apk)]
    res = subprocess.run(verify_cmd, capture_output=True, text=True)
    print("  Signature verification:")
    for line in res.stdout.splitlines():
        if "Verified using" in line or "Verifies" in line:
            print(f"    {line}")

    size_mb = output_apk.stat().st_size / (1024 * 1024)
    print(f"  🎉 Ready: {output_apk.name} ({size_mb:.2f} MB)")


def main():
    ensure_keystore()
    DIST_DIR.mkdir(parents=True, exist_ok=True)

    release_source = GRADLE_OUT / "app-release.apk"
    if not release_source.exists():
        release_source = ROOT_DIR / "apps" / "mobile" / "build" / "app" / "outputs" / "apk" / "release" / "app-release.apk"

    if release_source.exists():
        # Sign release APK
        sign_apk(release_source, DIST_DIR / "app-release.apk")
    else:
        print(f"⚠️ Source APK not found at {release_source}")

if __name__ == "__main__":
    main()

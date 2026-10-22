"""Build the Samsung Tizen .tpk native host package for Tizen 6.0/6.5 (2021-2023 sets).

Strictly packages only the 11 files cryptographically verified by author-signature.xml
and signature1.xml to prevent Tizen security verification aborts on retail TVs.
"""
import base64
import hashlib
from pathlib import Path
import tempfile
import urllib.parse
import xml.etree.ElementTree as ET
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
TPK_DIR = ROOT / 'tpk'

# Exactly the 11 files signed in author-signature.xml / signature1.xml
SIGNED_PACKAGE_FILES = [
    'tizen-manifest.xml',
    'Overscan6.deps.json',
    'author-signature.xml',
    'signature1.xml',
    'bin/Overscan.dll',
    'bin/Overscan.pdb',
    'bin/libovprobe.so',
    'lib/libovprobe.so',
    'res/libovprobe.so',
    'res/libprivileged-service-client.so',
    'shared/res/Overscan.png',
]


def verify_signatures():
    """Verify that every file matches its declared SHA-512 digest in the signature."""
    sig_path = TPK_DIR / 'signature1.xml'
    if not sig_path.is_file():
        raise FileNotFoundError(f"Missing signature: {sig_path}")

    tree = ET.parse(sig_path)
    ns = {'ds': 'http://www.w3.org/2000/09/xmldsig#'}
    verified_count = 0

    for ref in tree.findall('.//ds:Reference', ns):
        uri = ref.get('URI')
        if uri.startswith('#'):
            continue
        rel_path = urllib.parse.unquote(uri)
        file_path = TPK_DIR / rel_path
        if not file_path.is_file():
            raise FileNotFoundError(f"Signed file missing from disk: {rel_path}")

        expected_digest = ref.find('ds:DigestValue', ns).text.strip()
        data = file_path.read_bytes()
        actual_digest = base64.b64encode(hashlib.sha512(data).digest()).decode()
        if actual_digest != expected_digest:
            raise ValueError(
                f"Cryptographic digest mismatch on {rel_path}!\n"
                f"Expected: {expected_digest}\n"
                f"Actual:   {actual_digest}\n"
                "This would cause Tizen OS to abort launch and close the app immediately."
            )
        verified_count += 1

    print(f"[TPK Builder] Verified {verified_count} signature references successfully.")


def build():
    manifest_path = TPK_DIR / 'tizen-manifest.xml'
    if not manifest_path.is_file():
        raise FileNotFoundError(f"Missing manifest: {manifest_path}")

    manifest = ET.parse(manifest_path).getroot()
    pkg = manifest.get('package', '')
    api_version = manifest.get('api-version', '')

    if not pkg:
        raise ValueError("tizen-manifest.xml missing package attribute")
    if api_version != '6.0':
        raise ValueError(f"Expected api-version 6.0 for Tizen 6.0-7.0 sets, got {api_version}")

    verify_signatures()

    output = ROOT / 'dist/TVBrowser-tizen6.tpk'
    output.parent.mkdir(exist_ok=True)

    print(f"[TPK Builder] Packing strictly {len(SIGNED_PACKAGE_FILES)} signed files into {output.name}...")

    with tempfile.TemporaryDirectory(prefix='tvbrowser-tpk-') as tmpdir:
        archive_path = Path(tmpdir) / 'TVBrowser-tizen6.tpk'
        with ZipFile(archive_path, 'w', ZIP_DEFLATED) as zipf:
            for rel in SIGNED_PACKAGE_FILES:
                src_file = TPK_DIR / rel
                if not src_file.is_file():
                    raise FileNotFoundError(f"Missing required file: {rel}")
                zipf.write(src_file, rel)

        output.write_bytes(archive_path.read_bytes())

    size_kb = output.stat().st_size / 1024.0
    print(f"Created: {output} ({size_kb:.1f} KB)")
    print("Ready for installation on Samsung 2022 TV (Tizen 6.5) via Apps2Samsung.")


if __name__ == '__main__':
    build()


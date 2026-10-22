"""Build the Samsung Tizen .tpk native host package for Tizen 6.0/6.5 (2021-2023 sets)."""
import os
from pathlib import Path
import tempfile
import xml.etree.ElementTree as ET
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
TPK_DIR = ROOT / 'tpk'


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

    output = ROOT / 'dist/TVBrowser-tizen6.tpk'
    output.parent.mkdir(exist_ok=True)

    # Required files to pack
    files = []

    # Manifest and signatures
    for name in ('tizen-manifest.xml', 'Overscan6.deps.json', 'signature1.xml', 'author-signature.xml'):
        p = TPK_DIR / name
        if p.is_file():
            files.append((p, name))

    # Binaries and native libraries
    for directory in ('bin', 'lib', 'res', 'shared'):
        dir_path = TPK_DIR / directory
        if dir_path.is_dir():
            for file in sorted(dir_path.rglob('*')):
                if file.is_file() and not file.name.startswith('.'):
                    rel = file.relative_to(TPK_DIR).as_posix()
                    files.append((file, rel))

    print(f"[TPK Builder] Packing {len(files)} files into {output.name}...")

    with tempfile.TemporaryDirectory(prefix='tvbrowser-tpk-') as tmpdir:
        archive_path = Path(tmpdir) / 'TVBrowser-tizen6.tpk'
        with ZipFile(archive_path, 'w', ZIP_DEFLATED) as zipf:
            for src_file, archive_rel in files:
                zipf.write(src_file, archive_rel)

        # Write to final destination
        output.write_bytes(archive_path.read_bytes())

    size_kb = output.stat().st_size / 1024.0
    print(f"Created: {output} ({size_kb:.1f} KB)")
    print("Ready for installation on Samsung 2022 TV (Tizen 6.5) via Apps2Samsung.")


if __name__ == '__main__':
    build()

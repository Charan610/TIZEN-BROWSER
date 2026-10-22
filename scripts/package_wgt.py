"""Build an unsigned runtime-only WGT for Apps2Samsung to sign for the target TV."""
from pathlib import Path
import re
import tempfile
import xml.etree.ElementTree as ET
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
NS = {'w': 'http://www.w3.org/ns/widgets', 't': 'http://tizen.org/ns/widgets'}


def build():
    manifest = ET.parse(ROOT / 'config.xml').getroot()
    app = manifest.find('t:application', NS)
    if app is None or not re.fullmatch(r'[A-Za-z0-9]{10}', app.get('package', '')):
        raise ValueError('config.xml requires a 10-character Tizen package ID')
    if not app.get('id', '').startswith(app.get('package') + '.'):
        raise ValueError('Application ID must start with the package ID followed by a dot')
    content = manifest.find('w:content', NS)
    if content is None or content.get('src') != 'index.html':
        raise ValueError('config.xml must declare <content src="index.html"/>')

    # Only allow runtime resources. Never archive the working directory, signing
    # profiles, private keys, old signatures, previous builds, or development tools.
    files = [ROOT / name for name in (
        'config.xml', 'index.html', 'LICENSES.md',
        'tests/compatibility/poc_controlled_page.html')]
    allowed_extensions = {'.js', '.css', '.html', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.woff', '.woff2'}
    for directory in ('src', 'assets'):
        for file in sorted((ROOT / directory).rglob('*')):
            relative = file.relative_to(ROOT)
            if file.is_file() and file.suffix.lower() in allowed_extensions:
                if not any(part.startswith('.') for part in relative.parts):
                    files.append(file)
    for file in files:
        if not file.is_file() or file.is_symlink() or ROOT not in file.resolve().parents:
            raise ValueError('Missing or unsafe runtime file: ' + str(file.relative_to(ROOT)))

    output = ROOT / 'dist/TVBrowser.wgt'
    output.parent.mkdir(exist_ok=True)
    # Replace the previous archive atomically; zip update mode leaves stale files.
    with tempfile.TemporaryDirectory(prefix='tvbrowser-package-') as temporary:
        archive = Path(temporary) / 'TVBrowser.wgt'
        with ZipFile(archive, 'w', ZIP_DEFLATED) as package:
            for file in files:
                package.write(file, file.relative_to(ROOT).as_posix())
        # Copy into dist before rename so this also works across filesystem volumes.
        with tempfile.NamedTemporaryFile(dir=output.parent, suffix='.wgt', delete=False) as staged:
            staged_path = Path(staged.name)
            try:
                staged.write(archive.read_bytes())
            except BaseException:
                staged_path.unlink(missing_ok=True)
                raise
        try:
            staged_path.replace(output)
        finally:
            staged_path.unlink(missing_ok=True)
    print('Created: ' + str(output))
    print('Unsigned package: select this file in Apps2Samsung Custom WGT/TPK.')
    print('Apps2Samsung must sign it with a Samsung certificate for your TV before installation.')


if __name__ == '__main__':
    build()

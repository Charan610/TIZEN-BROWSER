"""Check the actual artifact handed to Apps2Samsung, not just source files."""
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[2]
NS = {'w': 'http://www.w3.org/ns/widgets', 't': 'http://tizen.org/ns/widgets'}


class WgtTests(unittest.TestCase):
    def setUp(self):
        self.archive = ZipFile(ROOT / 'dist/TVBrowser.wgt')
        self.addCleanup(self.archive.close)
        self.names = self.archive.namelist()
        self.manifest = ET.fromstring(self.archive.read('config.xml'))

    def test_installer_can_identify_package(self):
        app = self.manifest.find('t:application', NS)
        package_id = app.get('package', '')
        self.assertRegex(package_id, r'^[A-Za-z0-9]{10}$')
        self.assertTrue(app.get('id', '').startswith(package_id + '.'))
        self.assertEqual(app.get('required_version'), '6.5')
        self.assertEqual(self.manifest.find('t:profile', NS).get('name'), 'tv-samsung')

    def test_launch_page_and_resources_exist(self):
        content = self.manifest.find('w:content', NS)
        self.assertIsNotNone(content, 'Web apps need a content src launch page')
        html = self.archive.read(content.get('src')).decode()
        for resource in re.findall(r'(?:src|href)="([^"]+)"', html):
            self.assertIn(resource, self.names)
        self.assertIn(self.manifest.find('w:icon', NS).get('src'), self.names)
        self.assertIn('tests/compatibility/poc_controlled_page.html', self.names)

    def test_navigation_policy_is_text(self):
        navigation = self.manifest.find('t:allow-navigation', NS)
        self.assertEqual((navigation.text or '').strip(), '*')
        self.assertNotIn('href', navigation.attrib)

    def test_archive_contains_only_runtime_files(self):
        for name in self.names:
            if name.endswith('/'):
                continue
            self.assertTrue(name in ('config.xml', 'index.html', 'LICENSES.md',
                                    'tests/compatibility/poc_controlled_page.html')
                            or name.startswith(('src/', 'assets/')), name)
            self.assertFalse(any(part.startswith('.') for part in Path(name).parts), name)
            self.assertNotRegex(name.lower(), r'\.(p12|pfx|pem|key|pwd|cer)$')
        self.assertNotIn('author-signature.xml', self.names)
        self.assertNotIn('signature1.xml', self.names)
        self.assertIsNone(self.archive.testzip())

    def test_manifest_is_current(self):
        self.assertEqual(self.archive.read('config.xml'), (ROOT / 'config.xml').read_bytes())

    def packaging_fixture(self, directory):
        fixture = Path(directory)
        for name in ('src', 'assets', 'scripts', 'tests/compatibility'):
            shutil.copytree(ROOT / name, fixture / name)
        for name in ('config.xml', 'index.html', 'LICENSES.md'):
            shutil.copy2(ROOT / name, fixture / name)
        return fixture

    def test_rebuild_removes_old_signatures_and_private_keys(self):
        with tempfile.TemporaryDirectory() as directory:
            fixture = self.packaging_fixture(directory)
            (fixture / 'dist').mkdir()
            output = fixture / 'dist/TVBrowser.wgt'
            with ZipFile(output, 'w') as old:
                old.writestr('.temp_profile_build/builder.p12', 'test secret')
                old.writestr('signature1.xml', 'obsolete signature')
            (fixture / 'assets/leaked.p12').write_text('test secret')
            (fixture / 'src/.private').mkdir()
            (fixture / 'src/.private/secret.js').write_text('test secret')
            result = subprocess.run([sys.executable, str(fixture / 'scripts/package_wgt.py')],
                                    cwd='/', capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            with ZipFile(output) as rebuilt:
                self.assertIn('index.html', rebuilt.namelist())
                self.assertNotIn('signature1.xml', rebuilt.namelist())
                self.assertFalse(any('private' in n or n.endswith('.p12') for n in rebuilt.namelist()))

    def test_invalid_manifest_does_not_replace_previous_package(self):
        with tempfile.TemporaryDirectory() as directory:
            fixture = self.packaging_fixture(directory)
            config = fixture / 'config.xml'
            config.write_text(config.read_text().replace('package="g8k2m4p9q1"', ''))
            (fixture / 'dist').mkdir()
            output = fixture / 'dist/TVBrowser.wgt'
            output.write_bytes(b'previous package')
            result = subprocess.run([sys.executable, str(fixture / 'scripts/package_wgt.py')],
                                    capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('package ID', result.stderr)
            self.assertEqual(output.read_bytes(), b'previous package')


if __name__ == '__main__':
    unittest.main()

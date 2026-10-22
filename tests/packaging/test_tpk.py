"""Verification suite for TVBrowser-tizen6.tpk package handed to Apps2Samsung."""
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[2]


class TpkTests(unittest.TestCase):
    def setUp(self):
        tpk_path = ROOT / 'dist/TVBrowser-tizen6.tpk'
        self.assertTrue(tpk_path.is_file(), f"Missing package: {tpk_path}")
        self.archive = ZipFile(tpk_path)
        self.addCleanup(self.archive.close)
        self.names = self.archive.namelist()

    def test_archive_integrity(self):
        self.assertIsNone(self.archive.testzip(), "Corrupted zip entries in .tpk")

    def test_manifest_structure(self):
        self.assertIn('tizen-manifest.xml', self.names)
        manifest_xml = self.archive.read('tizen-manifest.xml')
        root = ET.fromstring(manifest_xml)

        self.assertEqual(root.get('api-version'), '6.0')
        package_id = root.get('package', '')
        self.assertTrue(len(package_id) > 0, "Missing package ID")

        # Handle Tizen XML namespace if present
        profile = root.find('{http://tizen.org/ns/packages}profile')
        if profile is None:
            profile = root.find('profile')
        self.assertIsNotNone(profile)
        self.assertEqual(profile.get('name'), 'tv')

        ui_app = root.find('{http://tizen.org/ns/packages}ui-application')
        if ui_app is None:
            ui_app = root.find('ui-application')
        self.assertIsNotNone(ui_app)
        self.assertEqual(ui_app.get('type'), 'dotnet')

    def test_lsm_stub_library_present(self):
        """Verify Samsung LSM bypass stub for retail 2021-2023 TVs is included in res/."""
        self.assertIn('res/libprivileged-service-client.so', self.names)
        stub_data = self.archive.read('res/libprivileged-service-client.so')
        # Check ELF header
        self.assertTrue(stub_data.startswith(b'\x7fELF'), "libprivileged-service-client.so is not a valid ELF")

    def test_embedded_web_ui_assets_present(self):
        """Verify the preserved web UI is bundled inside res/web/."""
        self.assertIn('res/web/index.html', self.names)
        self.assertIn('res/web/src/browser/viewport.js', self.names)
        self.assertIn('res/web/src/browser/url_utils.js', self.names)
        self.assertIn('res/web/src/browser/native_bridge.js', self.names)
        self.assertIn('res/web/src/tabs/tab_manager.js', self.names)
        self.assertIn('res/web/src/ui/suggestions.js', self.names)
        self.assertIn('res/web/src/ui/styles.css', self.names)

    def test_signatures_present_for_apps2samsung(self):
        """Apps2Samsung installer expects developer signatures for TPK."""
        self.assertIn('author-signature.xml', self.names)
        self.assertIn('signature1.xml', self.names)

    def test_no_private_keys_or_secret_files(self):
        for name in self.names:
            self.assertNotRegex(name.lower(), r'\.(p12|pfx|key|pem|pwd)$')
            self.assertFalse(any(part.startswith('.') for part in Path(name).parts))


if __name__ == '__main__':
    unittest.main()

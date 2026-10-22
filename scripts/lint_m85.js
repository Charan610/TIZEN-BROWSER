/**
 * Chromium M85 (Tizen 6.5) Compatibility Linter
 * Scans JavaScript source files for unsupported modern syntax or APIs introduced in Chromium 86+.
 */

const fs = require('fs');
const path = require('path');

const FORBIDDEN_PATTERNS = [
  { regex: /\.replaceAll\(/, name: 'String.prototype.replaceAll (Chromium 85 lacks full support, M85 standard is replace with /g)' },
  { regex: /\.at\(/, name: 'Array.prototype.at (Introduced in Chrome 92)' },
  { regex: /\s&&\=\s/, name: 'Logical assignment operator &&= (Chrome 85 partially supported; prefer standard syntax)' },
  { regex: /\s\|\|\=\s/, name: 'Logical assignment operator ||= (Prefer standard syntax for TV stability)' },
  { regex: /\s\?\?\=\s/, name: 'Nullish assignment operator ??= (Prefer standard syntax for TV stability)' }
];

function scanDir(dir, errors) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath, errors);
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      FORBIDDEN_PATTERNS.forEach((rule) => {
        if (rule.regex.test(content)) {
          errors.push({ file: fullPath, issue: rule.name });
        }
      });
    }
  }
}

console.log('Scanning source code for Chromium M85 compatibility...');
const errors = [];
scanDir(path.join(__dirname, '../src'), errors);

if (errors.length > 0) {
  console.error('\n❌ Chromium M85 Compatibility Issues Found:');
  errors.forEach(e => console.error(`  - ${e.file}: ${e.issue}`));
  process.exit(1);
} else {
  console.log('✓ All source files strictly comply with Chromium M85 / ES2020 standards.');
}

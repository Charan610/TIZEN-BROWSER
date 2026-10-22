#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "=== Packaging Samsung Tizen TV Web Application (.WGT) ==="
python3 "$PROJECT_DIR/scripts/package_wgt.py"
python3 "$PROJECT_DIR/tests/packaging/test_wgt.py"

echo ""
echo "=== Packaging Samsung Tizen TV Native Host Application (.TPK) ==="
python3 "$PROJECT_DIR/scripts/package_tpk.py"
python3 "$PROJECT_DIR/tests/packaging/test_tpk.py"

echo ""
echo "=== All Packaging and Artifact Verifications Succeeded ==="

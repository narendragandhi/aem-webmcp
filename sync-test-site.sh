#!/usr/bin/env bash
# sync-test-site.sh — Copy clientlib JS files to test-site/ to prevent drift.
# Run after editing any file in clientlib-webmcp/js/.

set -euo pipefail

CLIENTLIB_DIR="ui.apps/src/main/content/jcr_root/apps/aem-webmcp/clientlibs/clientlib-webmcp/js"
TEST_SITE_DIR="test-site"

FILES="webmcp.js webmcp-config.js webmcp-helpers.js recipegenerator.js imagetagger.js voicecommand.js mock-agent.js"

echo "Syncing clientlib JS → test-site/ ..."
for f in $FILES; do
    src="$CLIENTLIB_DIR/$f"
    dst="$TEST_SITE_DIR/$f"
    if [ -f "$src" ]; then
        cp "$src" "$dst"
        echo "  ✓ $f"
    else
        echo "  ⚠ $f not found in clientlib, skipping"
    fi
done
echo "Done."

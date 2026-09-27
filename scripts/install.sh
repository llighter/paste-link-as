#!/usr/bin/env bash
# Copy the plugin files into a vault for testing.
# Usage: scripts/install.sh [vault-path]
# The vault path comes from the argument, else from .vault-path (one line, git-ignored).
set -euo pipefail
cd "$(dirname "$0")/.."
vault="${1:-$(cat .vault-path 2>/dev/null || true)}"
if [ -z "$vault" ] || [ ! -d "$vault/.obsidian" ]; then
  echo "Usage: scripts/install.sh <vault-path>   (or put the path in .vault-path)" >&2
  exit 1
fi
id="$(sed -n 's/.*"id": *"\([^"]*\)".*/\1/p' manifest.json)"
dest="$vault/.obsidian/plugins/$id"
mkdir -p "$dest"
cp main.js manifest.json styles.css "$dest/"
echo "Copied to $dest. Reload Obsidian (or turn the plugin off and on) to load it."

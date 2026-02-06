#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
bun install
bun run build
echo "Build completed successfully"
ls -la dist/

#!/usr/bin/env bash
set -euo pipefail

AUTOMATOR_DIR="${WECHAT_AUTOMATOR_DIR:-/tmp/wechat-devtools-automator}"
VERSION="${MINIPROGRAM_AUTOMATOR_VERSION:-0.12.1}"

mkdir -p "$AUTOMATOR_DIR"
cd "$AUTOMATOR_DIR"

if [ ! -f package.json ]; then
  npm init -y >/dev/null
fi

if [ ! -d node_modules/miniprogram-automator ]; then
  npm install "miniprogram-automator@$VERSION" --ignore-scripts --no-audit --no-fund
fi

node -e "require('miniprogram-automator'); console.log(JSON.stringify({ok:true, automatorDir: process.cwd()}))"

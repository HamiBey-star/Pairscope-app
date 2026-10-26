#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install the LTS version from https://nodejs.org and run this again."
  read -n 1 -s -r -p "Press any key to close"; exit 1
fi
node scripts/track.mjs || { read -n 1 -s -r -p "Press any key to close"; exit 1; }
node scripts/pack.mjs
echo
echo "Next: upload pairscope-upload.zip to your site."
read -n 1 -s -r -p "Press any key to close"

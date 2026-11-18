#!/bin/bash

# Deploys the current working tree to the staging site:
#   https://staging.bettertogethergaming.com  (/var/www/bettertogethergaming-staging/dist on the server)
# The live site (deploy.sh) is not touched.

set -eo pipefail  # Exit on any error, including inside a pipe

SERVER=root@enochtsang.com
DIR=/var/www/bettertogethergaming-staging

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}[BUILD]${NC} Building project..."
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}[ERROR]${NC} dist folder not found after build"
    exit 1
fi

echo -e "${CYAN}[UPLOAD]${NC} Uploading and swapping into ${DIR}/dist..."
# One gzipped tar stream over one ssh connection: much faster than scp -r,
# which pays a round trip per file. The swap only runs if the unpack succeeded.
tar -C dist -czf - . | ssh "$SERVER" "set -e
  mkdir -p ${DIR} && cd ${DIR}
  rm -rf new-dist && mkdir new-dist
  tar -C new-dist -xzf -
  rm -rf dist.backup
  if [ -d dist ]; then mv dist dist.backup; fi
  mv new-dist dist"

echo -e "${GREEN}[SUCCESS]${NC} Staging site is live at https://staging.bettertogethergaming.com"

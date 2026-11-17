#!/bin/bash

# Deploys the current working tree to the private review copy:
#   https://enochtsang.com:8443  (/var/www/enochtsang-review/dist on the server)
# The live site (deploy.sh) is not touched.

set -e  # Exit on any error

SERVER=root@enochtsang.com
DIR=/var/www/enochtsang-review

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

echo -e "${CYAN}[UPLOAD]${NC} Uploading to ${DIR}/new-dist..."
ssh "$SERVER" "mkdir -p ${DIR} && rm -rf ${DIR}/new-dist"
# No trailing slashes: scp creates new-dist as a direct copy of dist.
scp -r dist "$SERVER:${DIR}/new-dist"

echo -e "${CYAN}[DEPLOY]${NC} Swapping into place..."
ssh "$SERVER" "cd ${DIR} && rm -rf dist.backup && { [ ! -d dist ] || mv dist dist.backup; } && mv new-dist dist"

echo -e "${GREEN}[SUCCESS]${NC} Review copy is live at https://enochtsang.com:8443"

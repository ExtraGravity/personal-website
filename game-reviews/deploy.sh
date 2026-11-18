#!/bin/bash

# Deployment script for bettertogethergaming.com (game-reviews)
# This script builds the project and deploys it to the server

set -e  # Exit on any error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo "=========================================="
echo -e "${CYAN}[DEPLOY]${NC} Starting deployment process..."
echo "=========================================="
echo ""

# Step 1: Build and deploy to staging (deploy-staging.sh). set -e stops here if
# it fails, so live never gets a build staging didn't. Live then gets a
# server-side copy of staging's dist: no second build, no second upload.
echo "=========================================="
echo -e "${CYAN}[STAGING]${NC} Building and deploying to staging first..."
echo "=========================================="
bash "$(dirname "$0")/deploy-staging.sh"
echo ""

if [ ! -d "dist" ]; then
    echo ""
    echo -e "${RED}[ERROR]${NC} dist folder not found after the staging build"
    exit 1
fi

# Step 2: Copy staging's dist to live on the server and swap it in. Staging
# just received this exact build, so nothing is uploaded a second time.
echo "=========================================="
echo -e "${CYAN}[DEPLOY]${NC} Copying staging's build to live on the server..."
echo "=========================================="
ssh root@enochtsang.com << 'ENDSSH'
    set -e
    cd /var/www/enochtsang/
    rm -rf new-dist
    cp -a /var/www/bettertogethergaming-staging/dist new-dist

    # Keep the previous live build as dist.backup
    rm -rf dist.backup
    if [ -d dist ]; then mv dist dist.backup; fi
    mv new-dist dist

    echo "[SUCCESS] Live now has staging's build"
ENDSSH

echo ""
echo "=========================================="
echo -e "${GREEN}[SUCCESS]${NC} Deployment completed successfully!"
echo "=========================================="
echo ""
echo -e "${CYAN}[INFO]${NC} Your site should now be live at https://bettertogethergaming.com"
echo ""

#!/bin/bash

# Deployment script for enochtsang.com (game-reviews)
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

# Step 1: Build the project
echo "=========================================="
echo -e "${BLUE}[BUILD]${NC} Building project..."
echo "=========================================="
npm run build

if [ ! -d "dist" ]; then
    echo ""
    echo -e "${RED}[ERROR]${NC} dist folder not found after build"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}[BUILD]${NC} Build completed successfully"
echo "=========================================="
echo ""

# Step 2: Clean up any existing new-dist folder and copy dist to server
echo "=========================================="
echo -e "${YELLOW}[CLEANUP]${NC} Cleaning up any existing temporary deployment folder..."
echo "=========================================="
ssh root@enochtsang.com 'rm -rf /var/www/enochtsang/new-dist'

echo ""
echo "=========================================="
echo -e "${BLUE}[UPLOAD]${NC} Uploading dist folder to server (temporary location)..."
echo "=========================================="
# No trailing slashes: scp creates new-dist as a direct copy of dist.
# With trailing slashes and a pre-created destination directory, some scp
# versions nest dist/ inside new-dist/, producing new-dist/dist/.
scp -r dist root@enochtsang.com:/var/www/enochtsang/new-dist

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}[ERROR]${NC} Failed to upload dist folder"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}[UPLOAD]${NC} Upload completed successfully"
echo "=========================================="
echo ""

# Step 3: SSH into server and deploy
echo "=========================================="
echo -e "${CYAN}[DEPLOY]${NC} Deploying on server..."
echo "=========================================="
ssh root@enochtsang.com << 'ENDSSH'
    cd /var/www/enochtsang/

    # Verify new-dist exists
    if [ ! -d "new-dist" ]; then
        echo "[ERROR] new-dist folder not found"
        exit 1
    fi

    # Backup current dist (replaces previous backup if it exists)
    if [ -d "dist" ]; then
        echo "[BACKUP] Creating backup..."
        rm -rf dist.backup
        mv dist dist.backup
    fi

    # Remove old dist (if it wasn't moved to backup)
    if [ -d "dist" ]; then
        echo "[CLEANUP] Removing old dist folder..."
        rm -rf dist
    fi

    # Move new dist into place
    echo "[INSTALL] Installing new dist folder..."
    mv new-dist dist

    echo "[SUCCESS] Deployment completed successfully on server!"
ENDSSH

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}[ERROR]${NC} Failed to deploy on server"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}[SUCCESS]${NC} Deployment completed successfully!"
echo "=========================================="
echo ""
echo -e "${CYAN}[INFO]${NC} Your site should now be live at https://enochtsang.com"
echo ""

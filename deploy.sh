#!/usr/bin/env bash
set -e

# ========================================================
# Cloudflare Pages Automated Deployment Script
# Project: Chainlist RPC Benchmarks Platform
# ========================================================

PROJECT_NAME="chainlist-rpc-benchmarks"
PRODUCTION_BRANCH="main"
DIST_DIR="dist"

echo "========================================================"
echo " Starting Cloudflare Pages Deployment: ${PROJECT_NAME}"
echo "========================================================"

# 1. Check Cloudflare Credentials
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ Error: CLOUDFLARE_API_TOKEN is not set in environment."
  exit 1
fi

echo "✓ Cloudflare API Token detected."
if [ -n "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo "✓ Cloudflare Account ID: ${CLOUDFLARE_ACCOUNT_ID}"
fi

# 2. Run Test Suite
echo ""
echo "--- Step 1/4: Running Test Suite ---"
npm test

# 3. Production Build
echo ""
echo "--- Step 2/4: Building Production Bundle ---"
npm run build

# 4. Ensure Project Exists on Cloudflare Pages
echo ""
echo "--- Step 3/4: Ensuring Cloudflare Pages Project Exists ---"
if npx wrangler pages project list 2>&1 | grep -q "${PROJECT_NAME}"; then
  echo "✓ Pages project '${PROJECT_NAME}' already exists."
else
  echo "Creating Pages project '${PROJECT_NAME}' on Cloudflare..."
  npx wrangler pages project create "${PROJECT_NAME}" --production-branch "${PRODUCTION_BRANCH}" || true
fi

# 5. Deploy to Cloudflare Pages
echo ""
echo "--- Step 4/4: Deploying Assets & Functions to Cloudflare Pages ---"
DEPLOY_OUTPUT=$(npx wrangler pages deploy "${DIST_DIR}" --project-name "${PROJECT_NAME}" --branch "${PRODUCTION_BRANCH}")
echo "${DEPLOY_OUTPUT}"

# Extract live deployment URL
LIVE_URL=$(echo "${DEPLOY_OUTPUT}" | grep -o 'https://[^ ]*\.pages\.dev' | head -n 1 || true)
if [ -z "$LIVE_URL" ]; then
  LIVE_URL="https://${PROJECT_NAME}.pages.dev"
fi

echo ""
echo "========================================================"
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "Production URL: ${LIVE_URL}"
echo "Edge API:        ${LIVE_URL}/api/chain/1868"
echo "========================================================"

#!/bin/bash
# Build script for Cloudflare Pages deployment
# Builds both home and admin apps and combines them into dist/

set -e

echo "🏗️  Building Method & Passion Monorepo..."

# Clean previous builds
rm -rf dist

# Copy .env to apps if exists (for local builds)
if [ -f ".env" ]; then
  cp .env apps/home/.env 2>/dev/null || true
  cp .env apps/admin/.env 2>/dev/null || true
  cp .env apps/teams/.env 2>/dev/null || true
fi

# Build home app
echo "🏠 Building home app..."
npm run build --workspace=apps/home

# Build admin app  
echo "🔐 Building admin app..."
npm run build --workspace=apps/admin

# Build teams app  
echo "👥 Building teams app..."
npm run build --workspace=apps/teams

# Combine builds
echo "📁 Combining builds..."
mkdir -p dist

# Copy home app to root of dist
cp -r apps/home/dist/* dist/

# Copy admin app to /admin subfolder
mkdir -p dist/admin
cp -r apps/admin/dist/* dist/admin/

# Copy teams app to /teams subfolder
mkdir -p dist/teams
cp -r apps/teams/dist/* dist/teams/

# Copy public assets (including _redirects)
cp -r public/* dist/ 2>/dev/null || true

# Fix admin index.html paths (they're relative to /admin/)
# The vite base is already set to /admin/, so paths should be correct

echo "✅ Build complete! Output in ./dist"
echo ""
echo "Structure:"
echo "  dist/"
echo "  ├── index.html (home)"
echo "  ├── admin/"
echo "  │   └── index.html (admin)"
echo "  └── teams/"
echo "      └── index.html (teams)"

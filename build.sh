#!/bin/bash
set -e

echo "========================================="
echo "V3D Platform API - Custom Build Script"
echo "========================================="

# Navigate to the API directory
cd apps/api

echo "📦 Installing dependencies (including devDependencies)..."
pnpm install --prod=false

echo "🔨 Building TypeScript..."
pnpm run build

echo "✅ Build completed successfully!"

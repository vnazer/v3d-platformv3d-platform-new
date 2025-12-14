#!/bin/bash
set -e

echo "========================================="
echo "V3D Platform API - Custom Build Script"
echo "========================================="

# Navigate to the API directory
cd apps/api

echo "📦 Installing dependencies (including devDependencies)..."
npm install --production=false
npx prisma generate

echo "🔨 Building TypeScript..."
npm run build

echo "✅ Build completed successfully!"

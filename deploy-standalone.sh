#!/bin/bash

# Deployment script - Standalone version
# Copia solo apps/web a un directorio temporal y lo deploya

set -e

echo "🚀 V3D Platform - Deployment Standalone"
echo "========================================"
echo ""

# Crear directorio temporal
TMP_DIR="/tmp/v3d-deployment-$(date +%s)"
echo "📂 Creando directorio temporal: $TMP_DIR"
mkdir -p "$TMP_DIR"

# Copiar solo el frontend
echo "📋 Copiando frontend..."
cp -r "apps/web/"* "$TMP_DIR/"

# Copiar package.json adaptado
echo "📝 Adaptando package.json..."
cat > "$TMP_DIR/package.json" << 'EOF'
{
  "name": "v3d-platform",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.21",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
EOF

# Navegar al directorio temporal
cd "$TMP_DIR"

echo "📦 Instalando dependencias..."
pnpm install

echo "🏗️  Building aplicación..."
pnpm build

echo "🚀 Deploying a Vercel..."
vercel --prod --yes

echo ""
echo "✅ ¡DEPLOYMENT COMPLETADO!"
echo ""
echo "🗑️ Limpiando directorio temporal..."
cd -
rm -rf "$TMP_DIR"

echo ""
echo "🎉 Deployment exitoso"
echo "📋 Copia la URL de arriba"
echo ""

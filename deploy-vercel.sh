#!/bin/bash

# V3D Platform - Deployment Script
# Este script automatiza el deployment a Vercel

set -e  # Exit on error

echo "🚀 V3D Platform - Deployment a Vercel"
echo "======================================"
echo ""

# Navegar a la carpeta del frontend
echo "📂 Navegando a apps/web..."
cd "/Users/vnazer/Library/CloudStorage/GoogleDrive-vnazer@magama.cl/Mi unidad/MAGAMA/Desarrollo/v3d-platform/Dev 2 - AWS/apps/web"

# Verificar que Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI no encontrado."
    echo "Instalando..."
    pnpm add -g vercel
fi

echo "✅ Vercel CLI encontrado"
echo ""

# Login a Vercel
echo "🔐 Iniciando login a Vercel..."
echo "👉 Se abrirá tu browser. Autoriza la aplicación y vuelve aquí."
echo ""

vercel login

echo ""
echo "✅ Login completado"
echo ""

# Deploy a producción
echo "🚀 Iniciando deployment a producción..."
echo ""

vercel --prod --yes

echo ""
echo "✅ ¡DEPLOYMENT COMPLETADO!"
echo ""
echo "🎉 Tu aplicación está online en Vercel"
echo "📋 Copia la URL que aparece arriba"
echo ""
echo "📝 Próximos pasos:"
echo "  1. Testea tu sitio en la URL de Vercel"
echo "  2. Configura backend y database (opcional)"
echo "  3. Conecta frontend con backend vía env vars"
echo ""

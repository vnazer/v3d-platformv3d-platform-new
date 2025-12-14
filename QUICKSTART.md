# 🚀 V3D Platform - Guía de Inicio Rápido

## ✅ Pre-requisitos

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- pnpm 8+

## 🏃 Setup en 5 Minutos

### 1. Iniciar Servicios Docker

```bash
docker-compose up -d
```

Esto inicia:
- PostgreSQL → `localhost:5432`
- Redis → `localhost:6379`
- pgAdmin → `http://localhost:5050`
- Redis Commander → `http://localhost:8081`

### 2. Instalar Dependencias

```bash
pnpm install
```

### 3. Configurar Variables de Entorno

**Backend** (`apps/api/.env`):
```bash
DATABASE_URL="postgresql://v3duser:v3dpass@localhost:5432/v3ddb"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key"
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS="http://localhost:3001,http://localhost:3000"
```

**Frontend** (`apps/web/.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 4. Aplicar Migraciones y Seed

```bash
# Migraciones
cd packages/database
pnpm prisma migrate dev

# Seed de monedas
npx tsx seed.ts
cd ../..
```

### 5. Iniciar Aplicación

**Terminal 1 - Backend**:
```bash
cd apps/api
pnpm dev
```

**Terminal 2 - Frontend**:
```bash
cd apps/web
pnpm dev
```

### 6. Crear Usuario de Prueba

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!",
    "first_name": "Admin",
    "last_name": "Test",
    "organization_name": "Test Org",
    "role": "ADMIN"
  }'
```

### 7. Acceder a la Plataforma

🌐 **Frontend**: http://localhost:3001
📧 **Login**: `admin@test.com` / `Admin123!`

---

## 🎯 Funcionalidades Principales

### 1. Dashboard
- KPIs en tiempo real (Proyectos, Leads, Unidades, Equipo)
- Actividad reciente
- Navegación rápida

### 2. Gestión de Unidades
- ✅ Lista con filtros (estado, tipo, búsqueda)
- ✅ Crear/Editar unidades
- ✅ Multi-moneda (USD, CLP, UF)
- ✅ **Operaciones Masivas** (cambiar estado, precios)
- ✅ **Importar/Exportar CSV**

### 3. Gestión de Leads
- Pipeline de ventas
- Asignación a agentes
- Filtros y búsqueda

### 4. Paneles de Admin

#### MAGAMA (SUPER_ADMIN)
🔗 http://localhost:3001/admin/magama
- Gestión de organizaciones
- Configuración de monedas
- Analytics globales

#### Organización (ADMIN)
🔗 http://localhost:3001/admin/organization
- Gestión de inventario
- Equipo de ventas
- Configuración e integraciones

---

## 📊 Probar Operaciones Masivas

### 1. Actualizar Estado de Múltiples Unidades

```bash
curl -X PUT http://localhost:3000/api/units/bulk/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "unit_ids": ["unit-id-1", "unit-id-2"],
    "status": "SOLD"
  }'
```

### 2. Aplicar Descuento Masivo

```bash
curl -X PUT http://localhost:3000/api/units/bulk/prices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "unit_ids": ["unit-id-1", "unit-id-2"],
    "price_adjustment": {
      "type": "percentage",
      "value": -15,
      "apply_to": "all"
    }
  }'
```

### 3. Importar CSV (Dry Run)

Crear archivo `units.csv`:
```csv
SKU,Nombre,Tipo,Estado,Precio,Moneda,Habitaciones,Baños,Área M²,Piso
A-101,Depto 101,DEPARTAMENTO,DISPONIBLE,150000,USD,2,2,75.5,1
A-102,Depto 102,DEPARTAMENTO,DISPONIBLE,160000,CLP,3,2,85,2
```

```bash
curl -X POST http://localhost:3000/api/units/import/csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@units.csv" \
  -F "project_id=YOUR_PROJECT_ID" \
  -F "dry_run=true"
```

### 4. Exportar a CSV

```bash
curl "http://localhost:3000/api/units/export/csv?status=AVAILABLE" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o units_export.csv
```

---

## 🎨 Componentes Frontend

### BulkActionsPanel
Barra flotante para selección múltiple:
- Cambiar estado masivo
- Actualizar precios (% o fijo)
- Eliminar múltiples

### CsvUploadWizard
Wizard de importación CSV:
- Vista previa (dry-run)
- Validación automática
- Reporte de errores
- Actualización de existentes

---

## 🔐 Roles y Permisos

| Rol | Descripción | Permisos Clave |
|-----|-------------|----------------|
| **SUPER_ADMIN** | Staff MAGAMA | Crear proyectos, gestionar monedas, acceso total |
| **ADMIN** | Admin de cliente | Gestionar inventario, equipo, integraciones |
| **MANAGER** | Jefe de ventas | Bulk ops, CSV import, gestión de leads |
| **AGENT** | Vendedor | Gestión de sus leads |
| **USER** | Usuario básico | Lectura |
| **VIEWER** | Solo lectura | Ver datos |

---

## 💱 Sistema Multi-Moneda

### Monedas Configuradas

| Código | Nombre | Símbolo | Decimales |
|--------|--------|---------|-----------|
| USD | Dólar estadounidense | $ | 2 |
| CLP | Peso chileno | $ | 0 |
| UF | Unidad de Fomento | UF | 2 |

### API de Conversión

```bash
curl "http://localhost:3000/api/currencies/convert?from=USD&to=CLP&amount=100" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📖 Documentación Completa

- 📄 **README completo**: [README.md](../README.md)
- 🚀 **Walkthrough**: [walkthrough.md](walkthrough.md)
- 📋 **Plan de implementación**: [implementation_plan.md](implementation_plan.md)
- ✅ **Task list**: [task.md](task.md)

---

## 🐛 Troubleshooting

### Error: Cannot connect to database
```bash
# Verificar que Docker esté corriendo
docker-compose ps

# Reiniciar servicios
docker-compose restart
```

### Error: Port already in use
```bash
# Cambiar puerto en .env
PORT=3001  # En apps/api/.env
```

### Error: Prisma Client not generated
```bash
cd packages/database
pnpm prisma generate
```

---

## 🚀 Próximos Pasos

1. **Crear datos de prueba**: Proyectos, unidades, leads
2. **Probar bulk operations** desde la UI
3. **Importar CSV** con datos reales
4. **Configurar integraciones CRM** (opcional)
5. **Deploy a staging** cuando estés listo

---

## 📞 Soporte

Para preguntas o issues, contacta al equipo de desarrollo.

**¡Disfruta usando V3D Platform!** 🎉

# V3D Platform - Setup Scripts Guide

Automatización completa para inicializar tu entorno de desarrollo local.

## 📋 Contenido

- **`setup.sh`** - Script para macOS/Linux
- **`setup.ps1`** - Script para Windows PowerShell
- Este archivo README

---

## 🚀 Quick Start

### macOS / Linux

```bash
# Dale permisos de ejecución al script (primera vez)
chmod +x setup.sh

# Ejecuta el setup completo
./setup.sh

# O modo rápido (solo Docker, asume deps instaladas)
./setup.sh --quick

# O limpia todo y empieza de cero
./setup.sh --clean
```

### Windows PowerShell

```powershell
# Abre PowerShell como Administrator

# Ejecuta el setup completo
.\setup.ps1

# O modo rápido (solo Docker)
.\setup.ps1 -Quick

# O limpia todo y empieza de cero
.\setup.ps1 -Clean

# Ver ayuda
.\setup.ps1 -Help
```

---

## 📝 Qué Hace Cada Script

### Setup Completo (Default)

1. **Verifica Prerequisites**
   - Node.js 18+
   - Docker
   - Docker Compose
   - pnpm (instala si falta)

2. **Crea Archivos de Configuración**
   - `apps/api/.env.local`
   - `apps/web/.env.local`

3. **Instala Dependencias**
   - `pnpm install` en monorepo
   - Genera Prisma Client

4. **Levanta Docker Services**
   - PostgreSQL 15.5
   - Redis 7.2
   - pgAdmin (UI)
   - Redis Commander (UI)

5. **Ejecuta Migraciones**
   - Crea tablas en base de datos
   - Inicializa schema

6. **Verifica Salud**
   - Comprueba conectividad a PostgreSQL
   - Comprueba conectividad a Redis
   - Muestra resumen de servicios

---

## ⚡ Modos de Ejecución

### Full Setup (Recomendado primera vez)

```bash
./setup.sh
# o
.\setup.ps1
```

**Toma ~3-5 minutos**
- Ideal si es la primera vez
- Instala todo desde cero
- Configura base de datos

### Quick Mode (Desarrollo iterativo)

```bash
./setup.sh --quick
# o
.\setup.ps1 -Quick
```

**Toma ~1 minuto**
- Asume que ya tienes dependencias instaladas
- Solo levanta Docker services
- Útil después de reiniciar la máquina

### Clean Mode (Reset completo)

```bash
./setup.sh --clean
# o
.\setup.ps1 -Clean
```

**Toma ~5 minutos**
- Elimina TODOS los volúmenes Docker
- Limpia datos de PostgreSQL y Redis
- Ejecuta setup completo desde cero
- Útil si tienes problemas con la DB

---

## 🔧 Lo Que Se Instala/Configura

### Variables de Entorno

**`apps/api/.env.local`:**
```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/v3ddb
REDIS_URL=redis://:redis123@localhost:6379
JWT_SECRET=dev-secret-key-change-in-production-12345678901234567890
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
AWS_REGION=us-east-1
S3_BUCKET=v3d-media-dev
```

**`apps/web/.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=development
```

### Dependencias Node.js

- **Backend**: Express, Prisma, JWT, bcryptjs, Zod, TypeScript
- **Frontend**: Next.js, React, Tailwind CSS
- **Dev**: ESLint, Prettier, TypeScript

Ver `api-package.json` para lista completa.

### Docker Services

| Servicio | Puerto | Usuario | Contraseña | URL |
|----------|--------|---------|-----------|-----|
| PostgreSQL | 5432 | postgres | postgres | - |
| Redis | 6379 | - | redis123 | - |
| pgAdmin | 5050 | admin@v3d.local | admin | http://localhost:5050 |
| Redis Commander | 8081 | - | - | http://localhost:8081 |

---

## 📊 Output Esperado

Al terminar, deberías ver:

```
════════════════════════════════════════════════════════════
Setup Summary
════════════════════════════════════════════════════════════

✅ V3D Platform Local Development Environment Ready!

📦 Services Running:
  PostgreSQL  → localhost:5432
  Redis       → localhost:6379
  pgAdmin     → http://localhost:5050
  Redis CMD   → http://localhost:8081

🚀 Next Steps:
  1. Start the API server:
     cd apps/api && pnpm run dev

  2. In another terminal, start the frontend:
     cd apps/web && pnpm run dev

  3. Open your browser:
     http://localhost:3001

📝 Useful Commands:
  View logs:           docker-compose logs -f [service]
  Stop services:       docker-compose down
  Reset database:      docker-compose down -v && ./setup.sh
  Prisma Studio:       cd packages/database && pnpm exec prisma studio
  Run migrations:      cd packages/database && pnpm exec prisma migrate dev

🔗 Access Points:
  pgAdmin:             http://localhost:5050 (admin@v3d.local / admin)
  Redis Commander:     http://localhost:8081
  API (local):         http://localhost:3000
  Frontend (local):    http://localhost:3001

📚 Documentation:
  See DEVELOPMENT_ROADMAP.md for next phases
  See DEPLOYMENT_GUIDE.md for production setup

Happy coding! 🚀
```

---

## ❌ Troubleshooting

### Error: "Docker is not running"

```bash
# macOS
open /Applications/Docker.app

# Windows
# Abre Docker Desktop desde el menú Start
```

### Error: "Port 5432 already in use"

```bash
# Detener contenedores previos
docker-compose down

# O mata el proceso
lsof -ti:5432 | xargs kill -9  # macOS/Linux
# Windows: usa Task Manager para matar procesos Docker
```

### Error: "PostgreSQL failed to start"

```bash
# Limpiar y reintentar
docker-compose down -v
./setup.sh  # o .\setup.ps1

# Verificar logs
docker-compose logs postgres
```

### Error: "pnpm not found after installation"

```bash
# Reinicia la terminal o:
npm install -g pnpm
pnpm --version
```

### Error: "Database connection failed"

```bash
# Verificar que PostgreSQL está corriendo
docker-compose ps

# Ver logs
docker-compose logs postgres

# Reintentar manualmente
docker-compose exec postgres psql -U postgres -d v3ddb
```

### Error: "Prisma migrations failed"

```bash
# Ejecutar manualmente
cd packages/database
pnpm exec prisma migrate dev --name init

# O resetear (destructivo!)
pnpm exec prisma migrate reset --force
```

---

## 🔄 Operaciones Comunes Después del Setup

### Ver Logs

```bash
# API
docker-compose logs -f api

# PostgreSQL
docker-compose logs -f postgres

# Redis
docker-compose logs -f redis

# Todos
docker-compose logs -f
```

### Pausar Servicios

```bash
# Parar sin borrar datos
docker-compose stop

# Reanudar
docker-compose start
```

### Resetear Base de Datos

```bash
# Opción 1: Suave (preserva estructura)
docker-compose exec postgres psql -U postgres -d v3ddb -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Opción 2: Nuclear (todo limpio)
docker-compose down -v
./setup.sh  # o .\setup.ps1
```

### Ejecutar Comandos en Contenedores

```bash
# En PostgreSQL
docker-compose exec postgres psql -U postgres -d v3ddb

# En Redis
docker-compose exec redis redis-cli

# En API
docker-compose exec api bash
```

### Actualizar Dependencias

```bash
# Backend
cd apps/api
pnpm update

# Frontend
cd apps/web
pnpm update

# Database
cd packages/database
pnpm update
```

---

## 🐛 Debugging

### Habilitar Logs Detallados

```bash
# En apps/api/.env.local
LOG_LEVEL=debug

# O en el código
import debug from 'debug';
const log = debug('v3d:*');
```

### Usar Prisma Studio

```bash
cd packages/database
pnpm exec prisma studio
# Abre http://localhost:5555 en el navegador
```

### Inspeccionar Base de Datos

```bash
# pgAdmin: http://localhost:5050
# Usuario: admin@v3d.local
# Contraseña: admin
```

### Inspeccionar Redis

```bash
# Redis Commander: http://localhost:8081
# O CLI:
docker-compose exec redis redis-cli
# Comandos útiles:
# > KEYS *
# > GET nombre_clave
# > FLUSHDB
```

---

## 📋 Checklist Post-Setup

- [ ] `docker-compose ps` muestra 5 servicios running
- [ ] `curl http://localhost:3000/health` retorna 200
- [ ] Puedo acceder a pgAdmin en http://localhost:5050
- [ ] Puedo acceder a Redis Commander en http://localhost:8081
- [ ] `cd apps/api && pnpm run dev` inicia sin errores
- [ ] `cd apps/web && pnpm run dev` inicia sin errores
- [ ] http://localhost:3001 carga en el navegador

---

## 🆘 Obtener Ayuda

### Dentro del Script

```bash
./setup.sh --help
# o
.\setup.ps1 -Help
```

### Ver Documentación

- **DEPLOYMENT_GUIDE.md** - Guía de deployment a AWS
- **DEVELOPMENT_ROADMAP.md** - Plan de desarrollo 24 semanas
- **EXECUTIVE_SUMMARY.md** - Resumen técnico
- **FINAL_SUMMARY.md** - Visión general completa

### Comandos Útiles

```bash
# Ver versiones instaladas
node --version
docker --version
pnpm --version

# Verificar conectividad
docker-compose exec postgres pg_isready
docker-compose exec redis redis-cli ping

# Ver estado detallado
docker-compose ps -a
docker-compose config
```

---

## 💡 Tips & Tricks

### Desarrollo Eficiente

```bash
# Terminal 1: Servicios Docker
docker-compose up -d && docker-compose logs -f

# Terminal 2: API server (con hot reload)
cd apps/api && pnpm run dev

# Terminal 3: Frontend server (con hot reload)
cd apps/web && pnpm run dev

# Terminal 4: Prisma Studio (para BD)
cd packages/database && pnpm exec prisma studio
```

### Limpiar Cache Frecuentemente

```bash
# Node modules
pnpm store prune

# Docker
docker system prune -a

# npm cache
npm cache clean --force
```

### Monitorear Uso de Recursos

```bash
# Docker stats en tiempo real
docker stats

# Ver consumo de puertos
netstat -an | grep LISTEN  # macOS/Linux
netstat -ano | findstr LISTENING  # Windows
```

---

## 🎯 Próximos Pasos

Una vez completado el setup:

1. **Lee DEVELOPMENT_ROADMAP.md** para ver las fases
2. **Implementa Authentication** (Week 2-3)
3. **Crea CRUD endpoints** (Week 4-5)
4. **Construye UI** (Week 6-7)
5. **Deploy a AWS** (Week 8-9)

---

## 📞 Soporte

Si algo no funciona:

1. Copia el output completo del script
2. Revisa la sección Troubleshooting
3. Consulta los logs: `docker-compose logs -f`
4. Intenta `./setup.sh --clean` para reset completo

---

**¡Listo para desarrollar tu SaaS! 🚀**

# V3D Platform - Deployment & Development Guide

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- pnpm (package manager)
- PostgreSQL (via Docker)

### Initial Setup

```bash
# 1. Install pnpm globally (if not installed)
npm install -g pnpm

# 2. Clone repository
cd /path/to/v3d-platform

# 3. Run setup script
chmod +x setup.sh
./setup.sh

# 4. Start Docker services
docker-compose up -d

# 5. Apply database migrations
cd packages/database
pnpm prisma migrate dev

# 6. Generate Prisma Client
pnpm prisma generate
```

### Running the Application

```bash
# Terminal 1: Start API
cd apps/api
pnpm run dev
# API running on http://localhost:3000

# Terminal 2: Start Frontend
cd apps/web
pnpm run dev
# Frontend running on http://localhost:3001
```

### Access the Application

**URL**: http://localhost:3001

**Default Credentials**:
- Email: `admin@v3d.com`
- Password: `Admin123!`

Or create a new account at `/auth/register`

---

## 🏗️ Project Structure

```
v3d-platform/
├── apps/
│   ├── api/              # Express.js Backend
│   │   └── src/
│   │       ├── controllers/
│   │       ├── services/
│   │       ├── middleware/
│   │       ├── routes/
│   │       └── validators/
│   └── web/              # Next.js 14 Frontend
│       ├── app/          # App Router pages
│       └── lib/          # Utilities & context
├── packages/
│   └── database/         # Prisma Schema & Migrations
├── infrastructure/
│   └── terraform/        # AWS Infrastructure as Code
├── docker-compose.yml    # Local development services
└── setup.sh             # Automated setup script
```

---

## 🔐 Environment Variables

### Backend (`apps/api/.env.local`)

```bash
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/v3ddb

# Redis
REDIS_URL=redis://:redis123@localhost:6379

# JWT Secret (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-key-minimum-32-characters-long

# CORS
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# AWS (Optional, for file uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=v3d-uploads
```

### Frontend (`apps/web/.env.local`)

```bash
# API URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# Environment
NEXT_PUBLIC_ENVIRONMENT=development
```

### Database (`packages/database/.env`)

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/v3ddb
```

---

## 📦 Available Scripts

### API

```bash
cd apps/api

# Development with hot reload
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm start

# Type checking
pnpm run typecheck
```

### Frontend

```bash
cd apps/web

# Development server
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm start

# Lint
pnpm run lint
```

### Database

```bash
cd packages/database

# Create new migration
pnpm prisma migrate dev --name migration_name

# Apply migrations
pnpm prisma migrate deploy

# Generate Prisma Client
pnpm prisma generate

# Open Prisma Studio (DB GUI)
pnpm prisma studio
```

---

## 🐳 Docker Services

### Services Running
- **PostgreSQL**: Port 5432
- **Redis**: Port 6379
- **pgAdmin**: http://localhost:5050 (admin@v3d.local / admin)
- **Redis Commander**: http://localhost:8081

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart postgres

# Remove volumes (WARNING: data loss)
docker-compose down -v
```

---

## 🔒 Security Checklist

### Before Production Deployment

- [ ] Change `JWT_SECRET` to a strong random string (minimum 32 characters)
- [ ] Update database passwords
- [ ] Configure CORS for your production domain
- [ ] Enable HTTPS/SSL
- [ ] Set up rate limiting
- [ ] Configure environment-specific secrets
- [ ] Enable database backups
- [ ] Set up monitoring & alerting
- [ ] Review and update ALLOWED_ORIGINS
- [ ] Implement CAPTCHA on registration
- [ ] Set secure cookie flags
- [ ] Configure CSP headers

---

## 🚀 Production Deployment (AWS)

### Prerequisites
- AWS Account
- Terraform installed
- AWS CLI configured

### Deployment Steps

```bash
# 1. Navigate to terraform directory
cd infrastructure/terraform

# 2. Initialize Terraform
terraform init

# 3. Review changes
terraform plan

# 4. Apply infrastructure
terraform apply

# 5. Build Docker images
docker build -t v3d-api:latest -f apps/api/Dockerfile.api .
docker build -t v3d-web:latest -f apps/web/Dockerfile .

# 6. Push to ECR (after terraform creates repositories)
# Follow AWS ECR push commands from terraform output

# 7. Update ECS services
# ECS will automatically deploy new images
```

### Environment Variables for Production

Set these in AWS Systems Manager Parameter Store or Secrets Manager:
- `DATABASE_URL`
- `JWT_SECRET`
- `REDIS_URL`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

---

## 📊 Database Schema

### Main Models
- **User**: Authentication & user management
- **Organization**: Multi-tenant support
- **Project**: Real estate projects
- **Unit**: Property units (apartments, houses, etc.)
- **Lead**: Sales leads & CRM
- **Message**: Communication logs
- **AuditLog**: Activity tracking
- **Integration**: Third-party integrations
- **ApiKey**: API access management

### Key Relationships
- User → Organization (many-to-one)
- Project → Organization (many-to-one)
- Unit → Project (many-to-one)
- Lead → Project (many-to-one)
- Lead → User (assigned_to, many-to-one)

---

## 🧪 Testing

### Manual Testing Checklist

**Authentication**:
- [ ] User registration works
- [ ] Login with correct credentials
- [ ] Login fails with wrong credentials
- [ ] Token refresh works
- [ ] Protected routes redirect to login

**Projects**:
- [ ] Can create project
- [ ] Can view projects list
- [ ] Can filter and search projects
- [ ] Can view project detail
- [ ] Can edit project
- [ ] Can delete project

**Leads**:
- [ ] Can create lead
- [ ] Can view leads table
- [ ] Can filter by stage
- [ ] Can search leads
- [ ] Lead stages update correctly

**Units** (API):
- [ ] Can create unit via API
- [ ] Can filter units by price/type
- [ ] Unit statuses work correctly

---

## 🐛 Troubleshooting

### API not starting
```bash
# Check if port 3000 is in use
lsof -i :3000

# Verify database connection
cd packages/database
pnpm prisma studio
```

### Frontend not building
```bash
# Clear Next.js cache
rm -rf apps/web/.next

# Reinstall dependencies
cd apps/web
rm -rf node_modules
pnpm install
```

### Database migration issues
```bash
# Reset database (WARNING: data loss)
cd packages/database
pnpm prisma migrate reset

# Force regenerate client
pnpm prisma generate --force
```

### Docker issues
```bash
# Clean Docker system
docker system prune -a

# Rebuild containers
docker-compose down
docker-compose up -d --build
```

---

## 📝 API Documentation

### Base URL
- Development: `http://localhost:3000`
- Production: `https://api.yourdomain.com`

### Authentication
All protected endpoints require:
```
Authorization: Bearer <access_token>
```

### Main Endpoints

**Auth**:
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `GET /auth/me` - Current user
- `POST /auth/refresh` - Refresh token

**Projects**:
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

**Leads**:
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `GET /api/leads/:id` - Get lead
- `PUT /api/leads/:id` - Update lead
- `PUT /api/leads/:id/stage` - Update stage

**Units**:
- `GET /api/units` - List units
- `POST /api/units` - Create unit
- `GET /api/units/:id` - Get unit
- `PUT /api/units/:id` - Update unit

**Analytics**:
- `GET /api/analytics/dashboard` - Dashboard statistics

---

## 🔄 Continuous Integration/Deployment

### GitHub Actions (Example)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Build and push Docker images
        run: |
          # Your build commands
          
      - name: Deploy to ECS
        run: |
          # Your deployment commands
```

---

## 📞 Support & Maintenance

### Logs Location
- API logs: Console output (development)
- Database logs: Docker logs for postgres container
- Application logs: CloudWatch (production)

### Monitoring
- Health check: `GET /health`
- API info: `GET /api/info`
- Database: Prisma Studio or pgAdmin

### Backup Strategy (Production)
1. Daily automated RDS snapshots
2. Transaction logs for point-in-time recovery
3. Weekly full database exports to S3
4. Test restore procedures monthly

---

## 🎯 Performance Optimization

### Database
- Indexed fields: email, organization_id, project_id
- Connection pooling enabled
- Query optimization with Prisma

### API
- Stateless design for horizontal scaling
- Ready for Redis caching
- Gzip compression enabled (Helmet)

### Frontend
- Next.js automatic code splitting
- Image optimization ready
- Static page generation where applicable

---

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [AWS Documentation](https://docs.aws.amazon.com/)

---

## 📄 License & Credits

**V3D Platform**  
Enterprise SaaS for Real Estate Technology

Built with:
- Node.js + Express.js
- Next.js 14
- Prisma ORM
- PostgreSQL
- Redis
- AWS (Terraform)
- TypeScript

---

**Need Help?** Check logs, review this README, or contact your development team.

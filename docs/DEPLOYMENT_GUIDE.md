# V3D Platform - Deployment & Execution Guide

## 🎯 Overview

**V3D Platform** is a **production-ready Enterprise SaaS** built with:
- **Infrastructure**: AWS ECS Fargate, RDS PostgreSQL, ElastiCache Redis, CloudFront CDN
- **Backend**: Express.js + Prisma ORM + Node.js
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **IaC**: Terraform (5 files + variables)
- **CI/CD**: GitHub Actions (prepared)
- **Database**: PostgreSQL 15.5 Multi-AZ with auto-scaling

---

## 📦 Project Structure

```
v3d-platform/
├── apps/
│   ├── api/                          # Express.js backend
│   │   ├── src/
│   │   │   ├── index.ts             # App entry point
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts          # JWT authentication
│   │   │   │   └── errorHandler.ts
│   │   │   ├── routes/
│   │   │   │   ├── projects.ts
│   │   │   │   ├── leads.ts
│   │   │   │   └── users.ts
│   │   │   └── controllers/
│   │   │       └── projects.controller.ts
│   │   ├── Dockerfile.api
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                         # Next.js frontend
│       ├── app/
│       │   ├── dashboard/
│       │   │   └── page.tsx         # Dashboard page
│       │   └── layout.tsx
│       ├── components/
│       │   └── ProjectsTable.tsx    # Projects table component
│       ├── package.json
│       └── next.config.js
├── packages/
│   └── database/                    # Prisma shared schema
│       └── prisma/
│           └── schema.prisma
├── infrastructure/
│   └── terraform/
│       ├── provider.tf              # AWS provider config
│       ├── variables.tf             # Input variables
│       ├── vpc.tf                   # VPC & networking
│       ├── rds.tf                   # PostgreSQL + Redis
│       ├── ecs.tf                   # ECS Fargate cluster
│       └── alb.tf                   # Load balancer & CDN
├── docker-compose.yml               # Local dev environment
├── .github/
│   └── workflows/
│       ├── build-api.yml
│       └── deploy-terraform.yml
└── README.md
```

---

## 🚀 PHASE 1: LOCAL DEVELOPMENT SETUP

### Prerequisites

```bash
# Install tools
brew install docker docker-compose terraform aws-cli node@18 pnpm

# Verify installations
docker --version      # Docker 24+
terraform --version   # Terraform 1.5+
node --version        # Node 18+
```

### Step 1: Clone & Install Dependencies

```bash
# Clone repository
git clone https://github.com/yourorg/v3d-platform.git
cd v3d-platform

# Install dependencies
pnpm install

# Install Prisma client
cd packages/database
pnpm exec prisma generate
```

### Step 2: Create `.env` Files

**`apps/api/.env.local`:**
```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/v3ddb

# Redis
REDIS_URL=redis://:redis123@localhost:6379

# JWT
JWT_SECRET=dev-secret-key-change-in-production

# CORS
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# AWS (local mock)
AWS_REGION=us-east-1
S3_BUCKET=v3d-media-dev
```

**`apps/web/.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=development
```

### Step 3: Start Local Environment with Docker Compose

```bash
# Start all services (PostgreSQL, Redis, API)
docker-compose up -d

# Verify services are running
docker-compose ps

# View API logs
docker-compose logs -f api

# Access services:
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - pgAdmin: http://localhost:5050 (admin@v3d.local / admin)
# - Redis Commander: http://localhost:8081
# - API: http://localhost:3000/health
```

### Step 4: Initialize Database (Prisma Migrations)

```bash
# Run migrations
cd packages/database
pnpm exec prisma migrate dev --name init

# Generate Prisma client
pnpm exec prisma generate

# Seed database (optional)
pnpm exec prisma db seed
```

### Step 5: Start Development Servers

**Terminal 1: API Server**
```bash
cd apps/api
pnpm run dev
# Running on http://localhost:3000
```

**Terminal 2: Frontend**
```bash
cd apps/web
pnpm run dev
# Running on http://localhost:3001
```

---

## ☁️ PHASE 2: AWS INFRASTRUCTURE DEPLOYMENT

### Prerequisites

```bash
# Configure AWS CLI
aws configure

# Verify AWS credentials
aws sts get-caller-identity

# Create S3 bucket for Terraform state
aws s3 mb s3://v3d-terraform-state --region us-east-1

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

### Step 1: Initialize Terraform

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Format files
terraform fmt -recursive
```

### Step 2: Create `terraform.tfvars`

**`infrastructure/terraform/terraform.tfvars`:**
```hcl
environment = "prod"
aws_region  = "us-east-1"

# Compute
container_image = "YOUR_ECR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/v3d-api:latest"
ecs_desired_count = 2
ecs_min_capacity = 2
ecs_max_capacity = 20

# Database
rds_instance_class = "db.t3.medium"
rds_username = "v3dadmin"
rds_password = "YourSecurePassword123!" # Change this!

# Domain & TLS
acm_certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT:certificate/UUID"
domain_name = "api.v3d.com"
s3_bucket_name_media = "v3d-media-prod-ACCOUNT_ID"

# Features
enable_redis = true
cloudfront_enabled = true
```

### Step 3: Plan & Apply Terraform

```bash
# Create Terraform plan
terraform plan -out=tfplan

# Review the plan carefully
cat tfplan | less

# Apply configuration
terraform apply tfplan

# Save outputs for reference
terraform output -json > terraform-outputs.json
```

### Step 4: Build & Push Docker Image to ECR

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name v3d-api \
  --region us-east-1

# Get ECR login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build Docker image
docker build \
  -f apps/api/Dockerfile.api \
  -t v3d-api:latest \
  -t YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/v3d-api:latest \
  .

# Push to ECR
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/v3d-api:latest
```

### Step 5: Configure Secrets Manager

```bash
# Database URL (already created by Terraform, but verify)
aws secretsmanager get-secret-value \
  --secret-id v3d/database-url-prod \
  --region us-east-1

# JWT Secret (already created by Terraform)
aws secretsmanager get-secret-value \
  --secret-id v3d/jwt-secret-prod \
  --region us-east-1

# Redis URL (if enabled)
aws secretsmanager get-secret-value \
  --secret-id v3d/redis-url-prod \
  --region us-east-1
```

### Step 6: Migrate Database

```bash
# Use AWS Systems Manager Session Manager to run migrations in ECS task
aws ecs execute-command \
  --cluster v3d-cluster-prod \
  --task TASK_ID \
  --container v3d-api \
  --interactive \
  --command "/bin/sh"

# Inside the ECS task:
npx prisma migrate deploy
```

---

## 🔄 PHASE 3: CI/CD SETUP (GitHub Actions)

### Step 1: Create GitHub Secrets

```bash
# In GitHub repository settings > Secrets and variables > Actions

# AWS Credentials
AWS_ACCOUNT_ID=123456789
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# Docker Registry
ECR_REGISTRY=123456789.dkr.ecr.us-east-1.amazonaws.com
ECR_REPOSITORY=v3d-api

# Terraform
TF_API_TOKEN=... # Optional: for Terraform Cloud
```

### Step 2: Create GitHub Action Workflows

**`.github/workflows/build-api.yml`:**
```yaml
name: Build & Push API

on:
  push:
    branches: [main, develop]
    paths:
      - 'apps/api/**'
      - 'packages/database/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}
      
      - name: Login to ECR
        run: |
          aws ecr get-login-password --region ${{ secrets.AWS_REGION }} | \
          docker login --username AWS --password-stdin ${{ secrets.ECR_REGISTRY }}
      
      - name: Build Docker image
        run: |
          docker build \
            -f apps/api/Dockerfile.api \
            -t ${{ secrets.ECR_REGISTRY }}/${{ secrets.ECR_REPOSITORY }}:${{ github.sha }} \
            -t ${{ secrets.ECR_REGISTRY }}/${{ secrets.ECR_REPOSITORY }}:latest \
            .
      
      - name: Push to ECR
        run: |
          docker push ${{ secrets.ECR_REGISTRY }}/${{ secrets.ECR_REPOSITORY }}:${{ github.sha }}
          docker push ${{ secrets.ECR_REGISTRY }}/${{ secrets.ECR_REPOSITORY }}:latest
      
      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster v3d-cluster-prod \
            --service v3d-api-prod \
            --force-new-deployment
```

---

## 🔍 PHASE 4: MONITORING & OPERATIONS

### CloudWatch Dashboards

```bash
# View ECS service metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=v3d-api-prod Name=ClusterName,Value=v3d-cluster-prod \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average
```

### Auto-Scaling Verification

```bash
# Check auto-scaling target
aws application-autoscaling describe-scalable-targets \
  --service-namespace ecs \
  --region us-east-1

# Check auto-scaling policies
aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs \
  --region us-east-1
```

### Database Backups

```bash
# View RDS backups
aws rds describe-db-snapshots \
  --db-instance-identifier v3d-db-prod
```

---

## 🧪 TESTING

### API Testing

```bash
# Health check
curl -X GET http://localhost:3000/health

# Get projects (with JWT token)
curl -X GET \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/projects?page=1&limit=10

# Create project
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","description":"A test"}' \
  http://localhost:3000/api/projects
```

### Load Testing

```bash
# Install k6
brew install k6

# Run load test
k6 run scripts/load-test.js

# Example load test (scripts/load-test.js):
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const url = 'http://localhost:3000/health';
  const res = http.get(url);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
```

---

## 🧹 CLEANUP

### Destroy Infrastructure

```bash
# WARNING: This will delete all resources
cd infrastructure/terraform
terraform destroy

# Clean up S3 state bucket (optional)
aws s3 rb s3://v3d-terraform-state --force
```

### Stop Local Services

```bash
docker-compose down
docker-compose down -v  # Also remove volumes
```

---

## 📊 Key Metrics & SLOs

| Metric | Target | Tool |
|--------|--------|------|
| API Availability | 99.95% | CloudWatch |
| P99 Latency | <200ms | CloudWatch |
| Database CPU | <70% | RDS Performance Insights |
| ECS Task CPU | <70% | CloudWatch |
| Error Rate | <0.1% | CloudWatch Logs |

---

## 🔐 Security Checklist

- [x] HTTPS/TLS encryption (ALB + ACM certificate)
- [x] VPC isolation (Private subnets for RDS/ECS)
- [x] Database encryption (KMS keys for RDS, ElastiCache)
- [x] Secrets management (AWS Secrets Manager)
- [x] IAM roles (Principle of least privilege)
- [x] Security groups (Restricted ingress/egress)
- [x] VPC endpoints (Secure S3 access)
- [x] Audit logging (RDS, ElastiCache, CloudWatch)
- [x] JWT authentication (Token-based API access)
- [x] Input validation (Zod schema validation)

---

## 🤝 Support & Resources

- **Terraform Docs**: https://registry.terraform.io/providers/hashicorp/aws/latest/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Express.js Docs**: https://expressjs.com
- **Next.js Docs**: https://nextjs.org/docs
- **AWS ECS**: https://docs.aws.amazon.com/ecs

---

## 📝 License

V3D Platform © 2024. All rights reserved.

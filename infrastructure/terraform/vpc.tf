# V3D Platform - VPC & Networking Configuration
# Multi-AZ VPC with public/private subnets, NAT gateways, and security groups

# ============================================
# VPC
# ============================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-vpc-${var.environment}" }
  )
}

# ============================================
# PUBLIC SUBNETS (for ALB and NAT)
# ============================================

resource "aws_subnet" "public" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    { 
      Name = "${var.app_name}-public-subnet-${count.index + 1}-${var.environment}"
      Type = "Public"
    }
  )
}

# ============================================
# PRIVATE SUBNETS (for ECS and RDS)
# ============================================

resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 101}.0/24"
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    local.common_tags,
    { 
      Name = "${var.app_name}-private-subnet-${count.index + 1}-${var.environment}"
      Type = "Private"
    }
  )
}

# ============================================
# DATABASE SUBNETS (for RDS)
# ============================================

resource "aws_subnet" "db" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 201}.0/24"
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    local.common_tags,
    { 
      Name = "${var.app_name}-db-subnet-${count.index + 1}-${var.environment}"
      Type = "Database"
    }
  )
}

# ============================================
# INTERNET GATEWAY
# ============================================

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-igw-${var.environment}" }
  )
}

# ============================================
# NAT GATEWAYS (one per AZ for high availability)
# ============================================

resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  depends_on = [aws_internet_gateway.main]

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-eip-nat-${count.index + 1}-${var.environment}" }
  )
}

resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  depends_on = [aws_internet_gateway.main]

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-nat-${count.index + 1}-${var.environment}" }
  )
}

# ============================================
# ROUTE TABLES
# ============================================

# Public route table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block      = "0.0.0.0/0"
    gateway_id      = aws_internet_gateway.main.id
  }

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-public-rt-${var.environment}" }
  )
}

resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private route tables (one per AZ for NAT redundancy)
resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block      = "0.0.0.0/0"
    nat_gateway_id  = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-private-rt-${count.index + 1}-${var.environment}" }
  )
}

resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# DB route table (no internet access)
resource "aws_route_table" "db" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-db-rt-${var.environment}" }
  )
}

resource "aws_route_table_association" "db" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.db[count.index].id
  route_table_id = aws_route_table.db.id
}

# ============================================
# SECURITY GROUPS
# ============================================

# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "${var.app_name}-alb-sg-${var.environment}"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from anywhere"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from anywhere"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-alb-sg-${var.environment}" }
  )
}

# ECS Tasks Security Group
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.app_name}-ecs-tasks-sg-${var.environment}"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "From ALB"
  }

  # Allow container to communicate with other containers
  ingress {
    from_port = 0
    to_port   = 65535
    protocol  = "tcp"
    self      = true
    description = "Container-to-container communication"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-ecs-tasks-sg-${var.environment}" }
  )
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name        = "${var.app_name}-rds-sg-${var.environment}"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
    description     = "From ECS tasks"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-rds-sg-${var.environment}" }
  )
}

# ElastiCache Security Group
resource "aws_security_group" "redis" {
  count       = var.enable_redis ? 1 : 0
  name        = "${var.app_name}-redis-sg-${var.environment}"
  description = "Security group for ElastiCache Redis"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
    description     = "From ECS tasks"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-redis-sg-${var.environment}" }
  )
}

# ============================================
# VPC ENDPOINTS (for secure S3 access)
# ============================================

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = concat(
    [aws_route_table.public.id],
    aws_route_table.private[*].id,
    [aws_route_table.db.id]
  )

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-s3-endpoint-${var.environment}" }
  )
}

# ============================================
# OUTPUTS
# ============================================

output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID"
}

output "public_subnet_ids" {
  value       = aws_subnet.public[*].id
  description = "Public subnet IDs"
}

output "private_subnet_ids" {
  value       = aws_subnet.private[*].id
  description = "Private subnet IDs"
}

output "db_subnet_ids" {
  value       = aws_subnet.db[*].id
  description = "Database subnet IDs"
}

output "alb_security_group_id" {
  value       = aws_security_group.alb.id
  description = "ALB security group ID"
}

output "ecs_tasks_security_group_id" {
  value       = aws_security_group.ecs_tasks.id
  description = "ECS tasks security group ID"
}

output "rds_security_group_id" {
  value       = aws_security_group.rds.id
  description = "RDS security group ID"
}

output "redis_security_group_id" {
  value       = var.enable_redis ? aws_security_group.redis[0].id : null
  description = "Redis security group ID"
}

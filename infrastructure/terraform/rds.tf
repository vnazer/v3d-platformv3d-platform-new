# V3D Platform - RDS PostgreSQL & ElastiCache Redis Configuration

# ============================================
# RDS SUBNET GROUP
# ============================================

resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-db-subnet-group-${var.environment}"
  subnet_ids = aws_subnet.db[*].id

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-db-subnet-group-${var.environment}" }
  )
}

# ============================================
# RDS PARAMETER GROUP (PostgreSQL 15.5)
# ============================================

resource "aws_db_parameter_group" "postgres" {
  family      = "postgres15"
  name        = "${var.app_name}-postgres15-${var.environment}"
  description = "Parameter group for PostgreSQL 15.5"

  # Performance and security settings
  parameter {
    name  = "max_connections"
    value = "1000"
  }

  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/4}"
    apply_method = "pending-reboot"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries taking >1 second
  }

  parameter {
    name  = "ssl"
    value = "1"
    apply_method = "pending-reboot"
  }

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-postgres-params-${var.environment}" }
  )
}

# ============================================
# RDS INSTANCE (PostgreSQL Multi-AZ)
# ============================================

resource "aws_db_instance" "main" {
  identifier     = "${var.app_name}-db-${var.environment}"
  engine         = "postgres"
  engine_version = var.rds_postgres_version

  # Instance sizing
  instance_class            = var.rds_instance_class
  allocated_storage         = var.rds_allocated_storage
  max_allocated_storage     = var.rds_max_allocated_storage
  storage_type              = "gp3"
  iops                      = 3000
  storage_throughput        = 125

  # Database configuration
  db_name  = var.rds_database_name
  username = var.rds_username
  password = var.rds_password

  # Multi-AZ for production
  multi_az               = var.rds_multi_az
  publicly_accessible    = false
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.postgres.name

  # Backups and maintenance
  backup_retention_period = var.rds_backup_retention_days
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"
  copy_tags_to_snapshot   = true

  # Security
  storage_encrypted          = true
  kms_key_id                 = aws_kms_key.rds.arn
  iam_database_authentication_enabled = true

  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql"]
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring.arn
  enable_performance_insights      = true
  performance_insights_retention_period = 7

  # Deletion protection
  deletion_protection = var.environment == "prod" ? true : false
  skip_final_snapshot = var.environment != "prod" ? true : false
  final_snapshot_identifier = var.environment == "prod" ? "${var.app_name}-db-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  depends_on = [aws_iam_role.rds_monitoring]

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-db-${var.environment}" }
  )
}

# ============================================
# KMS KEY FOR RDS ENCRYPTION
# ============================================

resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-rds-key-${var.environment}" }
  )
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${var.app_name}-rds-${var.environment}"
  target_key_id = aws_kms_key.rds.key_id
}

# ============================================
# IAM ROLE FOR RDS MONITORING
# ============================================

resource "aws_iam_role" "rds_monitoring" {
  name = "${var.app_name}-rds-monitoring-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-rds-monitoring-role-${var.environment}" }
  )
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ============================================
# ELASTICACHE SUBNET GROUP (Redis)
# ============================================

resource "aws_elasticache_subnet_group" "main" {
  count      = var.enable_redis ? 1 : 0
  name       = "${var.app_name}-redis-subnet-group-${var.environment}"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-redis-subnet-group-${var.environment}" }
  )
}

# ============================================
# ELASTICACHE REDIS CLUSTER
# ============================================

resource "aws_elasticache_replication_group" "main" {
  count = var.enable_redis ? 1 : 0

  replication_group_description = "Redis cluster for V3D caching and session storage"
  engine                         = "redis"
  engine_version                 = var.redis_engine_version
  node_type                      = var.redis_node_type
  num_cache_clusters             = var.redis_num_cache_clusters
  parameter_group_name           = aws_elasticache_parameter_group.redis[0].name
  port                           = 6379
  
  # High availability
  automatic_failover_enabled = var.redis_num_cache_clusters > 1 ? true : false
  multi_az_enabled           = var.redis_num_cache_clusters > 1 ? true : false
  
  # Network configuration
  subnet_group_name          = aws_elasticache_subnet_group.main[0].name
  security_group_ids         = [aws_security_group.redis[0].id]
  
  # Backup & Maintenance
  snapshot_retention_limit   = var.environment == "prod" ? 30 : 5
  snapshot_window            = "03:00-05:00"
  maintenance_window         = "mon:05:00-mon:07:00"
  automatic_backup_enabled   = true
  
  # Encryption
  at_rest_encryption_enabled = true
  kms_key_id                 = aws_kms_key.redis.arn
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth_token.result
  
  # Logging
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow_log[0].name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
    enabled          = true
  }

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_engine_log[0].name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "engine-log"
    enabled          = true
  }

  depends_on = [aws_elasticache_parameter_group.redis]

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-redis-${var.environment}" }
  )
}

# ============================================
# REDIS PARAMETER GROUP
# ============================================

resource "aws_elasticache_parameter_group" "redis" {
  count  = var.enable_redis ? 1 : 0
  family = "redis7"
  name   = "${var.app_name}-redis-params-${var.environment}"

  # Optimize for session storage and caching
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru" # Evict any key using LRU when max memory reached
  }

  parameter {
    name  = "timeout"
    value = "0"
  }

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-redis-params-${var.environment}" }
  )
}

# ============================================
# REDIS SECRETS
# ============================================

resource "random_password" "redis_auth_token" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "redis_auth_token" {
  count                   = var.enable_redis ? 1 : 0
  name                    = "${var.app_name}/redis/auth-token-${var.environment}"
  description             = "Redis AUTH token for V3D"
  recovery_window_in_days = 7

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-redis-secret-${var.environment}" }
  )
}

resource "aws_secretsmanager_secret_version" "redis_auth_token" {
  count         = var.enable_redis ? 1 : 0
  secret_id     = aws_secretsmanager_secret.redis_auth_token[0].id
  secret_string = random_password.redis_auth_token.result
}

# ============================================
# REDIS KMS KEY
# ============================================

resource "aws_kms_key" "redis" {
  description             = "KMS key for Redis encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-redis-key-${var.environment}" }
  )
}

resource "aws_kms_alias" "redis" {
  name          = "alias/${var.app_name}-redis-${var.environment}"
  target_key_id = aws_kms_key.redis.key_id
}

# ============================================
# CLOUDWATCH LOG GROUPS (Redis)
# ============================================

resource "aws_cloudwatch_log_group" "redis_slow_log" {
  count             = var.enable_redis ? 1 : 0
  name              = "/aws/elasticache/${var.app_name}-redis-slow-log-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-redis-slow-log-${var.environment}" }
  )
}

resource "aws_cloudwatch_log_group" "redis_engine_log" {
  count             = var.enable_redis ? 1 : 0
  name              = "/aws/elasticache/${var.app_name}-redis-engine-log-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-redis-engine-log-${var.environment}" }
  )
}

# ============================================
# OUTPUTS
# ============================================

output "rds_endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "RDS endpoint (host:port)"
}

output "rds_database_name" {
  value       = aws_db_instance.main.db_name
  description = "RDS database name"
}

output "rds_username" {
  value       = aws_db_instance.main.username
  description = "RDS master username"
}

output "redis_endpoint" {
  value       = var.enable_redis ? aws_elasticache_replication_group.main[0].configuration_endpoint_address : null
  description = "Redis configuration endpoint"
}

output "redis_auth_secret_arn" {
  value       = var.enable_redis ? aws_secretsmanager_secret.redis_auth_token[0].arn : null
  description = "ARN of Redis AUTH token secret"
}

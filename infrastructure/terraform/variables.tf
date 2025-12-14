# V3D Platform - Terraform Variables
# All configurable parameters for AWS infrastructure

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (prod, staging, dev)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "v3d"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for multi-AZ deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "container_image" {
  description = "Docker image URI for API container"
  type        = string
  # Example: 123456789.dkr.ecr.us-east-1.amazonaws.com/v3d-api:latest
}

variable "container_port" {
  description = "Port exposed by container"
  type        = number
  default     = 3000
}

variable "container_cpu" {
  description = "CPU units for ECS task (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 1024
}

variable "container_memory" {
  description = "Memory for ECS task in MB (512-30720)"
  type        = number
  default     = 2048
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "ecs_min_capacity" {
  description = "Minimum ECS task count for auto-scaling"
  type        = number
  default     = 2
}

variable "ecs_max_capacity" {
  description = "Maximum ECS task count for auto-scaling"
  type        = number
  default     = 20
}

variable "rds_instance_class" {
  description = "RDS instance type"
  type        = string
  default     = "db.t3.medium"
}

variable "rds_allocated_storage" {
  description = "Initial allocated storage in GB"
  type        = number
  default     = 100
}

variable "rds_max_allocated_storage" {
  description = "Maximum allocated storage for auto-scaling (GB)"
  type        = number
  default     = 500
}

variable "rds_postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "15.5"
}

variable "rds_database_name" {
  description = "Initial database name"
  type        = string
  default     = "v3ddb"
}

variable "rds_username" {
  description = "Master username for RDS"
  type        = string
  sensitive   = true
}

variable "rds_password" {
  description = "Master password for RDS (min 8 chars, alphanumeric + special)"
  type        = string
  sensitive   = true
}

variable "rds_multi_az" {
  description = "Enable Multi-AZ deployment for high availability"
  type        = bool
  default     = true
}

variable "rds_backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 30
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "redis_num_cache_clusters" {
  description = "Number of cache clusters (nodes)"
  type        = number
  default     = 2
}

variable "enable_redis" {
  description = "Enable ElastiCache Redis"
  type        = bool
  default     = true
}

variable "s3_bucket_name_media" {
  description = "S3 bucket for media assets"
  type        = string
  # Will be computed as v3d-media-${environment}-${account_id}
}

variable "cloudfront_enabled" {
  description = "Enable CloudFront CDN for static assets"
  type        = bool
  default     = true
}

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for HTTPS"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  example     = "app.v3d.com"
}

variable "log_retention_days" {
  description = "CloudWatch log retention period"
  type        = number
  default     = 7
}

variable "enable_enhanced_monitoring" {
  description = "Enable CloudWatch Container Insights"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}

# V3D Platform - Application Load Balancer & Secrets Management

# ============================================
# APPLICATION LOAD BALANCER
# ============================================

resource "aws_lb" "main" {
  name               = "${var.app_name}-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = var.environment == "prod" ? true : false
  enable_http2              = true
  enable_cross_zone_load_balancing = true

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-alb-${var.environment}" }
  )
}

# ============================================
# TARGET GROUP (for ECS tasks)
# ============================================

resource "aws_lb_target_group" "api" {
  name        = "${var.app_name}-api-tg-${var.environment}"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200-299"
  }

  deregistration_delay = 30

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-api-tg-${var.environment}" }
  )
}

# ============================================
# ALB LISTENERS
# ============================================

# HTTP Listener (redirect to HTTPS)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

# ============================================
# ALB LISTENER RULES (Advanced routing)
# ============================================

resource "aws_lb_listener_rule" "api_path" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 1

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/api/*", "/health"]
    }
  }
}

# ============================================
# SECRETS MANAGER (Environment Variables)
# ============================================

# Database URL secret
resource "aws_secretsmanager_secret" "database_url" {
  name                    = "${var.app_name}/database-url-${var.environment}"
  description             = "PostgreSQL connection string for V3D"
  recovery_window_in_days = 7

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-database-url-${var.environment}" }
  )
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id = aws_secretsmanager_secret.database_url.id
  secret_string = format(
    "postgresql://%s:%s@%s/%s",
    aws_db_instance.main.username,
    aws_db_instance.main.password,
    aws_db_instance.main.address,
    aws_db_instance.main.db_name
  )
}

# Redis URL secret
resource "aws_secretsmanager_secret" "redis_url" {
  count                   = var.enable_redis ? 1 : 0
  name                    = "${var.app_name}/redis-url-${var.environment}"
  description             = "Redis connection string with AUTH token"
  recovery_window_in_days = 7

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-redis-url-${var.environment}" }
  )
}

resource "aws_secretsmanager_secret_version" "redis_url" {
  count         = var.enable_redis ? 1 : 0
  secret_id     = aws_secretsmanager_secret.redis_url[0].id
  secret_string = format(
    "rediss://:${random_password.redis_auth_token.result}@%s:6379",
    aws_elasticache_replication_group.main[0].configuration_endpoint_address
  )
}

# JWT Secret
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "${var.app_name}/jwt-secret-${var.environment}"
  description             = "JWT signing secret for V3D API"
  recovery_window_in_days = 7

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-jwt-secret-${var.environment}" }
  )
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = random_password.jwt_secret.result
}

# ============================================
# S3 BUCKETS (Media, Logs, Backups)
# ============================================

# Media Assets Bucket
resource "aws_s3_bucket" "media" {
  bucket = var.s3_bucket_name_media

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-media-${var.environment}" }
  )
}

resource "aws_s3_bucket_versioning" "media" {
  bucket = aws_s3_bucket.media.id

  versioning_configuration {
    status = var.environment == "prod" ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket = aws_s3_bucket.media.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = [
      "https://${var.domain_name}"
    ]
    expose_headers = ["ETag", "x-amz-version-id"]
    max_age_seconds = 3000
  }
}

# ============================================
# KMS KEY FOR S3 ENCRYPTION
# ============================================

resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-s3-key-${var.environment}" }
  )
}

resource "aws_kms_alias" "s3" {
  name          = "alias/${var.app_name}-s3-${var.environment}"
  target_key_id = aws_kms_key.s3.key_id
}

# ============================================
# CLOUDFRONT DISTRIBUTION
# ============================================

resource "aws_cloudfront_distribution" "media" {
  count   = var.cloudfront_enabled ? 1 : 0
  enabled = true

  origin {
    domain_name = aws_s3_bucket.media.bucket_regional_domain_name
    origin_id   = "S3Media"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main[0].cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3Media"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = var.acm_certificate_arn
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
    cloudfront_default_certificate = false
  }

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.cloudfront_logs[0].bucket_regional_domain_name
    prefix          = "cloudfront-logs/"
  }

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-cloudfront-${var.environment}" }
  )
}

resource "aws_cloudfront_origin_access_identity" "main" {
  count   = var.cloudfront_enabled ? 1 : 0
  comment = "OAI for ${var.app_name}"
}

# ============================================
# S3 BUCKET FOR CLOUDFRONT LOGS
# ============================================

resource "aws_s3_bucket" "cloudfront_logs" {
  count  = var.cloudfront_enabled ? 1 : 0
  bucket = "${var.app_name}-cloudfront-logs-${var.environment}-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    local.common_tags,
    { Name = "${var.app_name}-cloudfront-logs-${var.environment}" }
  )
}

resource "aws_s3_bucket_public_access_block" "cloudfront_logs" {
  count  = var.cloudfront_enabled ? 1 : 0
  bucket = aws_s3_bucket.cloudfront_logs[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ============================================
# DATA SOURCES
# ============================================

data "aws_caller_identity" "current" {}

# ============================================
# OUTPUTS
# ============================================

output "load_balancer_dns_name" {
  value       = aws_lb.main.dns_name
  description = "DNS name of the load balancer"
}

output "load_balancer_zone_id" {
  value       = aws_lb.main.zone_id
  description = "Zone ID of the load balancer"
}

output "s3_media_bucket_name" {
  value       = aws_s3_bucket.media.id
  description = "S3 media bucket name"
}

output "cloudfront_domain_name" {
  value       = var.cloudfront_enabled ? aws_cloudfront_distribution.media[0].domain_name : null
  description = "CloudFront distribution domain name"
}

output "cloudfront_distribution_id" {
  value       = var.cloudfront_enabled ? aws_cloudfront_distribution.media[0].id : null
  description = "CloudFront distribution ID"
}

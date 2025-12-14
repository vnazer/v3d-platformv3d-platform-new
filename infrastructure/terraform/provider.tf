# V3D Platform - Terraform Configuration
# AWS ECS Fargate + RDS + ALB + Redis + CloudFront

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration (Use S3 for state management)
  backend "s3" {
    bucket         = "v3d-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "V3D"
      ManagedBy   = "Terraform"
      CreatedAt   = timestamp()
    }
  }
}

# Local variables for computed values
locals {
  app_name           = "v3d"
  container_port     = 3000
  container_name     = "v3d-api"
  log_group_name     = "/aws/ecs/${local.app_name}-${var.environment}"
  
  common_tags = {
    Project     = "V3D"
    Environment = var.environment
    CreatedBy   = "Terraform"
  }
}

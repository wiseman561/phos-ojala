provider "aws" {
  region = var.aws_region
}

# VPC and Networking
module "vpc" {
  source            = "./modules/vpc-override"
  name              = "phos-vpc-${var.environment}"
  cidr              = var.vpc_cidr
  azs               = var.availability_zones
  private_subnets   = var.private_subnet_cidrs
  public_subnets    = var.public_subnet_cidrs
  enable_nat_gateway     = true
  single_nat_gateway     = var.environment != "production"
  one_nat_gateway_per_az = var.environment == "production"
  enable_vpn_gateway     = false
  enable_dns_hostnames   = true
  enable_dns_support     = true

  tags = {
    Environment = var.environment,
    Project     = "phos-healthcare",
    Terraform   = "true",
  }
}

# EKS Cluster
module "eks" {
  source           = "terraform-aws-modules/eks/aws"
  version          = "~> 18.0"
  cluster_name     = "phos-eks-${var.environment}"
  cluster_version  = var.kubernetes_version
  vpc_id           = module.vpc.vpc_id
  subnet_ids       = module.vpc.private_subnets

  eks_managed_node_groups = {
    general = {
      desired_size   = var.node_group_desired_capacity
      min_size       = var.node_group_min_capacity
      max_size       = var.node_group_max_capacity
      instance_types = var.node_instance_types
      capacity_type  = "ON_DEMAND"

      labels = {
        Environment = var.environment,
        NodeGroup   = "general",
      }
      tags = {
        Environment = var.environment,
        Project     = "phos-healthcare",
        Terraform   = "true",
      }
    }
  }

  cluster_encryption_config = [{
    provider_key_arn = aws_kms_key.eks.arn
    resources        = ["secrets"]
  }]

  cluster_security_group_additional_rules = {
    egress_all = {
      description = "Cluster-wide egress"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "egress"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  node_security_group_additional_rules = {
    ingress_self_all = {
      description = "Node-to-node all ports"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "ingress"
      self        = true
    }
    egress_all = {
      description = "Node all egress"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "egress"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  tags = {
    Environment = var.environment,
    Project     = "phos-healthcare",
    Terraform   = "true",
  }
}

# KMS key for EKS
resource "aws_kms_key" "eks" {
  description             = "EKS Secret Encryption Key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Environment = var.environment,
    Project     = "phos-healthcare",
    Terraform   = "true",
  }
}

# RDS PostgreSQL Database
module "db" {
  source                 = "terraform-aws-modules/rds/aws"
  version                = "~> 6.0"
  identifier             = "phos-postgres-${var.environment}"
  engine                 = "postgres"
  engine_version         = "14.5"
  instance_class         = var.db_instance_class
  allocated_storage      = var.db_allocated_storage
  storage_encrypted      = true
  db_name                = "phos"
  username               = var.db_username
  password               = var.db_password
  port                   = "5432"
  vpc_security_group_ids = [aws_security_group.db.id]
  subnet_ids             = module.vpc.private_subnets
  create_db_subnet_group = true
  family                 = "postgres14"
  major_engine_version   = "14"
  maintenance_window     = "Mon:00:00-Mon:03:00"
  backup_window          = "03:00-06:00"
  backup_retention_period = var.environment == "production" ? 30 : 7
  deletion_protection     = var.environment == "production"
  skip_final_snapshot     = var.environment != "production"
  parameters = [
    { name  = "log_connections",    value = "1" },
    { name  = "log_disconnections", value = "1" },
  ]

  tags = {
    Environment = var.environment,
    Project     = "phos-healthcare",
    Terraform   = "true",
  }
}

# Security group for RDS
resource "aws_security_group" "db" {
  name        = "phos-db-sg-${var.environment}"
  description = "Security group for Phos PostgreSQL"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "PostgreSQL from EKS nodes"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = var.environment,
    Project     = "phos-healthcare",
    Terraform   = "true",
  }
}

# ElastiCache Redis Subnet Group
resource "aws_elasticache_subnet_group" "redis" {
  name       = "phos-redis-sg-${var.environment}"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Environment = var.environment
    Project     = "phos-healthcare"
    Terraform   = "true"
  }
}

# Security group for Redis
resource "aws_security_group" "redis" {
  name        = "phos-redis-sg-${var.environment}"
  description = "Security group for Phos Redis"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "Redis from EKS nodes"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = var.environment
    Project     = "phos-healthcare"
    Terraform   = "true"
  }
}

# ElastiCache Redis
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "phos-redis-${var.environment}"
  description                = "Phos Redis cluster"

  node_type                  = var.redis_node_type
  port                       = 6379
  parameter_group_name       = "default.redis6.x"

  num_cache_clusters         = var.environment == "production" ? 2 : 1

  engine_version             = "6.2"
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]

  maintenance_window         = "tue:03:00-tue:04:00"
  snapshot_window            = "04:00-05:00"
  auto_minor_version_upgrade = true

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  tags = {
    Environment = var.environment
    Project     = "phos-healthcare"
    Terraform   = "true"
  }
}

# Outputs
output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "eks_cluster_id" {
  description = "EKS cluster name"
  value       = module.eks.cluster_id
}

output "eks_cluster_endpoint" {
  description = "EKS API endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_security_group_id" {
  description = "EKS SG ID"
  value       = module.eks.cluster_security_group_id
}

output "db_instance_address" {
  description = "Postgres endpoint"
  value       = module.db.db_instance_address
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  sensitive   = true
}

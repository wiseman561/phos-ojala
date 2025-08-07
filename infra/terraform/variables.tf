# Root Terraform variables

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, production)"
  type        = string
  default     = "staging-demo"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "kubernetes_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.27"
}

variable "node_group_desired_capacity" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 2
}

variable "node_group_min_capacity" {
  description = "Minimum number of worker nodes"
  type        = number
  default     = 1
}

variable "node_group_max_capacity" {
  description = "Maximum number of worker nodes"
  type        = number
  default     = 4
}

variable "node_instance_types" {
  description = "Instance types for worker nodes"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "db_instance_class" {
  description = "Instance class for RDS database"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS database in GB"
  type        = number
  default     = 20
}

variable "db_username" {
  description = "Username for RDS database"
  type        = string
  default     = "phos_admin"
  sensitive   = true
}

variable "db_password" {
  description = "Password for RDS database"
  type        = string
  default     = "TemporaryPassword123!"
  sensitive   = true
}

variable "redis_node_type" {
  description = "Node type for ElastiCache Redis"
  type        = string
  default     = "cache.t3.small"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "phoshealth.com"
}

variable "create_route53_zone" {
  description = "Whether to create a new Route53 zone"
  type        = bool
  default     = false
}

variable "route53_zone_id" {
  description = "Existing Route53 zone ID if not creating a new one"
  type        = string
  default     = ""
}

# CI/CD image URLs (populated by your pipeline)

variable "phos_api_image_url" {
  description = "Docker image URL for Phos.Api service"
  type        = string
}

variable "phos_identity_image_url" {
  description = "Docker image URL for Phos.Identity service"
  type        = string
}

variable "phos_web_image_url" {
  description = "Docker image URL for Phos.Web service"
  type        = string
}

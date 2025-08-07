variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_id" {
  description = "VPC ID where Vault will be deployed"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block of the VPC"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for Vault deployment"
  type        = list(string)
}

variable "vault_instance_count" {
  description = "Number of Vault instances to deploy"
  type        = number
  default     = 3
}

variable "vault_ami" {
  description = "AMI ID for Vault instances"
  type        = string
}

variable "vault_instance_type" {
  description = "Instance type for Vault servers"
  type        = string
  default     = "t3.medium"
}

variable "vault_version" {
  description = "Version of Vault to install"
  type        = string
  default     = "1.12.0"
}

variable "vault_addr" {
  description = "Address of the Vault server"
  type        = string
  default     = "https://vault.phos-healthcare.com"
}

variable "vault_token" {
  description = "Vault token for Terraform operations"
  type        = string
  sensitive   = true
}

variable "key_name" {
  description = "SSH key name for EC2 instances"
  type        = string
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate for the load balancer"
  type        = string
}

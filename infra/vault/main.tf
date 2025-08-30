terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    vault = {
      source  = "hashicorp/vault"
      version = "~> 3.0"
    }
  }
  backend "s3" {
    bucket = "phos-healthcare-terraform-state"
    key    = "vault/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

provider "vault" {
  address = var.vault_addr
  token   = var.vault_token
}

resource "aws_kms_key" "vault_unseal" {
  description             = "KMS Key for auto-unsealing Vault"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  tags = {
    Name        = "vault-kms-unseal-key"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "vault_unseal" {
  name          = "alias/vault-unseal-key"
  target_key_id = aws_kms_key.vault_unseal.key_id
}

resource "aws_security_group" "vault" {
  name        = "vault-sg"
  description = "Security group for Vault servers"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 8200
    to_port     = 8200
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Vault API"
  }

  ingress {
    from_port   = 8201
    to_port     = 8201
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "Vault cluster"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "vault-sg"
    Environment = var.environment
  }
}

resource "aws_instance" "vault" {
  count                  = var.vault_instance_count
  ami                    = var.vault_ami
  instance_type          = var.vault_instance_type
  subnet_id              = element(var.subnet_ids, count.index)
  vpc_security_group_ids = [aws_security_group.vault.id]
  iam_instance_profile   = aws_iam_instance_profile.vault.name
  key_name               = var.key_name

  user_data = templatefile("${path.module}/templates/vault_setup.tpl", {
    vault_version = var.vault_version
    aws_region    = var.aws_region
    kms_key_id    = aws_kms_key.vault_unseal.id
    environment   = var.environment
  })

  tags = {
    Name        = "vault-server-${count.index}"
    Environment = var.environment
  }
}

resource "aws_iam_role" "vault" {
  name = "vault-server-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "vault_kms" {
  name        = "vault-kms-unseal"
  description = "Allow Vault to use KMS for auto-unseal"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Effect   = "Allow"
        Resource = aws_kms_key.vault_unseal.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "vault_kms" {
  role       = aws_iam_role.vault.name
  policy_arn = aws_iam_policy.vault_kms.arn
}

resource "aws_iam_instance_profile" "vault" {
  name = "vault-server-profile"
  role = aws_iam_role.vault.name
}

resource "aws_lb" "vault" {
  name               = "vault-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.vault.id]
  subnets            = var.subnet_ids

  tags = {
    Name        = "vault-lb"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "vault" {
  name     = "vault-tg"
  port     = 8200
  protocol = "HTTPS"
  vpc_id   = var.vpc_id

  health_check {
    path                = "/v1/sys/health"
    port                = "traffic-port"
    protocol            = "HTTPS"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  tags = {
    Name        = "vault-tg"
    Environment = var.environment
  }
}

resource "aws_lb_listener" "vault" {
  load_balancer_arn = aws_lb.vault.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.vault.arn
  }
}

resource "aws_lb_target_group_attachment" "vault" {
  count            = var.vault_instance_count
  target_group_arn = aws_lb_target_group.vault.arn
  target_id        = aws_instance.vault[count.index].id
  port             = 8200
}

# Initialize Vault and configure secret engines
resource "null_resource" "vault_init" {
  depends_on = [aws_lb.vault]

  provisioner "local-exec" {
    command = <<-EOT
      # Wait for Vault to be available
      sleep 60
      
      # Initialize Vault
      export VAULT_ADDR=${aws_lb.vault.dns_name}
      vault operator init -format=json > vault_init.json
      
      # Unseal Vault (in production, you would handle this more securely)
      cat vault_init.json | jq -r '.unseal_keys_b64[0]' | vault operator unseal -
      cat vault_init.json | jq -r '.unseal_keys_b64[1]' | vault operator unseal -
      cat vault_init.json | jq -r '.unseal_keys_b64[2]' | vault operator unseal -
      
      # Set VAULT_TOKEN
      export VAULT_TOKEN=$(cat vault_init.json | jq -r '.root_token')
      
      # Enable secret engines
      vault secrets enable -path=phos/kv kv-v2
      vault secrets enable -path=phos/database database
      vault secrets enable -path=phos/aws aws
      
      # Create policies
      vault policy write phos-api ${path.module}/policies/phos-api-policy.hcl
      # TODO: reintroduce a web policy when a new front-end is defined
      # === BEGIN DISABLED: phos-web Vault policy (legacy) ===
      # vault policy write phos-web ${path.module}/policies/phos-web-policy.hcl
      # === END DISABLED: phos-web Vault policy ===
      
      # Store initial secrets
      vault kv put phos/kv/database/connection \
        connection_string="Server=db.phos.com;Database=PhosHealthcare;User Id=app_user;Password=initial_password;"
      
      vault kv put phos/kv/jwt \
        secret="$(openssl rand -base64 32)" \
        issuer="phos-healthcare" \
        audience="phos-api" \
        expiration="60m"
      
      # Output important information
      echo "Vault has been initialized and configured. Root token and unseal keys are in vault_init.json"
      echo "IMPORTANT: Store these securely and then delete this file from the server!"
    EOT
  }
}

output "vault_endpoint" {
  description = "The endpoint for the Vault service"
  value       = "https://${aws_lb.vault.dns_name}"
}

output "vault_instance_ids" {
  description = "IDs of the Vault EC2 instances"
  value       = aws_instance.vault[*].id
}

output "vault_security_group_id" {
  description = "ID of the security group for Vault"
  value       = aws_security_group.vault.id
}

output "kms_key_id" {
  description = "ID of the KMS key used for Vault auto-unseal"
  value       = aws_kms_key.vault_unseal.id
}

output "kms_key_alias" {
  description = "Alias of the KMS key used for Vault auto-unseal"
  value       = aws_kms_alias.vault_unseal.name
}

output "vault_iam_role_arn" {
  description = "ARN of the IAM role for Vault"
  value       = aws_iam_role.vault.arn
}

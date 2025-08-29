#!/bin/bash

# Vault server setup script
# This script installs and configures HashiCorp Vault on an EC2 instance

set -e

# Install necessary packages
apt-get update
apt-get install -y curl unzip jq

# Install Vault
curl -fsSL https://releases.hashicorp.com/vault/${vault_version}/vault_${vault_version}_linux_amd64.zip -o vault.zip
unzip vault.zip
mv vault /usr/local/bin/
chmod +x /usr/local/bin/vault

# Create Vault user and directories
useradd --system --home /etc/vault --shell /bin/false vault
mkdir -p /etc/vault/data
mkdir -p /etc/vault/logs
chown -R vault:vault /etc/vault

# Create Vault configuration
cat > /etc/vault/config.hcl << EOF
storage "raft" {
  path    = "/etc/vault/data"
  node_id = "vault-$(hostname)"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = "true"
}

seal "awskms" {
  region     = "${aws_region}"
  kms_key_id = "${kms_key_id}"
}

api_addr = "https://$(curl -s http://169.254.169.254/latest/meta-data/public-hostname):8200"
cluster_addr = "https://$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4):8201"

ui = true
EOF

# Create systemd service
cat > /etc/systemd/system/vault.service << EOF
[Unit]
Description=HashiCorp Vault
Documentation=https://www.vaultproject.io/docs/
Requires=network-online.target
After=network-online.target

[Service]
User=vault
Group=vault
ProtectSystem=full
ProtectHome=read-only
PrivateTmp=yes
PrivateDevices=yes
SecureBits=keep-caps
AmbientCapabilities=CAP_IPC_LOCK
NoNewPrivileges=yes
ExecStart=/usr/local/bin/vault server -config=/etc/vault/config.hcl
ExecReload=/bin/kill --signal HUP \$MAINPID
KillMode=process
KillSignal=SIGINT
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
StartLimitBurst=3
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

# Start Vault service
systemctl daemon-reload
systemctl enable vault
systemctl start vault

# Set environment variables for the instance
echo "export VAULT_ADDR=http://127.0.0.1:8200" >> /etc/environment
echo "export VAULT_SKIP_VERIFY=true" >> /etc/environment

# Tag instance with environment
aws ec2 create-tags --region ${aws_region} \
  --resources $(curl -s http://169.254.169.254/latest/meta-data/instance-id) \
  --tags Key=Environment,Value=${environment}

echo "Vault installation complete"

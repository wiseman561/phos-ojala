#!/usr/bin/env bash
set -e

# 1. Install .NET 8 SDK
wget https://packages.microsoft.com/config/ubuntu/24.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb
sudo apt update
sudo apt install -y dotnet-sdk-8.0

# 2. Install Node.js 18.x and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Add current user to the docker group
sudo groupadd docker || true
sudo usermod -aG docker $USER

# 4. Inform the user
echo "✔ .NET SDK, Node.js and Docker group setup complete."
echo "Please exit and reopen your WSL terminal to apply group changes."
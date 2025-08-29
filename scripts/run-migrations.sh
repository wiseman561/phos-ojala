#!/bin/sh
set -ex

echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

echo "Installing EF tool..."
dotnet tool install --global dotnet-ef --version 8.0.*

echo "Restoring project..."
dotnet restore src/backend/Phos.Identity/Phos.Identity.csproj -p:ManagePackageVersionsCentrally=false

echo "Running migrations..."
dotnet ef database update \
  --project src/backend/Phos.Identity/Phos.Identity.csproj \
  --startup-project src/backend/Phos.Identity/Phos.Identity.csproj \
  --no-build

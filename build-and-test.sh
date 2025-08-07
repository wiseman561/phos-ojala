#!/bin/bash
# Phos Healthcare Platform - Build and Test Script

set -e  # Exit on any error

echo "🔧 Starting Phos Healthcare Platform Build & Test Process..."

# Step 1: Clean previous builds
echo "🧹 Cleaning previous builds..."
dotnet clean PhosHealthcarePlatform.sln

# Step 2: Restore dependencies
echo "📦 Restoring NuGet packages..."
dotnet restore PhosHealthcarePlatform.sln

# Step 3: Build in Release mode
echo "🏗️ Building solution in Release mode..."
dotnet build PhosHealthcarePlatform.sln -c Release --no-restore

# Step 4: Run tests
echo "🧪 Running test suite..."
dotnet test PhosHealthcarePlatform.sln --no-build --configuration Release --logger "trx;LogFileName=test-results.trx"

echo "✅ Build and test process completed successfully!"
echo "📊 Test results saved to test-results/test-results.trx"

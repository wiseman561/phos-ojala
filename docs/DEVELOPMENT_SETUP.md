# Development Setup Guide

## Overview
This guide helps you set up the Phos Healthcare Platform development environment, including solutions for common WSL and Docker issues.

## Prerequisites

### Required Software
- **WSL2** (Windows Subsystem for Linux 2)
- **Docker Desktop** with WSL2 backend
- **Git** for version control
- **VS Code** (recommended) with WSL extension

### Optional Software
- **.NET 9.0.203 SDK** (if running tests locally)
- **PostgreSQL** (for local database development)
- **Redis** (for local caching/event bus)

## Quick Start

### 1. Clone the Repository
```bash
# Clone to WSL-native storage (recommended)
git clone https://github.com/your-org/Phos-healthcare_new.git ~/projects/Phos-healthcare_new
cd ~/projects/Phos-healthcare_new

# Or clone to Windows path (may cause I/O issues)
git clone https://github.com/your-org/Phos-healthcare_new.git /mnt/c/Users/your-username/Desktop/Repositories/Phos-healthcare_new
```

### 2. Run Tests (Recommended Method)
```bash
# Use the automated test runner
./scripts/run-tests.sh
```

This script will:
- ✅ Check if you're in WSL
- ✅ Move repository to WSL-native storage if needed
- ✅ Verify Docker availability
- ✅ Run tests in a clean .NET 9.0.203 container
- ✅ Provide detailed output and error handling

### 3. Alternative: Manual Docker Setup
```bash
# Run tests in Docker container
docker-compose -f docker-compose.test.yml up

# Or build and test step by step
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
```

## Environment Setup

### WSL Configuration

#### Fix File System Issues
If you encounter I/O errors with Windows-mounted paths:

```bash
# Move repository to WSL-native storage
./scripts/move-to-wsl.sh

# This will:
# 1. Copy the repo to ~/projects/Phos-healthcare_new
# 2. Create a symlink back to the original Windows path
# 3. Resolve I/O errors
```

#### WSL Performance Optimization
Add to `/etc/wsl.conf`:
```ini
[automount]
enabled = true
options = "metadata,umask=22,fmask=11"

[interop]
enabled = true
appendWindowsPath = false
```

### Docker Setup

#### Enable WSL2 Backend
1. Open Docker Desktop
2. Go to Settings → General
3. Check "Use the WSL 2 based engine"
4. Go to Settings → Resources → WSL Integration
5. Enable integration with your WSL distribution

#### Verify Docker Installation
```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker-compose --version

# Test Docker functionality
docker run hello-world
```

### .NET SDK Setup (Optional)

#### Install .NET 9.0.203 SDK
```bash
# Download installer
wget https://dotnet.microsoft.com/download/dotnet/scripts/v1/dotnet-install.sh
chmod +x dotnet-install.sh

# Install specific version
./dotnet-install.sh --version 9.0.203

# Add to PATH
echo 'export PATH="$HOME/.dotnet:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify installation
dotnet --version
```

#### Verify Solution Build
```bash
# Restore packages
dotnet restore

# Build solution
dotnet build

# Run tests
dotnet test
```

## Project Structure

```
Phos-healthcare_new/
├── src/
│   ├── backend/           # .NET 9 backend services
│   │   ├── Phos.Api/     # Main API
│   │   ├── Phos.Identity/# Identity service
│   │   ├── Phos.Data/    # Data access layer
│   │   └── ...
│   ├── shared/            # Shared libraries
│   └── frontend/          # Frontend applications
├── tests/                 # Test projects
├── scripts/               # Automation scripts
├── docs/                  # Documentation
├── docker-compose.test.yml # Test environment
└── .github/workflows/     # CI/CD workflows
```

## Testing

### Test Projects
- **Phos.Api.Tests**: API integration tests
- **Phos.Tests.Unit**: Unit tests
- **Phos.Tests.Integration**: Integration tests
- **AuthControllerTests**: Authentication tests

### Running Tests

#### Automated (Recommended)
```bash
./scripts/run-tests.sh
```

#### Manual Docker
```bash
# Run all tests
docker-compose -f docker-compose.test.yml up

# Run specific test project
docker run --rm -v $(pwd):/app mcr.microsoft.com/dotnet/sdk:9.0.203 \
  dotnet test src/backend/Phos.Api.Tests/Phos.Api.Tests.csproj
```

#### Local Development
```bash
# Run all tests
dotnet test

# Run specific test project
dotnet test src/backend/Phos.Api.Tests/

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"
```

## Troubleshooting

### Common Issues

#### 1. WSL File System I/O Errors
**Symptoms**: `Input/output error` when accessing files
**Solution**: Move repository to WSL-native storage
```bash
./scripts/move-to-wsl.sh
```

#### 2. Docker Container Empty Mounts
**Symptoms**: `/app` directory is empty in container
**Solution**: Ensure repository is in WSL-native storage
```bash
# Check current location
pwd

# If in /mnt/c/, move to WSL-native storage
./scripts/move-to-wsl.sh
```

#### 3. .NET SDK Version Mismatch
**Symptoms**: `The current .NET SDK does not support targeting .NET 9.0`
**Solution**: Use Docker or update SDK
```bash
# Use Docker (recommended)
docker-compose -f docker-compose.test.yml up

# Or install correct SDK version
./dotnet-install.sh --version 9.0.203
```

#### 4. Docker Permission Issues
**Symptoms**: `Got permission denied while trying to connect to the Docker daemon`
**Solution**: Add user to docker group
```bash
sudo usermod -aG docker $USER
# Log out and back in, or restart WSL
```

#### 5. Memory Issues
**Symptoms**: Build fails with out-of-memory errors
**Solution**: Increase WSL memory limit
```bash
# Create .wslconfig in Windows user directory
echo "[wsl2]
memory=8GB
processors=4" > /mnt/c/Users/$USER/.wslconfig
```

### Performance Optimization

#### WSL Performance
```bash
# Add to /etc/wsl.conf
[automount]
enabled = true
options = "metadata,umask=22,fmask=11"

[interop]
enabled = true
appendWindowsPath = false
```

#### Docker Performance
```bash
# Increase Docker resources in Docker Desktop
# Settings → Resources → Advanced
# Memory: 8GB
# CPUs: 4
# Swap: 2GB
```

## CI/CD

### GitHub Actions
The repository includes GitHub Actions workflows that:
- ✅ Build the solution on every push/PR
- ✅ Run all tests with .NET 9.0.203
- ✅ Generate code coverage reports
- ✅ Provide detailed build logs

### Local CI Simulation
```bash
# Simulate CI environment locally
docker run --rm -v $(pwd):/app mcr.microsoft.com/dotnet/sdk:9.0.203 \
  bash -c "cd /app && dotnet restore && dotnet build && dotnet test"
```

## Development Workflow

### 1. Start Development
```bash
# Clone and setup
git clone <repo-url> ~/projects/Phos-healthcare_new
cd ~/projects/Phos-healthcare_new

# Run tests to verify setup
./scripts/run-tests.sh
```

### 2. Make Changes
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and test
./scripts/run-tests.sh

# Commit changes
git add .
git commit -m "feat: your feature description"
```

### 3. Submit Changes
```bash
# Push to remote
git push origin feature/your-feature

# Create pull request
# GitHub Actions will automatically run tests
```

## Support

### Getting Help
1. **Check this documentation** for common issues
2. **Run the test script** to verify your setup
3. **Check GitHub Actions** for CI/CD status
4. **Review logs** for detailed error information

### Useful Commands
```bash
# Check environment
./scripts/run-tests.sh

# Clean and rebuild
dotnet clean && dotnet restore && dotnet build

# Run specific tests
dotnet test --filter "FullyQualifiedName~YourTestName"

# Check Docker status
docker-compose -f docker-compose.test.yml ps
```

## Contributing

### Before Submitting
1. ✅ Run `./scripts/run-tests.sh`
2. ✅ Ensure all tests pass
3. ✅ Check code coverage
4. ✅ Update documentation if needed

### Code Standards
- Follow .NET 9 conventions
- Use central package management
- Write unit tests for new features
- Update documentation for API changes 

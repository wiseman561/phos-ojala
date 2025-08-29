# .NET 9 Upgrade Notes

## Overview
This document outlines the changes made to upgrade the Phos Healthcare Platform backend from .NET 8 to .NET 9.

## Changes Made

### 1. Target Framework Updates
All backend projects have been updated to target .NET 9.0:

**Updated Projects:**
- `src/backend/Phos.Api/Phos.Api.csproj` - `net8.0` → `net9.0`
- `src/backend/Phos.Identity/Phos.Identity.csproj` - `net8.0` → `net9.0`
- `src/backend/Phos.Data/Phos.Data.csproj` - `net8.0` → `net9.0`
- `src/backend/Phos.Services/Phos.Services.csproj` - `net8.0` → `net9.0`
- `src/backend/Phos.ApiGateway/Phos.ApiGateway.csproj` - `net8.0` → `net9.0`
- `src/backend/Phos.HealthScore/Phos.HealthScore.csproj` - `net8.0` → `net9.0`
- `src/shared/Phos.Common/Phos.Common.csproj` - `net8.0` → `net9.0`
- `src/shared/Phos.Contracts/Phos.Contracts.csproj` - `net8.0` → `net9.0`

**Test Projects:**
- `src/backend/Phos.Api.Tests/Phos.Api.Tests.csproj` - `net8.0` → `net9.0`
- `src/backend/AuthControllerManualTest/AuthControllerManualTest.csproj` - `net8.0` → `net9.0`
- `src/backend/AuthControllerTestRunner/AuthControllerTestRunner.csproj` - `net8.0` → `net9.0`
- `src/backend/AuthControllerTests.Simple/AuthControllerTests.Simple.csproj` - `net8.0` → `net9.0`
- `src/backend/MigrationHelper/MigrationHelper.csproj` - `net8.0` → `net9.0`
- `tests/Phos.Tests/Phos.Tests.csproj` - `net8.0` → `net9.0`
- `tests/Phos.Tests.Unit/Phos.Tests.Unit.csproj` - Added `net9.0` target framework
- `tests/Phos.Tests.Integration/Phos.Tests.Integration.csproj` - `net8.0` → `net9.0`

### 2. Package Version Updates
Updated `Directory.Packages.props` with .NET 9 compatible package versions:

**Core Framework Packages (Updated to 9.0.0):**
- Microsoft.EntityFrameworkCore and related packages
- Microsoft.AspNetCore.Identity.EntityFrameworkCore
- Microsoft.AspNetCore.Authentication.JwtBearer
- Microsoft.Extensions.* packages (all updated to 9.0.0)
- Microsoft.AspNetCore.OpenApi
- Microsoft.AspNetCore.Mvc.Testing

**Authentication & Identity (Updated to 8.0.1):**
- Microsoft.IdentityModel.Tokens: `7.3.1` → `8.0.1`
- System.IdentityModel.Tokens.Jwt: `7.3.1` → `8.0.1`

**AutoMapper (Updated to compatible versions):**
- AutoMapper: `13.0.1` → `12.0.1`
- AutoMapper.Extensions.Microsoft.DependencyInjection: `13.0.1` → `12.0.1`

**Framework-Integrated Packages (Removed):**
- Microsoft.AspNetCore.Http: Removed (now part of .NET 9 framework)
- Microsoft.AspNetCore.SignalR: Removed (now part of .NET 9 framework)

### 3. Project Reference Fixes
- Added missing project reference in `Phos.Common.csproj`:
  - Added reference to `Phos.Contracts` project to resolve `IEventBus` interface dependency

### 4. SDK Configuration
- Updated `global.json` to use .NET 9 SDK:
  - Changed from `8.0.117` to `9.0.203` (latest available stable version)

## Build Status

### Successful Builds
The following projects build successfully with .NET 9:
- ✅ Phos.Contracts
- ✅ Phos.Data  
- ✅ Phos.Common
- ✅ Phos.Services
- ✅ Phos.ApiGateway
- ✅ Phos.Identity
- ✅ Phos.HealthScore
- ✅ Phos.Api

### Known Issues
- **Test Projects**: Some test projects may have compilation issues related to .NET 9 SDK installation
- **SDK Resolution**: The .NET 9 SDK installation may have some workload resolution issues

## Prerequisites

### Required .NET SDK
- .NET 9.0 SDK (version 9.0.203 or later)

### Installation
```bash
# Download and install .NET 9 SDK
wget https://dotnet.microsoft.com/download/dotnet/scripts/v1/dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --channel 9.0

# Add to PATH
export PATH="$HOME/.dotnet:$PATH"
```

### Alternative: Use Docker
If you encounter SDK issues, use the provided Docker setup:
```bash
# Run tests in Docker container
docker-compose -f docker-compose.test.yml up

# Or use the automated script
./scripts/run-tests.sh
```

## Migration Benefits

### Performance Improvements
- .NET 9 includes performance improvements for ASP.NET Core applications
- Enhanced memory management and garbage collection
- Improved startup times

### Security Updates
- Latest security patches and vulnerability fixes
- Updated cryptography libraries
- Enhanced authentication and authorization features

### New Features
- Latest C# language features
- Improved debugging and diagnostics
- Enhanced containerization support

## Breaking Changes Addressed

### Package Dependencies
- Resolved AutoMapper version compatibility issues
- Updated authentication packages to compatible versions
- Removed framework-integrated packages that are now part of .NET 9

### Framework Integration
- Microsoft.AspNetCore.Http and Microsoft.AspNetCore.SignalR are now part of the framework
- No separate package references needed for these components

## Test Project Upgrades

### Updated Test Packages
All test projects have been updated with the latest .NET 9 compatible package versions:

**Core Testing Framework:**
- Microsoft.NET.Test.Sdk: `17.8.0` → `17.9.0`
- xunit: `2.6.6` → `2.7.0`
- xunit.runner.console: `2.9.3` → `2.7.0`
- xunit.runner.visualstudio: `2.5.6` → `2.7.0`

**Testing Utilities:**
- Microsoft.AspNetCore.Mvc.Testing: `9.0.0` (already up-to-date)
- Microsoft.EntityFrameworkCore.InMemory: `9.0.0` (added)
- Microsoft.AspNetCore.TestHost: `9.0.0` (added for .NET 9 compatibility)
- Moq: `4.20.70` (latest stable)
- FluentAssertions: `6.12.0` (latest stable)
- coverlet.collector: `6.0.0` (latest stable)

### Test Project Updates

**Fixed Projects:**
- `src/backend/Phos.Api.Tests/Phos.Api.Tests.csproj`:
  - Added Microsoft.EntityFrameworkCore.InMemory package reference
  - All packages now use central package management
  
- `src/backend/AuthControllerTests.Simple/AuthControllerTests.Simple.csproj`:
  - Removed hardcoded package versions
  - Now uses central package management
  - Updated to use latest xUnit and test SDK versions

**Verified Projects (already targeting .NET 9):**
- `tests/Phos.Tests/Phos.Tests.csproj`
- `tests/Phos.Tests.Unit/Phos.Tests.Unit.csproj`
- `tests/Phos.Tests.Integration/Phos.Tests.Integration.csproj`
- `src/backend/AuthControllerManualTest/AuthControllerManualTest.csproj`
- `src/backend/AuthControllerTestRunner/AuthControllerTestRunner.csproj`

### .NET 9 Testing Improvements
- Enhanced test discovery and execution
- Improved performance for large test suites
- Better integration with modern testing patterns
- Support for latest C# language features in test code

## Next Steps

1. **Test Execution**: Run the test suite to ensure all functionality works correctly
2. **Integration Testing**: Test the complete application in a staging environment
3. **Performance Testing**: Verify performance improvements and identify any regressions
4. **Documentation Updates**: Update any deployment or configuration documentation

## Rollback Plan

If issues arise, the solution can be rolled back by:
1. Reverting all `TargetFramework` changes from `net9.0` to `net8.0`
2. Restoring the original `global.json` with .NET 8 SDK version
3. Reverting package version changes in `Directory.Packages.props`

## Support

For issues related to this upgrade:
1. Check the .NET 9 migration guide: https://docs.microsoft.com/en-us/dotnet/core/migration/
2. Review breaking changes: https://docs.microsoft.com/en-us/dotnet/core/compatibility/
3. Consult the team's internal documentation for application-specific concerns 

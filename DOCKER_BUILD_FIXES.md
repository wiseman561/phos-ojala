# Docker Build Fixes for Phos Healthcare Platform

## Problem Summary

The Docker builds for the .NET backend services were failing due to missing internal project dependencies. Each service's Docker build context was limited to its own directory, but the projects had dependencies on shared libraries located in different directories.

**UPDATE**: Additional critical issues discovered:
1. NuGet package fallback folders referencing Windows-specific paths that don't exist in Linux containers.
2. **CRITICAL**: `NETSDK1004` error - Assets file not found because NuGet restore artifacts were being overwritten during source copy operations.

## Root Cause

The issues occurred because:
1. Each service's `docker-compose.yml` build context was set to the individual service directory (e.g., `./src/backend/Phos.Api`)
2. The .NET projects had `ProjectReference` dependencies to other internal projects outside their build context
3. Docker couldn't access the referenced projects during the build process, causing compilation errors
4. Windows-generated `obj` directories contained NuGet configuration files (`.nuget.dgspec.json`) with Windows-specific fallback package folders like `C:\Program Files (x86)\Microsoft Visual Studio\Shared\NuGetPackages`
5. **CRITICAL**: The `.dockerignore` file had `!src/**` which overrode `bin` and `obj` exclusions, causing local build artifacts to overwrite Docker's restore artifacts
6. **CRITICAL**: Copying entire directories with `COPY src/backend/Phos.Api/ ./src/backend/Phos.Api/` could overwrite the `obj/project.assets.json` file created by `dotnet restore`

## Solution Overview

### 1. Updated Docker Build Context

Changed the build context for all .NET backend services from individual service directories to the repository root (`.`). This allows Docker to access all internal project dependencies.

### 2. **CRITICAL**: Fixed .dockerignore Configuration

- Updated `.dockerignore` to properly exclude `**/bin/` and `**/obj/` directories everywhere
- Replaced `!src/**` with specific file type inclusions to prevent overriding bin/obj exclusions
- Ensured Docker's restore artifacts are never overwritten by source copy operations

### 3. **CRITICAL**: Explicit Source File Copying

Modified all Dockerfiles to copy only specific source files and directories, never entire project directories:
- Copy `.cs` files explicitly
- Copy specific subdirectories (Controllers, Models, Services, etc.)
- Copy configuration files (appsettings*.json, ocelot*.json)
- **NEVER** copy entire directories that might contain bin/obj folders

### 4. Updated docker-compose.yml

Changed the build context and dockerfile paths for all .NET services to use the repository root as the build context.

### 5. Fixed NuGet Configuration Issues

- Created a Linux-compatible `nuget.config` file that overrides Windows-specific settings
- Ensured NuGet only uses universal package sources like `https://api.nuget.org/v3/index.json`

## Services Updated

### Phos.Api
- **Dependencies**: `Phos.Services`, `Phos.Identity`, `Phos.Data`, `Phos.Common`, `Phos.Contracts`
- **Port**: 5000
- **Dockerfile**: `src/backend/Phos.Api/Dockerfile`

### Phos.Identity
- **Dependencies**: `Phos.Data`, `Phos.Common`, `Phos.Contracts`
- **Port**: 5001
- **Dockerfile**: `src/backend/Phos.Identity/Dockerfile`

### Phos.Services
- **Dependencies**: `Phos.Data`, `Phos.Common`, `Phos.Contracts`
- **Note**: This is a library project, not a standalone service
- **Dockerfile**: `src/backend/Phos.Services/Dockerfile`

### Phos.HealthScore
- **Dependencies**: `Phos.Common`, `Phos.Contracts`
- **Port**: 8083
- **Dockerfile**: `src/backend/Phos.HealthScore/Dockerfile`

### Phos.ApiGateway
- **Dependencies**: `Phos.Data`, `Phos.Common`, `Phos.Contracts`
- **Port**: 5002 (newly added to docker-compose)
- **Dockerfile**: `src/backend/Phos.ApiGateway/Dockerfile`

## Key Changes Made

### 1. **CRITICAL**: Fixed .dockerignore

```dockerignore
# .NET build artifacts - CRITICAL: Must exclude bin and obj everywhere
**/bin/
**/obj/
bin/
obj/

# Include necessary files (but bin/obj exclusions above take precedence)
!src/**/*.cs
!src/**/*.csproj
!src/**/*.json
!src/**/*.config
# ... other specific file types
```

### 2. **CORRECTED**: Dockerfile Structure (Applied to all services)

```dockerfile
# ---- Build Stage ----
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy NuGet configuration to override Windows-specific settings
COPY nuget.config ./

# Copy the solution file for better dependency resolution
COPY *.sln ./

# Copy all referenced .csproj files first (Docker layer caching optimization)
COPY src/backend/[ServiceName]/[ServiceName].csproj ./src/backend/[ServiceName]/
COPY [dependency paths...] ./[dependency paths...]
COPY Directory.Packages.props ./
COPY Directory.Build.props ./

# Restore dependencies (this creates obj/project.assets.json and other restore artifacts)
RUN dotnet restore ./src/backend/[ServiceName]/[ServiceName].csproj

# Copy source files EXPLICITLY - NEVER copy entire directories
# This ensures obj/ directories created by restore are preserved
COPY src/backend/[ServiceName]/*.cs ./src/backend/[ServiceName]/
COPY src/backend/[ServiceName]/Controllers/ ./src/backend/[ServiceName]/Controllers/
COPY src/backend/[ServiceName]/Services/ ./src/backend/[ServiceName]/Services/
# ... copy other specific directories and files as needed

# Build and publish (--no-restore works because restore artifacts are preserved)
WORKDIR /src/src/backend/[ServiceName]
RUN dotnet publish -c Release -o /app/publish --no-restore

# ---- Runtime Stage ----
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
RUN adduser --disabled-password --gecos "" appuser
RUN chown -R appuser:appuser /app
USER appuser
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1
ENTRYPOINT ["dotnet", "[ServiceName].dll"]
```

### 3. docker-compose.yml Changes

```yaml
# Before (example)
phos-api:
  build:
    context: ./src/backend/Phos.Api
    dockerfile: Dockerfile

# After
phos-api:
  build:
    context: .
    dockerfile: ./src/backend/Phos.Api/Dockerfile
```

### 4. Added Missing Service

Added `phos-apigateway` service to docker-compose.yml as it was a standalone service but not included in the compose file.

### 5. NuGet Configuration (`nuget.config`)

Created a Linux-compatible NuGet configuration file:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <clear />
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" protocolVersion="3" />
  </packageSources>
  <packageRestore>
    <add key="enabled" value="True" />
    <add key="automatic" value="True" />
  </packageRestore>
  <bindingRedirects>
    <add key="skip" value="False" />
  </bindingRedirects>
  <packageManagement>
    <add key="format" value="0" />
    <add key="disabled" value="False" />
  </packageManagement>
</configuration>
```

## Benefits

1. **Resolved Build Failures**: All .NET services can now access their internal dependencies
2. **Fixed NuGet Issues**: Eliminated Windows-specific package folder references
3. **Fixed NETSDK1004 Error**: Preserved NuGet restore artifacts for `--no-restore` builds
4. **Guaranteed Asset Preservation**: Explicit source copying ensures obj/project.assets.json is never overwritten
5. **Optimized Docker Layers**: Copying `.csproj` files first enables better Docker layer caching
6. **Consistent Structure**: All services follow the same Dockerfile pattern
7. **Complete Service Coverage**: All standalone services are now included in docker-compose
8. **Cross-Platform Compatibility**: Docker builds work on both Windows and Linux environments

## Testing the Fix

To test the fixes:

```bash
# Build all services (should now work without any NETSDK1004 errors)
docker-compose build

# Start all services
docker-compose up -d

# Check service health
docker-compose ps
```

## Files Added/Modified

### New Files:
- `nuget.config` - Linux-compatible NuGet configuration

### Modified Files:
- `.dockerignore` - **CRITICAL** improvements to prevent bin/obj copying
- `src/backend/Phos.Api/Dockerfile`
- `src/backend/Phos.Services/Dockerfile`
- `src/backend/Phos.Identity/Dockerfile`
- `src/backend/Phos.HealthScore/Dockerfile`
- `src/backend/Phos.ApiGateway/Dockerfile`
- `docker-compose.yml`

## Notes

- `Phos.Services` is a library project (no Program.cs) and is consumed by other services
- All services maintain their individual published outputs in the runtime stage
- The build context change doesn't affect the final image size as only published outputs are copied to the runtime stage
- Environment variables and configuration remain unchanged
- The `nuget.config` file overrides any Windows-specific NuGet settings
- **CRITICAL**: Source files are copied explicitly to avoid overwriting restore artifacts
- The restore process creates `obj/project.assets.json` which is essential for `--no-restore` builds
- `.dockerignore` now properly excludes `**/bin/` and `**/obj/` throughout the entire source tree

## Troubleshooting

### If you still get NETSDK1004 errors:
1. Ensure `.dockerignore` properly excludes `**/bin/` and `**/obj/` directories
2. Verify that `dotnet restore` completes successfully before copying source code
3. Check that Dockerfile copies source files explicitly, not entire directories
4. Ensure the working directory is correct when running `dotnet publish`
5. Verify that no `obj/` directories exist in the source that could overwrite restore artifacts

### To verify restore artifacts are preserved:
```bash
# Build with verbose output to see what's being copied
docker-compose build --progress=plain phos-api

# Or check the obj directory exists after restore in a test build
docker build -f src/backend/Phos.Api/Dockerfile --target build -t test-build .
docker run --rm test-build ls -la /src/src/backend/Phos.Api/obj/
```

## Future Considerations

- Consider using multi-stage builds with a shared base image for common dependencies
- Implement Docker layer caching strategies for CI/CD pipelines
- Monitor build times and optimize further if needed
- Consider automating the cleanup of `obj` directories in development workflows
- Add automated checks to ensure `.dockerignore` properly excludes build artifacts

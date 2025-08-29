# Comprehensive Build Test Script for Phos Healthcare Platform
Write-Host "=== Phos Healthcare Platform Build Test ===" -ForegroundColor Green

$ErrorActionPreference = "Stop"
$buildSuccess = $true

# Define build order (dependencies first)
$projects = @(
    @{
        Name = "Phos.Common"
        Path = "src/shared/Phos.Common"
        Type = "Library"
    },
    @{
        Name = "Phos.Contracts"
        Path = "src/shared/Phos.Contracts"
        Type = "Library"
    },
    @{
        Name = "Phos.Data"
        Path = "src/backend/Phos.Data"
        Type = "Library"
    },
    @{
        Name = "Phos.Services"
        Path = "src/backend/Phos.Services"
        Type = "Library"
    },
    @{
        Name = "Phos.Identity"
        Path = "src/backend/Phos.Identity"
        Type = "WebApi"
    },
    @{
        Name = "Phos.Api"
        Path = "src/backend/Phos.Api"
        Type = "WebApi"
    },
    @{
        Name = "Phos.ApiGateway"
        Path = "src/backend/Phos.ApiGateway"
        Type = "WebApi"
    },
    @{
        Name = "Phos.HealthScore"
        Path = "src/backend/Phos.HealthScore"
        Type = "WebApi"
    }
)

function Test-Project {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Type
    )

    Write-Host "`n--- Testing $Name ($Type) ---" -ForegroundColor Cyan

    if (-not (Test-Path $Path)) {
        Write-Host "✗ Project path not found: $Path" -ForegroundColor Red
        return $false
    }

    $projectFile = Get-ChildItem -Path $Path -Filter "*.csproj" | Select-Object -First 1
    if (-not $projectFile) {
        Write-Host "✗ No .csproj file found in $Path" -ForegroundColor Red
        return $false
    }

    Write-Host "Project file: $($projectFile.Name)" -ForegroundColor Gray

    # Change to project directory
    Push-Location $Path

    try {
        # Test restore
        Write-Host "Running dotnet restore..." -ForegroundColor Yellow
        dotnet restore --verbosity quiet
        if ($LASTEXITCODE -ne 0) {
            Write-Host "✗ dotnet restore failed" -ForegroundColor Red
            return $false
        }
        Write-Host "✓ dotnet restore succeeded" -ForegroundColor Green

        # Test build
        Write-Host "Running dotnet build..." -ForegroundColor Yellow
        dotnet build --no-restore --verbosity quiet
        if ($LASTEXITCODE -ne 0) {
            Write-Host "✗ dotnet build failed" -ForegroundColor Red
            return $false
        }
        Write-Host "✓ dotnet build succeeded" -ForegroundColor Green

        return $true
    }
    catch {
        Write-Host "✗ Exception during build: $_" -ForegroundColor Red
        return $false
    }
    finally {
        Pop-Location
    }
}

# Step 1: Verify project structure
Write-Host "`n1. Verifying project structure..." -ForegroundColor Yellow

foreach ($project in $projects) {
    if (Test-Path $project.Path) {
        Write-Host "✓ Found: $($project.Path)" -ForegroundColor Green
    } else {
        Write-Host "✗ Missing: $($project.Path)" -ForegroundColor Red
        $buildSuccess = $false
    }
}

if (-not $buildSuccess) {
    Write-Host "`n✗ Project structure validation failed. Please fix missing projects." -ForegroundColor Red
    exit 1
}

# Step 2: Test builds in dependency order
Write-Host "`n2. Testing builds in dependency order..." -ForegroundColor Yellow

foreach ($project in $projects) {
    $result = Test-Project -Name $project.Name -Path $project.Path -Type $project.Type
    if (-not $result) {
        Write-Host "`n✗ Build failed for $($project.Name)" -ForegroundColor Red
        $buildSuccess = $false
        break
    }
}

# Step 3: Test Docker builds (optional)
if ($buildSuccess -and (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "`n3. Testing Docker builds..." -ForegroundColor Yellow

    $dockerProjects = @(
        @{ Name = "Identity"; Path = "src/backend/Phos.Identity/Dockerfile" },
        @{ Name = "Api"; Path = "src/backend/Phos.Api/Dockerfile" },
        @{ Name = "ApiGateway"; Path = "src/backend/Phos.ApiGateway/Dockerfile" },
        @{ Name = "HealthScore"; Path = "src/backend/Phos.HealthScore/Dockerfile" }
    )

    foreach ($dockerProject in $dockerProjects) {
        if (Test-Path $dockerProject.Path) {
            Write-Host "Testing Docker build for $($dockerProject.Name)..." -ForegroundColor Yellow
            try {
                $imageName = "phos-$($dockerProject.Name.ToLower())-test"
                docker build -f $dockerProject.Path -t $imageName . --quiet
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✓ Docker build succeeded for $($dockerProject.Name)" -ForegroundColor Green
                    # Clean up test image
                    docker rmi $imageName -f | Out-Null
                } else {
                    Write-Host "✗ Docker build failed for $($dockerProject.Name)" -ForegroundColor Red
                    $buildSuccess = $false
                }
            }
            catch {
                Write-Host "✗ Docker build exception for $($dockerProject.Name): $_" -ForegroundColor Red
                $buildSuccess = $false
            }
        }
    }
} else {
    Write-Host "`n3. Skipping Docker tests (Docker not available or previous builds failed)" -ForegroundColor Yellow
}

# Step 4: Summary
Write-Host "`n=== Build Test Summary ===" -ForegroundColor Yellow

if ($buildSuccess) {
    Write-Host "✓ All builds passed successfully!" -ForegroundColor Green
    Write-Host "The Phos Healthcare Platform is ready for deployment." -ForegroundColor Green
} else {
    Write-Host "✗ Some builds failed. Please check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Green

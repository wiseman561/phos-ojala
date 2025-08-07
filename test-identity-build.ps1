# Test script for Phos Identity build verification
Write-Host "=== Phos Identity Build Test ===" -ForegroundColor Green

# 1. Verify project structure
Write-Host "`n1. Verifying project structure..." -ForegroundColor Yellow

$requiredPaths = @(
    "src/backend/Phos.Identity/Phos.Identity.csproj",
    "src/shared/Phos.Common/Phos.Common.csproj",
    "src/shared/Phos.Contracts/Phos.Contracts.csproj",
    "src/backend/Phos.Data/Phos.Data.csproj"
)

foreach ($path in $requiredPaths) {
    if (Test-Path $path) {
        Write-Host "✓ Found: $path" -ForegroundColor Green
    } else {
        Write-Host "✗ Missing: $path" -ForegroundColor Red
        exit 1
    }
}

# 2. Test dotnet restore
Write-Host "`n2. Testing dotnet restore..." -ForegroundColor Yellow
Set-Location "src/backend/Phos.Identity"

try {
    dotnet restore
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ dotnet restore succeeded" -ForegroundColor Green
    } else {
        Write-Host "✗ dotnet restore failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ dotnet restore failed with exception: $_" -ForegroundColor Red
    exit 1
}

# 3. Test dotnet build
Write-Host "`n3. Testing dotnet build..." -ForegroundColor Yellow

try {
    dotnet build --no-restore
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ dotnet build succeeded" -ForegroundColor Green
    } else {
        Write-Host "✗ dotnet build failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ dotnet build failed with exception: $_" -ForegroundColor Red
    exit 1
}

# 4. Test Docker build (optional - requires Docker)
Set-Location "../../../"
Write-Host "`n4. Testing Docker build..." -ForegroundColor Yellow

if (Get-Command docker -ErrorAction SilentlyContinue) {
    try {
        # Build the identity service specifically
        docker build -f src/backend/Phos.Identity/Dockerfile -t phos-identity-test .
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Docker build succeeded" -ForegroundColor Green
            # Clean up test image
            docker rmi phos-identity-test -f | Out-Null
        } else {
            Write-Host "✗ Docker build failed" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "✗ Docker build failed with exception: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠ Docker not found, skipping Docker build test" -ForegroundColor Yellow
}

Write-Host "`n=== All tests passed! ===" -ForegroundColor Green
Write-Host "The Phos Identity service build configuration is correct." -ForegroundColor Green

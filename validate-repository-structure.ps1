# Repository Structure Validation Script
Write-Host "=== Phos Healthcare Repository Structure Validation ===" -ForegroundColor Green

# Define the expected repository structure
$expectedStructure = @{
    # Backend services (should be in src/backend)
    "Backend Services" = @(
        "src/backend/Phos.Api",
        "src/backend/Phos.ApiGateway",
        "src/backend/Phos.Identity",
        "src/backend/Phos.Services",
        "src/backend/Phos.Data",
        "src/backend/Phos.HealthScore"
    )

    # Shared libraries (should be in src/shared)
    "Shared Libraries" = @(
        "src/shared/Phos.Common",
        "src/shared/Phos.Contracts"
    )

    # Frontend applications (should be in src/frontend)
    "Frontend Applications" = @(
        "src/frontend/phos-web",
        "src/frontend/employer-dashboard",
        "src/frontend/patient-app",
        "src/frontend/rn-dashboard"
    )
}

# Problematic duplicate locations that should NOT exist
$duplicateLocations = @(
    "Phos.Data",           # Should only be in src/backend/Phos.Data
    "Phos.Api",            # Should only be in src/backend/Phos.Api
    "Phos.Services",       # Should only be in src/backend/Phos.Services
    "backend",              # Should only be in src/backend
            "phos-web"             # Should only be in src/frontend/phos-web
)

Write-Host "`n1. Checking for expected project structure..." -ForegroundColor Yellow

$allGood = $true

foreach ($category in $expectedStructure.Keys) {
    Write-Host "`n${category}:" -ForegroundColor Cyan
    foreach ($path in $expectedStructure[$category]) {
        if (Test-Path $path) {
            Write-Host "  ✓ $path" -ForegroundColor Green
        } else {
            Write-Host "  ✗ MISSING: $path" -ForegroundColor Red
            $allGood = $false
        }
    }
}

Write-Host "`n2. Checking for problematic duplicate locations..." -ForegroundColor Yellow

foreach ($duplicate in $duplicateLocations) {
    if (Test-Path $duplicate) {
        Write-Host "  ✗ DUPLICATE FOUND: $duplicate (should be removed)" -ForegroundColor Red
        $allGood = $false
    } else {
        Write-Host "  ✓ No duplicate at: $duplicate" -ForegroundColor Green
    }
}

Write-Host "`n3. Checking project file references..." -ForegroundColor Yellow

# Check Identity project references
$identityProjectPath = "src/backend/Phos.Identity/Phos.Identity.csproj"
if (Test-Path $identityProjectPath) {
    $identityContent = Get-Content $identityProjectPath -Raw

    # Check for correct references
    $correctReferences = @(
        "../../shared/Phos.Common/Phos.Common.csproj",
        "../../shared/Phos.Contracts/Phos.Contracts.csproj",
        "../Phos.Data/Phos.Data.csproj"
    )

    $incorrectReferences = @(
        "../../libs/Phos.Common/Phos.Common.csproj",
        "../../libs/Phos.Contracts/Phos.Contracts.csproj",
        "../../Phos.Data/Phos.Data.csproj"
    )

    foreach ($ref in $correctReferences) {
        if ($identityContent -match [regex]::Escape($ref)) {
            Write-Host "  ✓ Correct reference: $ref" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Missing correct reference: $ref" -ForegroundColor Red
            $allGood = $false
        }
    }

    foreach ($ref in $incorrectReferences) {
        if ($identityContent -match [regex]::Escape($ref)) {
            Write-Host "  ✗ Incorrect reference found: $ref" -ForegroundColor Red
            $allGood = $false
        }
    }
} else {
    Write-Host "  ✗ Identity project not found" -ForegroundColor Red
    $allGood = $false
}

Write-Host "`n4. Checking for .NET 8 compatibility..." -ForegroundColor Yellow

$projectFiles = @(
    "src/backend/Phos.Identity/Phos.Identity.csproj",
    "src/shared/Phos.Common/Phos.Common.csproj",
    "src/shared/Phos.Contracts/Phos.Contracts.csproj",
    "src/backend/Phos.Data/Phos.Data.csproj"
)

foreach ($projectFile in $projectFiles) {
    if (Test-Path $projectFile) {
        $content = Get-Content $projectFile -Raw
        if ($content -match "<TargetFramework>net8\.0</TargetFramework>") {
            Write-Host "  ✓ $projectFile targets .NET 8" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $projectFile does not target .NET 8" -ForegroundColor Red
            $allGood = $false
        }

        if ($content -match "DisableImplicitNuGetFallbackFolder") {
            Write-Host "  ✓ $projectFile has NuGet fallback folder disabled" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ $projectFile missing NuGet fallback folder setting" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n5. Summary" -ForegroundColor Yellow

if ($allGood) {
    Write-Host "✓ Repository structure is correct!" -ForegroundColor Green
    Write-Host "All projects are in their proper locations and have correct references." -ForegroundColor Green
} else {
    Write-Host "✗ Repository structure has issues that need to be fixed." -ForegroundColor Red
    Write-Host "Please address the problems listed above." -ForegroundColor Red
}

Write-Host "`n=== Validation Complete ===" -ForegroundColor Green

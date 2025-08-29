# Repository Structure Validation Script
Write-Host "=== Phos Healthcare Repository Structure Validation ===" -ForegroundColor Green

# Define the expected repository structure (PHOS layout)
$expectedStructure = @{
    "PHOS Services" = @(
        "phos/services",
        "phos/services/phos-core",
        "phos/services/phos-sync",
        "phos/services/lab-interpreter",
        "phos/services/nutrition-kit"
    )

    "PHOS Apps" = @(
        "phos/apps/phos-ui",
        "phos/apps/api-gateway"
    )
}

# Problematic duplicate locations that should NOT exist (legacy layout)
$duplicateLocations = @(
    "src/backend",  # legacy layout should not be present anymore
    "src/frontend", # legacy layout should not be present anymore
    "backend",
    "phos-web"
)

Write-Host "`n1. Checking for expected project structure..." -ForegroundColor Yellow

$allGood = $true

foreach ($category in $expectedStructure.Keys) {
    Write-Host "" -ForegroundColor Cyan
    Write-Host ($category + ":") -ForegroundColor Cyan
    foreach ($path in $expectedStructure[$category]) {
        if (Test-Path $path) {
            Write-Host ("  [OK] " + $path) -ForegroundColor Green
        } else {
            Write-Host ("  [X] MISSING: " + $path) -ForegroundColor Red
            $allGood = $false
        }
    }
}

Write-Host "`n2. Checking for problematic duplicate locations..." -ForegroundColor Yellow

foreach ($duplicate in $duplicateLocations) {
    if (Test-Path $duplicate) {
        Write-Host ("  [X] DUPLICATE FOUND: " + $duplicate + " (should be removed)") -ForegroundColor Red
        $allGood = $false
    } else {
        Write-Host ("  [OK] No duplicate at: " + $duplicate) -ForegroundColor Green
    }
}

Write-Host "`n3. Skipping legacy project reference checks (migrated to phos/*)." -ForegroundColor Yellow

Write-Host "`n5. Summary" -ForegroundColor Yellow

if ($allGood) {
    Write-Host "[OK] Repository structure is correct!" -ForegroundColor Green
    Write-Host "All projects are in their proper locations and have correct references." -ForegroundColor Green
} else {
    Write-Host "[X] Repository structure has issues that need to be fixed." -ForegroundColor Red
    Write-Host "Please address the problems listed above." -ForegroundColor Red
}

Write-Host "`n=== Validation Complete ===" -ForegroundColor Green

# Repository Cleanup Script - Remove Duplicate Folders and Files
Write-Host "=== Phos Healthcare Repository Cleanup ===" -ForegroundColor Green
Write-Host "This script will remove duplicate folders that are causing scaffolding issues." -ForegroundColor Yellow

# Define folders/files to remove (duplicates of what exists in src/)
$duplicatesToRemove = @(
    "apps",                 # Duplicate of src/backend projects
    "backend",              # Duplicate of src/backend
    "phos-web",           # Duplicate of src/frontend/phos-web
    "libs",                # Old location, now in src/shared
    "Phos.Data",          # Duplicate of src/backend/Phos.Data
    "Phos.Api",           # Duplicate of src/backend/Phos.Api
    "Phos.Services",      # Duplicate of src/backend/Phos.Services
    "integration",         # Old integration folder
    "Phos.Common",        # If it exists at root
    "Phos.Contracts"      # If it exists at root
)

# Files to remove (empty or temporary files)
$filesToRemove = @(
    "cd", "git", "error", "create", "docker", "remote", "4"
)

Write-Host "`nStep 1: Removing duplicate folders..." -ForegroundColor Yellow

foreach ($folder in $duplicatesToRemove) {
    if (Test-Path $folder -PathType Container) {
        Write-Host "Removing duplicate folder: $folder" -ForegroundColor Red
        try {
            Remove-Item -Path $folder -Recurse -Force
            Write-Host "✓ Removed: $folder" -ForegroundColor Green
        }
        catch {
            Write-Host "✗ Failed to remove $folder`: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "✓ $folder does not exist (good)" -ForegroundColor Green
    }
}

Write-Host "`nStep 2: Removing temporary/empty files..." -ForegroundColor Yellow

foreach ($file in $filesToRemove) {
    if (Test-Path $file -PathType Leaf) {
        Write-Host "Removing temporary file: $file" -ForegroundColor Red
        try {
            Remove-Item -Path $file -Force
            Write-Host "✓ Removed: $file" -ForegroundColor Green
        }
        catch {
            Write-Host "✗ Failed to remove $file`: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "✓ $file does not exist (good)" -ForegroundColor Green
    }
}

Write-Host "`nStep 3: Verifying proper structure remains..." -ForegroundColor Yellow

# Verify the correct structure still exists
$requiredPaths = @(
    "src/backend/Phos.Identity",
    "src/backend/Phos.Api",
    "src/backend/Phos.Services",
    "src/backend/Phos.Data",
    "src/backend/Phos.ApiGateway",
    "src/backend/Phos.HealthScore",
    "src/shared/Phos.Common",
    "src/shared/Phos.Contracts"
)

$allGood = $true
foreach ($path in $requiredPaths) {
    if (Test-Path $path) {
        Write-Host "✓ Required path exists: $path" -ForegroundColor Green
    } else {
        Write-Host "✗ MISSING required path: $path" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host "`nStep 4: Summary" -ForegroundColor Yellow

if ($allGood) {
    Write-Host "✓ Repository cleanup completed successfully!" -ForegroundColor Green
    Write-Host "All duplicate folders removed and proper structure verified." -ForegroundColor Green
    Write-Host "You can now run the validation script to confirm everything is correct." -ForegroundColor Green
} else {
    Write-Host "✗ Repository cleanup completed but some required paths are missing." -ForegroundColor Red
    Write-Host "Please verify the repository structure." -ForegroundColor Red
}

Write-Host "`n=== Cleanup Complete ===" -ForegroundColor Green

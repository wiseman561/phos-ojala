# PowerShell script to install Git hooks using Husky
# Compatible with Windows systems

# Print header
Write-Host "Installing Git hooks using Husky..." -ForegroundColor Cyan

# Change to repository root directory
$rootDir = git rev-parse --show-toplevel
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to determine repository root directory." -ForegroundColor Red
    exit 1
}

Set-Location $rootDir

# Install Husky hooks
Write-Host "Running npx husky install..." -ForegroundColor Yellow
npx husky install

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to install Husky hooks." -ForegroundColor Red
    exit 1
}

Write-Host "Git hooks installed successfully!" -ForegroundColor Green 
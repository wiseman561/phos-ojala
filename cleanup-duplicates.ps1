<#
    Removes legacy duplicate folders & stray placeholder files
    Run from repo root:  .\cleanup-duplicates.ps1
#>

$ErrorActionPreference = 'Stop'

# Obsolete duplicate directories
$duplicateDirs = @(
    'apps',
    'backend',
    'libs',
    'integration',
    'Phos.Data',
    'Phos.Api',
    'Phos.Services',
    'phos-web'
)

foreach ($dir in $duplicateDirs) {
    if (Test-Path $dir) {
        Write-Host "Removing directory $dir ..."
        Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "$dir not found – skipping"
    }
}

# Stray placeholder files
$orphanFiles = @('cd','create','docker','remote','error')
foreach ($file in $orphanFiles) {
    if (Test-Path $file) {
        Write-Host "Deleting file $file ..."
        Remove-Item $file -Force
    }
}

Write-Host "`nDuplicate-cleanup completed."

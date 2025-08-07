$root = $PWD

Get-ChildItem -Path . -Filter package.json -Recurse -File -Force | Where-Object {
    $_.FullName -notmatch '\\node_modules\\'
} | ForEach-Object {
    $dir = Split-Path $_.FullName -Parent
    Write-Host "Processing $dir"
    Push-Location $dir
    if (Test-Path "package-lock.json") {
        Remove-Item "package-lock.json" -Force
    }
    $npmResult = npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ npm install failed in $dir"
        Pop-Location
        exit 1
    }
    git add package-lock.json
    Pop-Location
}

git commit -m "Sync all package-lock.json files for monorepo CI"
git push

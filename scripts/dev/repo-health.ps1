<#  repo-health.ps1 – one-shot repo audit  #>

param(
    [switch]$SkipNode   = $false,
    [switch]$SkipDocker = $false
)

$ErrorActionPreference = "Stop"
$root   = Resolve-Path .
$outDir = Join-Path $root "repo-audit"

if (Test-Path $outDir) { Remove-Item $outDir -Recurse -Force }
New-Item $outDir -ItemType Directory | Out-Null

##########  Git hygiene  ##########
git status --porcelain=v1                 > "$outDir\git-dirty.txt"
git ls-files --others --exclude-standard >> "$outDir\git-dirty.txt"

##########  .NET restore / build / format  ##########
dotnet restore                               | Tee-Object "$outDir\dotnet-restore.log"

dotnet build --no-restore --warnaserror -v:m `
    /clp:ErrorsOnly,Summary                  |
    Tee-Object "$outDir\dotnet-build.log"

# Allow exit codes 0 (clean) or 2 (would-fix)        
try {
    dotnet format --verify-no-changes --binarylog:false |
        Tee-Object "$outDir\dotnet-format.txt"
} catch {
    Write-Warning "dotnet format found fixes – see dotnet-format.txt"
}

dotnet list package --outdated |
    Tee-Object "$outDir\nuget-outdated.txt"

##########  Node packages (lint + vuln)  ##########
if (-not $SkipNode -and (Get-Command npm -ErrorAction SilentlyContinue)) {
    Get-ChildItem src -Recurse -Filter package.json | ForEach-Object {
        $pkgDir = $_.Directory.FullName
        Push-Location $pkgDir

        npm install --silent | Out-Null

        if (Test-Path .eslintrc* ) {
            npx eslint "**/*.js" "**/*.jsx" "**/*.ts" "**/*.tsx" -f json > eslint-report.json
                 -o "$outDir\eslint-$($pkgDir -replace '[\\/:]', '_').json" --quiet
        }

        npm audit --json |
            Out-File "$outDir\npm-audit-$($pkgDir -replace '[\\/:]', '_').json" -Encoding utf8

        Pop-Location
    }
} else {
    Write-Warning "Skipping Node audit – npm not found (or --SkipNode)"
}

##########  Docker / compose lint  ##########
if (-not $SkipDocker) {
    if (Test-Path docker-compose.yml) {
        Get-Content ./docker-compose.yml |
            docker run --rm -i hadolint/hadolint |
            Out-File "$outDir\compose-hadolint.txt"
    }

    Get-ChildItem src -Recurse -Filter Dockerfile | ForEach-Object {
        Get-Content $_.FullName |
            docker run --rm -i hadolint/hadolint |
            Out-File "$outDir\dockerfile-$($_.FullName -replace '[\\/:]', '_').txt"
    }
}

##########  List remaining .dockerignore files  ##########
Get-ChildItem src -Recurse -Filter .dockerignore |
    Select-Object -ExpandProperty FullName |
    Out-File "$outDir\dockerignore-list.txt"

Write-Host "`nAudit complete - see $outDir"

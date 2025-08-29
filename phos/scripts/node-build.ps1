Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function New-DirectoryIfMissing {
  param([Parameter(Mandatory=$true)][string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) { New-Item -ItemType Directory -Force -Path $Path | Out-Null }
}

function Write-Utf8 {
  param([Parameter(Mandatory=$true)][string]$Path,[Parameter(Mandatory=$true)][string]$Content)
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  $parent = Split-Path -Path $Path -Parent
  if ($parent) { New-DirectoryIfMissing -Path $parent }
  [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

$repoRoot = (Get-Location).Path
$reportsNode = Join-Path $repoRoot '_reports/node'
New-DirectoryIfMissing -Path $reportsNode

$apps = @(
  @{ name='api-gateway'; path='phos/apps/api-gateway'; log= (Join-Path $reportsNode 'api-gateway.log') },
  @{ name='phos-ui'; path='phos/apps/phos-ui'; log= (Join-Path $reportsNode 'phos-ui.log') }
)

$npm = Get-Command npm -ErrorAction SilentlyContinue

$nodeResults = @()
foreach ($app in $apps) {
  $name = $app.name
  $appPath = Join-Path $repoRoot $app.path
  $logPath = $app.log
  $passed = $false
  $errors = @()

  if (-not (Test-Path -LiteralPath $appPath)) {
    Write-Utf8 -Path $logPath -Content "Path not found: $($app.path)"
    $errors = @("path missing")
  } elseif (-not $npm) {
    Write-Utf8 -Path $logPath -Content "npm not found on system — skipping build"
    $errors = @("npm missing")
  } else {
    try {
      Push-Location $appPath
      # fresh log
      if (Test-Path -LiteralPath $logPath) { Remove-Item -LiteralPath $logPath -Force }
      cmd /c "npm ci" | Out-File -FilePath $logPath -Encoding utf8 -Append
      if ($LASTEXITCODE -ne 0) { $errors += 'npm ci failed' }
      cmd /c "npm run build" | Out-File -FilePath $logPath -Encoding utf8 -Append
      if ($LASTEXITCODE -ne 0) { $errors += 'npm build failed' }
      $passed = ($errors.Count -eq 0)
    } catch {
      $errors = @("exception: $($_.Exception.Message)")
      Write-Utf8 -Path $logPath -Content (Get-Content -LiteralPath $logPath -Raw -ErrorAction SilentlyContinue)
    } finally {
      Pop-Location
    }
  }

  # Collect first 20 lines of errors from log as context
  $logHead = @()
  if (Test-Path -LiteralPath $logPath) {
    $logHead = (Get-Content -LiteralPath $logPath -TotalCount 20)
  }
  $nodeResults += [PSCustomObject]@{
    name   = $name
    passed = [bool]$passed
    errors = if ($passed) { @() } else { if ($errors.Count -gt 0) { @($errors) } else { @($logHead) } }
    _logHead = @($logHead)
  }

# Update STATUS.json node results
$statusPath = Join-Path $repoRoot '_reports/STATUS.json'
if (Test-Path -LiteralPath $statusPath) {
  $status = Get-Content -LiteralPath $statusPath -Raw | ConvertFrom-Json
} else {
  $status = [PSCustomObject]@{ validator=@{passed=$true;notes=''}; dotnet=@(); node=@(); docker=@{passed=$true;errors=@()}; summary=@{passed=$false;failCount=0} }
}
$status.node = @()
foreach ($n in $nodeResults) {
  $status.node += [PSCustomObject]@{ name=$n.name; passed=$n.passed; errors=@($n.errors) }
}

# Recompute summary
$failCount = 0
if ($status.validator -and -not $status.validator.passed) { $failCount++ }
if ($status.dotnet) { foreach ($d in $status.dotnet) { if (-not $d.passed) { $failCount++ } } }
foreach ($n in $status.node) { if (-not $n.passed) { $failCount++ } }
if ($status.docker -and -not $status.docker.passed) { $failCount++ }
$status.summary = [PSCustomObject]@{ passed = [bool]($failCount -eq 0); failCount = [int]$failCount }

($status | ConvertTo-Json -Depth 10) | Out-File -FilePath $statusPath -Encoding utf8

# Regenerate FIXLIST.md Node section
$fixPath = Join-Path $repoRoot '_reports/FIXLIST.md'
$lines = @()
$lines += '## Fix List'
$lines += ''
$lines += '- [ ] Fix .NET target frameworks to net8.0 where missing'
$lines += '- [ ] Add missing NuGet fallback flag if our validator requires it'
$lines += '- [ ] Resolve TypeScript/ESLint errors in apps'
$lines += '- [ ] Repair Dockerfile build contexts/paths'
$lines += '- [ ] Re-run doctor until green'
$lines += ''
$lines += '### Validator issues'
if ($status.validator -and $status.validator.passed) { $lines += ''; $lines += 'Validator passed.' } else { $lines += 'See validator logs.' }
$lines += ''
$lines += '### .NET failures'
if ($status.dotnet) {
  foreach ($d in $status.dotnet) {
    if (-not $d.passed) {
      $lines += ''
      $lines += "#### $($d.name)"
      $lines += '```text'
      $lines += ($d.errors | Select-Object -First 20)
      $lines += '```'
    }
  }
}
}
$lines += ''
$lines += '### Node failures'
foreach ($n in $nodeResults) {
  if (-not $n.passed) {
    $lines += ''
    $lines += "#### $($n.name)"
    $lines += '```text'
    $lines += ($n._logHead | Select-Object -First 20)
    $lines += '```'
  }
}
$lines += ''
$lines += '### Docker build'
if ($status.docker -and $status.docker.passed) { $lines += 'Skipped or passed.' } else { $lines += 'Compose missing or errors; see docker_build.log' }

Write-Utf8 -Path $fixPath -Content ($lines -join "`r`n")

Write-Host 'Node build step complete.' -ForegroundColor Cyan


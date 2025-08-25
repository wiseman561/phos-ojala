<#
Synopsis:
  Repository doctor script. Runs sanity checks and writes consolidated reports under _reports.
  - Git status snapshot
  - Repository validation with unicode sanitization/retry
  - .NET builds for all csproj under src/backend
  - Node builds for phos/apps/api-gateway and phos/apps/phos-ui
  - Docker compose build (dev)

Behavior:
  - Creates missing folders
  - Produces _reports/STATUS.json and _reports/STATUS.md
  - Returns non-zero exit code if any section fails
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Ensure consistent UTF8 output without BOM
try {
  [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
} catch { }

function New-DirectoryIfMissing {
  param(
    [Parameter(Mandatory=$true)][string]$Path
  )
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
  }
}

function ConvertTo-SanitizedText {
  param(
    [AllowNull()][string]$Text
  )
  if ($null -eq $Text) { return '' }
  # Allow tabs/newlines/carriage return and visible ASCII
  return ($Text -replace '[^\u0009\u000A\u000D\u0020-\u007E]', '?')
}

function Write-FileUtf8 {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)][string]$Content
  )
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  $parent = Split-Path -Path $Path -Parent
  if ($parent) { New-DirectoryIfMissing -Path $parent }
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Start-CommandCapture {
  param(
    [Parameter(Mandatory=$true)][string]$FilePath,
    [string[]]$ArgumentList,
    [string]$WorkingDirectory,
    [string]$StdOutPath,
    [string]$StdErrPath
  )
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $FilePath
  if ($ArgumentList) { $psi.Arguments = [string]::Join(' ', $ArgumentList) }
  if ($WorkingDirectory) { $psi.WorkingDirectory = $WorkingDirectory }
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi
  [void]$p.Start()
  $stdOut = $p.StandardOutput.ReadToEnd()
  $stdErr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()
  if ($StdOutPath) { Write-FileUtf8 -Path $StdOutPath -Content $stdOut }
  if ($StdErrPath) { Write-FileUtf8 -Path $StdErrPath -Content $stdErr }
  return [PSCustomObject]@{
    ExitCode = $p.ExitCode
    StdOut   = $stdOut
    StdErr   = $stdErr
  }
}

function Invoke-GitStatus {
  param(
    [Parameter(Mandatory=$true)][string]$ReportFile
  )
  try {
    $result = Start-CommandCapture -FilePath 'git' -ArgumentList @('status','-s')
    Write-FileUtf8 -Path $ReportFile -Content $result.StdOut
  } catch {
    Write-FileUtf8 -Path $ReportFile -Content (ConvertTo-SanitizedText ("ERROR: $($_.Exception.Message)"))
  }
}

function Invoke-Validator {
  param(
    [Parameter(Mandatory=$true)][string]$RawPath,
    [Parameter(Mandatory=$true)][string]$SanitizedPath
  )
  $validatorExe = 'powershell'
  $validatorArgs = @('-NoProfile','-ExecutionPolicy','Bypass','-File','./validate-repository-structure.ps1')

  $res = Start-CommandCapture -FilePath $validatorExe -ArgumentList $validatorArgs
  $combined1 = $res.StdOut
  if ($res.StdErr) { $combined1 += "`n`n[stderr]`n" + $res.StdErr }
  Write-FileUtf8 -Path $RawPath -Content $combined1
  $sanitized = ConvertTo-SanitizedText $combined1
  Write-FileUtf8 -Path $SanitizedPath -Content $sanitized

  $passed = ($res.ExitCode -eq 0)

  # If failed and raw output contains non-ASCII, retry once to see if sanitization resolves issues
  if (-not $passed -and (($res.StdOut + $res.StdErr) -match '[^\u0009\u000A\u000D\u0020-\u007E]')) {
    $res2 = Start-CommandCapture -FilePath $validatorExe -ArgumentList $validatorArgs
    $combined2 = $res2.StdOut
    if ($res2.StdErr) { $combined2 += "`n`n[stderr]`n" + $res2.StdErr }
    $san2 = ConvertTo-SanitizedText $combined2
    Write-FileUtf8 -Path $SanitizedPath -Content $san2
    $passed = ($res2.ExitCode -eq 0)
  }

  return [PSCustomObject]@{
    Passed = [bool]$passed
    Notes  = if ($passed) { 'Validator succeeded' } else { 'Validator failed. See validator_raw.txt/validator_sanitized.txt' }
  }
}

function Invoke-DotNetBuilds {
  param(
    [Parameter(Mandatory=$true)][string]$ServicesRoot,
    [Parameter(Mandatory=$true)][string]$ReportsRoot
  )
  New-DirectoryIfMissing -Path $ReportsRoot
  $items = @()
  if (Test-Path -LiteralPath $ServicesRoot) {
    $csprojs = Get-ChildItem -LiteralPath $ServicesRoot -Recurse -Filter '*.csproj' -File -ErrorAction SilentlyContinue
  } else {
    $csprojs = @()
  }
  foreach ($proj in $csprojs) {
    $serviceName = if ($proj.BaseName) { $proj.BaseName } else { [IO.Path]::GetFileNameWithoutExtension($proj.Name) }
    $logPath = Join-Path $ReportsRoot ("$serviceName.log")
    $dotnetArgs = @('build', '"' + $proj.FullName + '"', '-c','Release','-nologo')
    $res = Start-CommandCapture -FilePath 'dotnet' -ArgumentList $dotnetArgs
    $combined = $res.StdOut
    if ($res.StdErr) { $combined += "`n`n[stderr]`n" + $res.StdErr }
    Write-FileUtf8 -Path $logPath -Content $combined

    $passed = ($res.ExitCode -eq 0)
    # Extract error lines (best-effort)
    $errors = @()
    $combined -split "`r?`n" | ForEach-Object {
      if ($_ -match "(^|\s)error\s|^\s*ERROR|: error CS\d+") { $errors += $_ }
    }
    if (-not $passed -and $errors.Count -eq 0) {
      # If failed but no error lines detected, include last 10 lines as context
      $tail = ($combined -split "`r?`n") | Select-Object -Last 10
      $errors = $tail
    }
    $items += [PSCustomObject]@{
      name   = $serviceName
      passed = [bool]$passed
      errors = @($errors | Select-Object -First 10)
    }
  }
  return ,$items
}

function Invoke-NodeBuild {
  param(
    [Parameter(Mandatory=$true)][string]$AppName,
    [Parameter(Mandatory=$true)][string]$AppPath,
    [Parameter(Mandatory=$true)][string]$ReportFile
  )
  $combinedLog = ''
  $passed = $true

  if (-not (Test-Path -LiteralPath $AppPath)) {
    $combinedLog = "Path not found: $AppPath"
    $passed = $false
  } else {
    try {
      $resCi = Start-CommandCapture -FilePath 'npm' -ArgumentList @('ci') -WorkingDirectory $AppPath
      $combinedCi = $resCi.StdOut
      if ($resCi.StdErr) { $combinedCi += "`n[stderr]`n" + $resCi.StdErr }
      $combinedLog += "# npm ci`n" + $combinedCi + "`n`n"
      if ($resCi.ExitCode -ne 0) { $passed = $false }

      if ($passed) {
        $resBuild = Start-CommandCapture -FilePath 'npm' -ArgumentList @('run','build') -WorkingDirectory $AppPath
        $combinedBuild = $resBuild.StdOut
        if ($resBuild.StdErr) { $combinedBuild += "`n[stderr]`n" + $resBuild.StdErr }
        $combinedLog += "# npm run build`n" + $combinedBuild
        if ($resBuild.ExitCode -ne 0) { $passed = $false }
      }
    } catch {
      $combinedLog += "Exception: $($_.Exception.Message)"
      $passed = $false
    }
  }

  Write-FileUtf8 -Path $ReportFile -Content $combinedLog

  $errors = @()
  $combinedLog -split "`r?`n" | ForEach-Object {
    if ($_ -match "(^|\s)ERR!|(^|\s)Error:|(^|\s)error\s") { $errors += $_ }
  }
  if (-not $passed -and $errors.Count -eq 0) {
    $errors = ($combinedLog -split "`r?`n") | Select-Object -Last 10
  }

  return [PSCustomObject]@{
    name   = $AppName
    passed = [bool]$passed
    errors = @($errors | Select-Object -First 10)
  }
}

function Invoke-DockerBuild {
  param(
    [Parameter(Mandatory=$true)][string]$ComposeFile,
    [Parameter(Mandatory=$true)][string]$ReportFile
  )
  if (-not (Test-Path -LiteralPath $ComposeFile)) {
    $msg = "Compose file not found: $ComposeFile"
    Write-FileUtf8 -Path $ReportFile -Content $msg
    return [PSCustomObject]@{ passed = $false; errors = @($msg) }
  }

  $res = Start-CommandCapture -FilePath 'docker' -ArgumentList @('compose','-f', '"' + $ComposeFile + '"','build')
  $combined = $res.StdOut
  if ($res.StdErr) { $combined += "`n`n[stderr]`n" + $res.StdErr }
  Write-FileUtf8 -Path $ReportFile -Content $combined
  $passed = ($res.ExitCode -eq 0)

  $errors = @()
  $combined -split "`r?`n" | ForEach-Object {
    if ($_ -match "(^|\s)error\b|\bfail(ed)?\b|no such file|not found|denied") { $errors += $_ }
  }
  if (-not $passed -and $errors.Count -eq 0) {
    $errors = ($combined -split "`r?`n") | Select-Object -Last 10
  }
  return [PSCustomObject]@{
    passed = [bool]$passed
    errors = @($errors | Select-Object -First 15)
  }
}

# Prepare folders
$reportsRoot = '_reports'
New-DirectoryIfMissing -Path $reportsRoot
New-DirectoryIfMissing -Path (Join-Path $reportsRoot 'dotnet')
New-DirectoryIfMissing -Path (Join-Path $reportsRoot 'node')

# 1) Git status
Invoke-GitStatus -ReportFile (Join-Path $reportsRoot 'git_status.txt')

# 2) Validate repository
$validatorResult = Invoke-Validator -RawPath (Join-Path $reportsRoot 'validator_raw.txt') -SanitizedPath (Join-Path $reportsRoot 'validator_sanitized.txt')

# 3) .NET builds
$dotnetItems = Invoke-DotNetBuilds -ServicesRoot 'src/backend' -ReportsRoot (Join-Path $reportsRoot 'dotnet')

# 4) Node builds
$nodeItems = @()
if (Test-Path -LiteralPath 'phos/apps/api-gateway') {
  $nodeItems += Invoke-NodeBuild -AppName 'api-gateway' -AppPath 'phos/apps/api-gateway' -ReportFile (Join-Path (Join-Path $reportsRoot 'node') 'api-gateway.log')
}
if (Test-Path -LiteralPath 'phos/apps/phos-ui') {
  $nodeItems += Invoke-NodeBuild -AppName 'phos-ui' -AppPath 'phos/apps/phos-ui' -ReportFile (Join-Path (Join-Path $reportsRoot 'node') 'phos-ui.log')
}

# 5) Docker build
$dockerResult = Invoke-DockerBuild -ComposeFile 'phos/docker-compose.yml' -ReportFile (Join-Path $reportsRoot 'docker_build.log')

# Build STATUS.json model
$failCount = 0
if (-not $validatorResult.Passed) { $failCount++ }
foreach ($d in $dotnetItems) { if (-not $d.passed) { $failCount++ } }
foreach ($n in $nodeItems) { if (-not $n.passed) { $failCount++ } }
if (-not $dockerResult.passed) { $failCount++ }

$status = [PSCustomObject]@{
  validator = [PSCustomObject]@{ passed = [bool]$validatorResult.Passed; notes = [string]$validatorResult.Notes }
  dotnet    = @($dotnetItems)
  node      = @($nodeItems)
  docker    = [PSCustomObject]@{ passed = [bool]$dockerResult.passed; errors = @($dockerResult.errors) }
  summary   = [PSCustomObject]@{ passed = [bool]($failCount -eq 0); failCount = [int]$failCount }
}

$statusJsonPath = Join-Path $reportsRoot 'STATUS.json'
($status | ConvertTo-Json -Depth 8) | Out-File -FilePath $statusJsonPath -Encoding utf8

# Build STATUS.md
$md = @()
$md += "# Repository Doctor Status"
$md += ""
$md += "## Validator"
$validatorStatusText = ''
if ($status.validator.passed) { $validatorStatusText = 'Passed ✅' } else { $validatorStatusText = 'Failed ❌' }
$md += ("- Status: " + $validatorStatusText)
if ($status.validator.notes) { $md += ("- Notes: " + $status.validator.notes) }
$md += ""
$validatorCheck = ' '
if ($status.validator.passed) { $validatorCheck = 'x' }
$md += "- [$validatorCheck] Repository structure valid"
$md += ""

$md += "## .NET Builds"
if ($status.dotnet.Count -eq 0) {
  $md += "_No .csproj found under src/backend_"
} else {
  $md += "| Service | Status | Errors (first lines) |"
  $md += "|---|---|---|"
  foreach ($d in $status.dotnet) {
    $statusText = ''
    if ($d.passed) { $statusText = 'Passed ✅' } else { $statusText = 'Failed ❌' }
    $errText = ''
    if ($d.errors -and $d.errors.Count -gt 0) { $errText = ( ($d.errors -join '<br/>') -replace '\|','\\|' ) }
    $md += "| $($d.name) | $statusText | $errText |"
  }
}
$md += ""
$md += "### .NET Checklist"
foreach ($d in $status.dotnet) {
  $mark = ' '
  if ($d.passed) { $mark = 'x' }
  $md += "- [$mark] $($d.name)"
}
$md += ""

$md += "## Node Builds"
$md += "| App | Status | Errors (first lines) |"
$md += "|---|---|---|"
foreach ($n in $status.node) {
  $statusText = ''
  if ($n.passed) { $statusText = 'Passed ✅' } else { $statusText = 'Failed ❌' }
  $errText = ''
  if ($n.errors -and $n.errors.Count -gt 0) { $errText = ( ($n.errors -join '<br/>') -replace '\|','\\|' ) }
  $md += "| $($n.name) | $statusText | $errText |"
}
$md += ""
$md += "### Node Checklist"
foreach ($n in $status.node) {
  $mark = ' '
  if ($n.passed) { $mark = 'x' }
  $md += "- [$mark] $($n.name)"
}
$md += ""

$md += "## Docker Build"
$dockerStatusText = ''
if ($status.docker.passed) { $dockerStatusText = 'Passed ✅' } else { $dockerStatusText = 'Failed ❌' }
$md += ("- Status: " + $dockerStatusText)
if ($status.docker.errors -and $status.docker.errors.Count -gt 0) {
  $md += ("- Errors:" )
  foreach ($e in $status.docker.errors) { $md += ("  - " + ($e -replace '\|','\\|')) }
}
$md += ""
$dockerCheck = ' '
if ($status.docker.passed) { $dockerCheck = 'x' }
$md += "- [$dockerCheck] Docker compose build"
$md += ""

$md += "## Summary"
$overallText = ''
if ($status.summary.passed) { $overallText = 'Passed ✅' } else { $overallText = 'Failed ❌' }
$md += ("- Overall: " + $overallText)
$md += ("- Fail count: " + $status.summary.failCount)

$statusMdPath = Join-Path $reportsRoot 'STATUS.md'
Write-FileUtf8 -Path $statusMdPath -Content ($md -join "`r`n")

# Console summary
Write-Host "Reports written to: $reportsRoot" -ForegroundColor Cyan
Write-Host "Overall status: " -NoNewline
if ($status.summary.passed) { Write-Host 'PASSED' -ForegroundColor Green } else { Write-Host 'FAILED' -ForegroundColor Red }

if (-not $status.summary.passed) { exit 1 } else { exit 0 }



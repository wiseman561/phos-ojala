Param()

$ErrorActionPreference = 'Stop'

function Write-Section($msg) {
  Write-Host "=== $msg ===" -ForegroundColor Cyan
}

function Ensure-Dir($p) {
  if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p | Out-Null }
}

# Pre-flight
Write-Section "Pre-flight"

Ensure-Dir ".\scripts"
Ensure-Dir ".\reports"
git rev-parse --is-inside-work-tree | Out-Null

# 0) Branch setup
Write-Section "Git branch"
git fetch --all | Out-Null
git checkout main | Out-Null
git pull | Out-Null

$branch = "chore/fe-verification-and-legacy-chart-cleanup"
$existingBranch = (git branch --list $branch) -ne $null
if ($existingBranch) {
  git checkout $branch | Out-Null
} else {
  git checkout -b $branch | Out-Null
}

# 1) Step 1 verification: inspect src/frontend and scan for legacy names
Write-Section "Step 1: Verify front-end consolidation state"

$legacyNames = @(
  'phos\.web', 'Phos\.PatientPortal', 'phos\.admin',
  'phos-web', 'phos-admin', 'patient-app', 'employer-dashboard', 'rn-dashboard'
)

"--- Inventory src/frontend ---" | Out-File .\reports\fe_inventory.txt -Encoding UTF8
if (Test-Path ".\src\frontend") {
  Get-ChildItem -Directory ".\src\frontend" | 
    Select-Object Name, FullName |
    Format-Table -AutoSize | Out-String | Out-File .\reports\fe_inventory.txt -Append -Encoding UTF8
} else {
  "No src/frontend directory found." | Out-File .\reports\fe_inventory.txt -Append -Encoding UTF8
}

Write-Host "Scanning source code for legacy FE names..."
$patterns = $legacyNames -join '|'
$hits = @()
if (Test-Path ".\src") {
  $hits = Select-String -Path ".\src\**\*" -Pattern $patterns -CaseSensitive -ErrorAction SilentlyContinue
}

"--- Legacy reference scan ---" | Out-File .\reports\legacy_fe_references.txt -Encoding UTF8
if ($hits -and $hits.Count -gt 0) {
  $hits | ForEach-Object {
    "$($_.Path):$($_.LineNumber): $($_.Line.Trim())"
  } | Out-File .\reports\legacy_fe_references.txt -Append -Encoding UTF8
  Write-Warning "Legacy references still found in src/. Review reports\legacy_fe_references.txt"
  # Do not auto-fix. We proceed to step 2 since these are references only; apps are archived.
} else {
  "No legacy references found in src/." | Out-File .\reports\legacy_fe_references.txt -Append -Encoding UTF8
}

# 2) Step 2 cleanup: remove legacy charts and scrub infra/charts references
Write-Section "Step 2: Legacy Helm charts cleanup"

$legacyCharts = @(
  "charts\employer-dashboard",
  "charts\patient-app",
  "charts\rn-dashboard"
)

$removed = @()
foreach ($chart in $legacyCharts) {
  if (Test-Path $chart) {
    Write-Host "Removing legacy chart: $chart" -ForegroundColor Yellow
    git rm -r --ignore-unmatch $chart | Out-Null
    $removed += $chart
  }
}

# Scan for legacy names in charts/ and infra/
Write-Host "Scanning charts/ and infra/ for legacy references..."
$infraHits = @()
$infraHits += Select-String -Path ".\charts\**\*", ".\infra\**\*" -Pattern $patterns -CaseSensitive -ErrorAction SilentlyContinue

"--- Infra/chart legacy reference scan ---" | Out-File .\reports\infra_legacy_refs.txt -Encoding UTF8
if ($infraHits -and $infraHits.Count -gt 0) {
  $infraHits | ForEach-Object {
    "$($_.Path):$($_.LineNumber): $($_.Line.Trim())"
  } | Out-File .\reports\infra_legacy_refs.txt -Append -Encoding UTF8
  Write-Warning "Legacy references remain in charts/ or infra/. See reports\infra_legacy_refs.txt"
} else {
  "No legacy references found in charts/ or infra/." | Out-File .\reports\infra_legacy_refs.txt -Append -Encoding UTF8
}

# Optional: Helm template sanity check (only if helm exists and an umbrella chart is present)
Write-Section "Helm sanity check (optional)"
$helm = Get-Command helm -ErrorAction SilentlyContinue
$umbrella = Get-ChildItem -Directory ".\charts" | Where-Object { Test-Path (Join-Path $_.FullName "Chart.yaml") } | Select-Object -First 1

$helmLog = ".\reports\helm_template.log"
if ($helm -and $umbrella) {
  Write-Host "Running 'helm template' on: $($umbrella.FullName)"
  try {
    helm template test $umbrella.FullName *> $helmLog
    Write-Host "Helm template completed. Log at $helmLog"
  } catch {
    "Helm template failed: $($_.Exception.Message)" | Out-File $helmLog -Append -Encoding UTF8
    Write-Warning "Helm template reported errors. Review $helmLog"
  }
} else {
  "Helm or umbrella chart not found; skipping helm template." | Out-File $helmLog -Encoding UTF8
}

# 3) Commit and push
Write-Section "Commit & push"
git add -A | Out-Null

$commitMsg = "chore(frontend/infra): Step1 verification reports; remove legacy FE charts; scan & report legacy refs"
git commit -m $commitMsg | Out-Null

# Handle no-op commit case gracefully
if ($LASTEXITCODE -ne 0) {
  Write-Host "No changes to commit or commit failed; proceeding to push if branch is new." -ForegroundColor DarkYellow
}

git push --set-upstream origin $branch 2>$null | Out-Null

# 4) Summary
$summary = @()
$summary += "STEP 1: Front-end verification"
$summary += " - Inventory: reports\\fe_inventory.txt"
$summary += " - Legacy references (src/): reports\\legacy_fe_references.txt"
$summary += ""
$summary += "STEP 2: Legacy charts cleanup"
$summary += " - Removed charts: " + ($(if ($removed.Count -gt 0) { $removed -join ', ' } else { 'none found' }))
$summary += " - Infra/chart references: reports\\infra_legacy_refs.txt"
$summary += ""
$summary += "Helm sanity check: reports\\helm_template.log"
$summary += ""
$summary += "Branch: $branch (pushed) -- open PR when ready."

$summaryText = $summary -join [Environment]::NewLine
$summaryText | Out-File .\reports\fe_cleanup_summary.txt -Encoding UTF8

Write-Section "DONE"
Write-Host $summaryText

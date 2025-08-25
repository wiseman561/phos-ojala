Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = 'src/backend'
if (-not (Test-Path -LiteralPath $root)) {
  Write-Host "Path not found: $root" -ForegroundColor Yellow
  exit 0
}

$updated = @()
Get-ChildItem -LiteralPath $root -Recurse -Filter '*.csproj' -File |
  Where-Object { $_.Name -notlike '*.Tests.csproj' } |
  ForEach-Object {
    $path = $_.FullName
    $doc = New-Object System.Xml.XmlDocument
    $doc.PreserveWhitespace = $true
    $content = Get-Content -LiteralPath $path -Raw
    $doc.LoadXml($content)

    $project = $doc.SelectSingleNode('/Project')
    if (-not $project) { return }
    $changed = $false

    $pkgNodes = $project.SelectNodes('//PackageReference')
    foreach ($pr in $pkgNodes) {
      $include = $pr.GetAttribute('Include')
      if ($include -like 'Microsoft.AspNetCore.*') {
        $current = $pr.GetAttribute('Version')
        if (-not $current -or ($current -notlike '8.0*')) {
          $pr.SetAttribute('Version','8.0.*')
          $changed = $true
        }
      }
    }

    if ($changed) {
      $doc.Save($path)
      $updated += $path
      Write-Host "Updated backend packages: $path" -ForegroundColor Green
    }
  }

if ($updated.Count -eq 0) {
  Write-Host 'No package version changes needed.' -ForegroundColor Cyan
}



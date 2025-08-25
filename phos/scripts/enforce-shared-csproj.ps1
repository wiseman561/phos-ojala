Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = 'src/shared'
if (-not (Test-Path -LiteralPath $root)) {
  Write-Host "Path not found: $root" -ForegroundColor Yellow
  exit 0
}

$updated = @()
Get-ChildItem -LiteralPath $root -Recurse -Filter '*.csproj' -File |
  ForEach-Object {
    $path = $_.FullName
    $doc = New-Object System.Xml.XmlDocument
    $doc.PreserveWhitespace = $true
    $content = Get-Content -LiteralPath $path -Raw
    $doc.LoadXml($content)

    $project = $doc.SelectSingleNode('/Project')
    if (-not $project) { return }
    $pg = $project.SelectSingleNode('PropertyGroup')
    if (-not $pg) {
      $pg = $doc.CreateElement('PropertyGroup')
      [void]$project.AppendChild($pg)
    }

    $changed = $false
    $tf = $pg.SelectSingleNode('TargetFramework')
    if (-not $tf) {
      $tf = $doc.CreateElement('TargetFramework')
      [void]$pg.AppendChild($tf)
      $changed = $true
    }
    if ($tf.InnerText -ne 'net8.0') {
      $tf.InnerText = 'net8.0'
      $changed = $true
    }

    if ($changed) {
      $doc.Save($path)
      $updated += $path
      Write-Host "Updated shared: $path" -ForegroundColor Green
    }
  }

if ($updated.Count -eq 0) {
  Write-Host 'No changes needed for shared.' -ForegroundColor Cyan
}



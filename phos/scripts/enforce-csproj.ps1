Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Ensure-Element {
  param(
    [Parameter(Mandatory=$true)] [System.Xml.XmlElement] $Parent,
    [Parameter(Mandatory=$true)] [string] $Name
  )
  $node = $Parent.SelectSingleNode($Name)
  if (-not $node) {
    $node = $Parent.OwnerDocument.CreateElement($Name)
    [void]$Parent.AppendChild($node)
  }
  return $node
}

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
    $pg = $project.SelectSingleNode('PropertyGroup')
    if (-not $pg) {
      $pg = $doc.CreateElement('PropertyGroup')
      [void]$project.AppendChild($pg)
    }

    $changed = $false

    # TargetFramework
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

    # RestorePackagesWithLockFile
    $lock = $pg.SelectSingleNode('RestorePackagesWithLockFile')
    if (-not $lock) {
      $lock = $doc.CreateElement('RestorePackagesWithLockFile')
      [void]$pg.AppendChild($lock)
      $changed = $true
    }
    if ($lock.InnerText -ne 'true') {
      $lock.InnerText = 'true'
      $changed = $true
    }

    if ($changed) {
      $doc.Save($path)
      $updated += $path
      Write-Host "Updated: $path" -ForegroundColor Green
    }
  }

if ($updated.Count -eq 0) {
  Write-Host 'No changes needed.' -ForegroundColor Cyan
}



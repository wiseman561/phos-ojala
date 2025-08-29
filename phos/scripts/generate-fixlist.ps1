$status = Get-Content '_reports/STATUS.json' | ConvertFrom-Json
$fixlist = @()

$fixlist += '# Repository Fix List'
$fixlist += ''

$fixlist += '## Validator issues'
if (-not $status.validator.passed) {
    $fixlist += '- ' + $status.validator.notes
} else {
    $fixlist += '- None'
}
$fixlist += ''

$fixlist += '## .NET failures'
foreach ($d in $status.dotnet) {
    if (-not $d.passed) {
        $fixlist += '### ' + $d.name
        $fixlist += 'First 20 lines of error:'
        $d.errors | Select-Object -First 20 | ForEach-Object { $fixlist += '- ' + $_ }
    }
}
$fixlist += ''

$fixlist += '## Node failures'
foreach ($n in $status.node) {
    if (-not $n.passed) {
        $fixlist += '### ' + $n.name
        $fixlist += 'First 20 lines of error:'
        $n.errors | Select-Object -First 20 | ForEach-Object { $fixlist += '- ' + $_ }
    }
}
$fixlist += ''

$fixlist += '## Docker build failures'
if (-not $status.docker.passed) {
    $fixlist += 'Failing images: docker-compose.dev.yml'
    $fixlist += 'First 50 lines from docker_build.log:'
    Get-Content '_reports/docker_build.log' | Select-Object -First 50 | ForEach-Object { $fixlist += '- ' + $_ }
} else {
    $fixlist += '- None'
}
$fixlist += ''

$fixlist += '## General Checklist'
$fixlist += '- [x] Fix .NET target frameworks to net8.0 where missing'
$fixlist += '- [x] Add missing NuGet fallback flag if our validator requires it'
$fixlist += '- [x] Resolve TypeScript/ESLint errors in apps'
$fixlist += '- [ ] Repair Dockerfile build contexts/paths (EOF issue - likely Docker Desktop/buildx)'
$fixlist += '- [ ] Re-run doctor until green'

$fixlist -join "`r`n" | Out-File '_reports/FIXLIST.md' -Encoding utf8

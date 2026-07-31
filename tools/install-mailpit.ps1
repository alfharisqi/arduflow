$ErrorActionPreference = "Stop"

$release = Invoke-RestMethod `
  -Uri "https://api.github.com/repos/axllent/mailpit/releases/latest" `
  -Headers @{ "User-Agent" = "Codex" }

$asset = $release.assets |
  Where-Object { $_.name -match "windows_amd64" -and $_.name -match "\.zip$" } |
  Select-Object -First 1

if (-not $asset) {
  throw "No windows_amd64 zip asset found"
}

$installDir = Join-Path $PSScriptRoot "mailpit"
New-Item -ItemType Directory -Force -Path $installDir | Out-Null

$tmpZip = Join-Path $env:TEMP $asset.name
$tmpExtract = Join-Path $env:TEMP ("mailpit-" + [guid]::NewGuid().ToString())

Invoke-WebRequest `
  -Uri $asset.browser_download_url `
  -OutFile $tmpZip `
  -Headers @{ "User-Agent" = "Codex" }

Expand-Archive -Path $tmpZip -DestinationPath $tmpExtract -Force

$exe = Get-ChildItem -Path $tmpExtract -Recurse -Filter "mailpit.exe" | Select-Object -First 1
if (-not $exe) {
  throw "mailpit.exe not found in archive"
}

Copy-Item -LiteralPath $exe.FullName -Destination (Join-Path $installDir "mailpit.exe") -Force

Remove-Item -LiteralPath $tmpExtract -Recurse -Force
Remove-Item -LiteralPath $tmpZip -Force

& (Join-Path $installDir "mailpit.exe") version

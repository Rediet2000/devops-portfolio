Param(
  [Parameter(Mandatory = $false)]
  [string]$InputJson = "data\\cv.json",

  [Parameter(Mandatory = $false)]
  [string]$OutJs = "data\\cv.js"
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $InputJson)) {
  throw "Input JSON not found: $InputJson"
}

$json = Get-Content $InputJson -Raw
$null = $json | ConvertFrom-Json

$outDir = Split-Path -Parent $OutJs
if ($outDir -and !(Test-Path $outDir)) {
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$content = @"
// Auto-generated. Edit $InputJson and re-run tools/build-cv-js.ps1
window.CV_DATA = $json;
"@

$content | Out-File -FilePath $OutJs -Encoding UTF8


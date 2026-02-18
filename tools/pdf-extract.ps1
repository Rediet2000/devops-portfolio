Param(
  [Parameter(Mandatory = $true)]
  [string]$InputPdf,

  [Parameter(Mandatory = $false)]
  [string]$OutFile = ""
)

$ErrorActionPreference = "Stop"

function Get-NugetPackageDir {
  Param(
    [Parameter(Mandatory = $true)][string]$Id,
    [Parameter(Mandatory = $true)][string]$Version
  )

  $cacheRoot = Join-Path $PSScriptRoot ".cache\\nuget"
  $pkgRoot = Join-Path $cacheRoot ($Id.ToLowerInvariant() + "\\" + $Version)
  $expandedDir = Join-Path $pkgRoot "pkg"

  if (Test-Path $expandedDir) {
    return $expandedDir
  }

  New-Item -ItemType Directory -Force -Path $pkgRoot | Out-Null
  $nupkg = Join-Path $pkgRoot "$Id.$Version.nupkg"
  $zipFile = Join-Path $pkgRoot "$Id.$Version.zip"

  if (!(Test-Path $nupkg)) {
    Invoke-WebRequest -Uri "https://www.nuget.org/api/v2/package/$Id/$Version" -OutFile $nupkg | Out-Null
  }

  if (!(Test-Path $zipFile)) {
    Copy-Item $nupkg $zipFile
  }

  Expand-Archive -Path $zipFile -DestinationPath $expandedDir
  return $expandedDir
}

function Load-NugetLibDlls {
  Param(
    [Parameter(Mandatory = $true)][string]$Id,
    [Parameter(Mandatory = $true)][string]$Version,
    [Parameter(Mandatory = $true)][string]$Tfm
  )

  $pkgDir = Get-NugetPackageDir -Id $Id -Version $Version
  $libDir = Join-Path $pkgDir ("lib\\" + $Tfm)

  if (!(Test-Path $libDir)) {
    return
  }

  Get-ChildItem -Path $libDir -Filter "*.dll" | ForEach-Object {
    try { Add-Type -Path $_.FullName } catch { }
  }
}

if (!(Test-Path $InputPdf)) {
  throw "Input PDF not found: $InputPdf"
}

# Windows PowerShell 5.1 (.NET Framework) compatibility
$tfm = "net462"

# PdfPig dependencies for net462 (per nuspec) + transitive deps for System.Memory
Load-NugetLibDlls -Id "System.Runtime.CompilerServices.Unsafe" -Version "6.1.0" -Tfm $tfm
Load-NugetLibDlls -Id "System.Numerics.Vectors" -Version "4.6.0" -Tfm $tfm
Load-NugetLibDlls -Id "System.Buffers" -Version "4.6.0" -Tfm $tfm
Load-NugetLibDlls -Id "System.Memory" -Version "4.6.0" -Tfm $tfm
Load-NugetLibDlls -Id "Microsoft.Bcl.HashCode" -Version "6.0.0" -Tfm $tfm
Load-NugetLibDlls -Id "System.ValueTuple" -Version "4.5.0" -Tfm $tfm

Load-NugetLibDlls -Id "PdfPig" -Version "0.1.13" -Tfm $tfm

$doc = [UglyToad.PdfPig.PdfDocument]::Open($InputPdf)
$text = ""
foreach ($page in $doc.GetPages()) {
  $text += $page.Text + "`n"
}
$doc.Dispose()

if ($OutFile -and $OutFile.Trim().Length -gt 0) {
  $outDir = Split-Path -Parent $OutFile
  if ($outDir -and !(Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
  }
  $text | Out-File -FilePath $OutFile -Encoding UTF8
} else {
  $text
}


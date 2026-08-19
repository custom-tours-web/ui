Import-Module Pester

$ErrorActionPreference = 'Stop'
$manifestPath = "$PSScriptRoot/WebAssetBuilder.psd1"

# Load your module into memory so tests can access the functions
Import-Module $manifestPath -Force

# Safely read the static PrivateData from the manifest
$manifestData = Import-PowerShellDataFile -Path $manifestPath
$pesterSettings = $manifestData.PrivateData.Pester

# Cast the settings into a formal PesterConfiguration object
$config = [PesterConfiguration]$pesterSettings

# Inject dynamic runtime variables that aren't allowed in .psd1 files
$config.CodeCoverage.ReportRoot = $PSScriptRoot

# Explicitly create the output directory before invoking Pester
$testResultsDir = Join-Path $PSScriptRoot "TestResults"
if (-not (Test-Path $testResultsDir)) {
    New-Item -ItemType Directory -Path $testResultsDir -Force | Out-Null
}

# Run the tests!
Invoke-Pester -Configuration $config
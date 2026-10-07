# Enforce strict rules for the entire module
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Load all Private functions (Internal helpers)
$privateFiles = Get-ChildItem -Path "$PSScriptRoot\private\*.ps1" -File
foreach ($file in $privateFiles) {
    . $file.FullName
}

# Load all Public functions (User commands)
$publicFiles = Get-ChildItem -Path "$PSScriptRoot\public\*.ps1" -File
foreach ($file in $publicFiles) {
    . $file.FullName
}

# Explicitly export only the Public functions
Export-ModuleMember -Function Invoke-HamlBuild, Invoke-StylusBuild, Invoke-TypeScriptBuild, Invoke-WebAssetsValidation

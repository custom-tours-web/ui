. "$PSScriptRoot/FindProjectRoot.ps1"

function Invoke-StylusBuild {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [ValidateNotNullOrEmpty()]
        [string]$StartPath,

        [string]$SourceSubDir = "src/styl",
        [string]$OutputSubDir = "dist/css"
    )

    try {
        Write-Log -Level INFO -Message "🚀 Starting Stylus compilation..."

        if (-not (Get-Command "stylus" -ErrorAction SilentlyContinue)) {
            throw [System.ComponentModel.Win32Exception]::new(
                "Stylus CLI not found. Install via 'npm install -g stylus'."
            )
        }

        $rootDir = Find-ProjectRoot -StartPath $StartPath
        if (-not $rootDir) {
            throw "Project root could not be determined."
        }

        $srcDir = Join-Path $rootDir $SourceSubDir
        $outDir = Join-Path $rootDir $OutputSubDir

        if (-not (Test-Path $srcDir -PathType Container)) {
            throw "Stylus source directory not found: $srcDir"
        }

        if (-not (Test-Path $outDir -PathType Container)) {
            Write-Log -Level INFO -Message "🔧 Creating output directory: $outDir"
            New-Item -ItemType Directory -Path $outDir -Force | Out-Null
        }

        $stylFiles = @(Get-ChildItem -Path $srcDir -Filter "*.styl" -File -Recurse)

        if (-not $stylFiles -or $stylFiles.Count -eq 0) {
            throw "No Stylus files found in: $srcDir"
        }

        Write-Log -Level INFO -Message "📄 Found $($stylFiles.Count) Stylus file(s)."

        Write-Log -Level INFO -Message "🔧 Compiling $srcDir -> $outDir"

        $null = & stylus $srcDir --out $outDir 2>&1

        if ($LASTEXITCODE -ne 0) {
            throw "Stylus compilation failed for '$srcDir' with exit code $LASTEXITCODE."
        }

        Write-Log -Level SUCCESS -Message "✅ Stylus build completed successfully."
    }
    catch {
        Write-Log -Level ERROR -Message "❌ Stylus build failed: $($_.Exception.Message)"
        throw
    }
    finally {
        Write-Log -Level INFO -Message "🔚 Stylus build process finished."
    }
}

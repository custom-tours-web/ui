. "$PSScriptRoot/FindProjectRoot.ps1"

function Invoke-TypeScriptBuild {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [ValidateNotNullOrEmpty()]
        [string]$StartPath,

        [string]$SourceSubDir = "src/ts",
        [string]$OutputSubDir = "dist/js"
    )

    try {
        Write-Log -Level INFO -Message "🚀 Starting TypeScript compilation..."

        if (-not (Get-Command "tsc" -ErrorAction SilentlyContinue)) {
            throw [System.ComponentModel.Win32Exception]::new(
                "TypeScript CLI (tsc) not found. Install via 'npm install -g typescript'."
            )
        }

        $rootDir = Find-ProjectRoot -StartPath $StartPath
        if (-not $rootDir) {
            throw "Project root could not be determined."
        }

        $srcDir = Join-Path $rootDir $SourceSubDir
        $outDir = Join-Path $rootDir $OutputSubDir

        if (-not (Test-Path $srcDir -PathType Container)) {
            throw "TypeScript source directory not found: $srcDir"
        }

        if (-not (Test-Path $outDir -PathType Container)) {
            Write-Log -Level INFO -Message "🔧 Creating output directory: $outDir"
            New-Item -ItemType Directory -Path $outDir -Force | Out-Null
        }

        $tsFiles = @(Get-ChildItem -Path $srcDir -Filter "*.ts" -File -Recurse)

        if (-not $tsFiles -or $tsFiles.Count -eq 0) {
            throw "No TypeScript files found in: $srcDir"
        }

        Write-Log -Level INFO -Message "📄 Found $($tsFiles.Count) TypeScript file(s)."

        Write-Log -Level INFO -Message "🔧 Compiling $srcDir -> $outDir"


        $tsFilePaths = $tsFiles.FullName

        $null = & tsc `
            --outDir $outDir `
            --rootDir $srcDir `
            $tsFilePaths 2>&1

        if ($LASTEXITCODE -ne 0) {
            throw "TypeScript compilation failed for '$srcDir' with exit code $LASTEXITCODE."
        }

        Write-Log -Level SUCCESS -Message "✅ TypeScript build completed successfully."
    }
    catch {
        Write-Log -Level ERROR -Message "❌ TypeScript build failed: $($_.Exception.Message)"
        throw
    }
    finally {
        Write-Log -Level INFO -Message "🔚 TypeScript build process finished."
    }
}

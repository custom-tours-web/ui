. "$PSScriptRoot/FindProjectRoot.ps1"

function Invoke-HamlBuild {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [ValidateNotNullOrEmpty()]
        [string]$StartPath,

        [string]$SourceSubDir = "src/haml",
        [string]$OutputSubDir = "dist"
    )

    try {
        Write-Log -Level INFO -Message "🚀 Starting HAML compilation..."

        if (-not (Get-Command "haml" -ErrorAction SilentlyContinue)) {
            throw [System.ComponentModel.Win32Exception]::new(
                "HAML CLI not found. Install via 'gem install haml'."
            )
        }

        $rootDir = Find-ProjectRoot -StartPath $StartPath
        if (-not $rootDir) {
            throw "Project root could not be determined."
        }

        $srcDir = Join-Path $rootDir $SourceSubDir
        $outDir = Join-Path $rootDir $OutputSubDir

        if (-not (Test-Path $srcDir -PathType Container)) {
            throw "HAML source directory not found: $srcDir"
        }

        if (-not (Test-Path $outDir -PathType Container)) {
            Write-Log -Level INFO -Message "🔧 Creating output directory: $outDir"
            New-Item -ItemType Directory -Path $outDir -Force | Out-Null
        }

        $hamlFiles = @(Get-ChildItem -Path $srcDir -Filter "*.haml" -File -Recurse)

        if (-not $hamlFiles -or $hamlFiles.Count -eq 0) {
            throw "No HAML files found in: $srcDir"
        }

        Write-Log -Level INFO -Message "📄 Found $($hamlFiles.Count) HAML file(s)."
        Write-Log -Level INFO -Message "🔧 Compiling files from $srcDir to $outDir"

        foreach ($file in $hamlFiles) {
            $relativePath = $file.FullName.Substring($srcDir.Length + 1)
            $outputFilePath = Join-Path $outDir $relativePath -Resolve:$false
            $outputFilePath = [System.IO.Path]::ChangeExtension($outputFilePath, ".html")

            $targetDir = Split-Path $outputFilePath -Parent
            if (-not (Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }

            Write-Log -Level INFO -Message "   Compiling $($file.Name)..."

            $hamlOutput = & haml $file.FullName 2>&1

            if ($LASTEXITCODE -ne 0) {
                throw "HAML compilation failed for '$($file.FullName)' with exit code $LASTEXITCODE.`nDetails: $hamlOutput"
            }

            Set-Content -Path $outputFilePath -Value $hamlOutput -Encoding UTF8
        }

        Write-Log -Level SUCCESS -Message "✅ HAML build completed successfully."
    }
    catch {
        Write-Log -Level ERROR -Message "❌ HAML build failed: $($_.Exception.Message)"
        throw
    }
    finally {
        Write-Log -Level INFO -Message "🔚 HAML build process finished."
    }
}

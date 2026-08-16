. "$PSScriptRoot/FindProjectRoot.ps1"

function Invoke-WebAssetsValidation {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string]$StartPath
    )

    try {
        Write-Log -Level HEADER -Message "🔍 Validating Final Web Assets..."

        $projectRoot = Find-ProjectRoot -StartPath $StartPath

        if (-not $projectRoot) {
            throw "Project root could not be determined."
        }

        $distPath = Join-Path $projectRoot "dist"

        Write-Log -Level INFO -Message "📁 Project root: $projectRoot"
        Write-Log -Level INFO -Message "📦 Distribution directory: $distPath"

        if (-not (Test-Path $distPath -PathType Container)) {
            throw "Final dist directory was not created: $distPath"
        }

        $htmlFiles = @(Get-ChildItem -Path $distPath -Recurse -File -Filter "*.html")
        $cssFiles  = @(Get-ChildItem -Path $distPath -Recurse -File -Filter "*.css")
        $jsFiles   = @(Get-ChildItem -Path $distPath -Recurse -File -Filter "*.js")

        if ($htmlFiles.Count -eq 0) {
            throw "No HTML files found in final dist."
        }

        if ($cssFiles.Count -eq 0) {
            throw "No CSS files found in final dist."
        }

        if ($jsFiles.Count -eq 0) {
            throw "No JavaScript files found in final dist."
        }

        Write-Log -Level SUCCESS -Message "✅ Final distribution successfully assembled."
        Write-Log -Level INFO -Message "📄 HTML files: $($htmlFiles.Count)"
        Write-Log -Level INFO -Message "🎨 CSS files: $($cssFiles.Count)"
        Write-Log -Level INFO -Message "📜 JS files: $($jsFiles.Count)"

        Write-Log -Level HEADER -Message "📦 Final dist contents"

        Get-ChildItem -Path $distPath -Recurse -File |
            ForEach-Object {
                Write-Log -Level INFO -Message $_.FullName
            }
    }
    catch {
        Write-Log -Level ERROR -Message "❌ Web assets validation failed: $($_.Exception.Message)"
        throw
    }
    finally {
        Write-Log -Level INFO -Message "🔚 Web assets validation process finished."
    }
}
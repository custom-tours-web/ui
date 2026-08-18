<#
.SYNOPSIS
    Validates the output of compiled web assets within the distribution directory.

.DESCRIPTION
    Locates the project root, verifies the existence of the 'dist' directory, and confirms 
    that HTML, CSS, and JavaScript files exist in the output folder. Logs asset counts 
    and prints the path of every assembled file.

.PARAMETER StartPath
    The starting directory path used to locate the project root.

.EXAMPLE
    Invoke-WebAssetsValidation -StartPath "C:\Projects\MyWebApp".
#>
function Invoke-WebAssetsValidation {
    [CmdletBinding()]
    param(
        # Mandatory starting path used to locate the project root directory.
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string]$StartPath
    )

    try {
        Write-Log -Level HEADER -Message "🔍 Validating Final Web Assets..."

        # Locate the root directory of the project.
        $projectRoot = Find-ProjectRoot -StartPath $StartPath

        if (-not $projectRoot) {
            throw "Project root could not be determined."
        }

        # Resolve path to the distribution output directory.
        $distPath = Join-Path $projectRoot "dist"

        Write-Log -Level INFO -Message "📁 Project root: $projectRoot"
        Write-Log -Level INFO -Message "📦 Distribution directory: $distPath"

        # Verify that the distribution directory actually exists.
        if (-not (Test-Path $distPath -PathType Container)) {
            throw "Final dist directory was not created: $distPath"
        }

        # Scan distribution directory recursively for compiled HTML, CSS, and JS files.
        $htmlFiles = @(Get-ChildItem -Path $distPath -Recurse -File -Filter "*.html")
        $cssFiles  = @(Get-ChildItem -Path $distPath -Recurse -File -Filter "*.css")
        $jsFiles   = @(Get-ChildItem -Path $distPath -Recurse -File -Filter "*.js")

        # Ensure all required web asset file types are present.
        if ($htmlFiles.Count -eq 0) {
            throw "No HTML files found in final dist."
        }

        if ($cssFiles.Count -eq 0) {
            throw "No CSS files found in final dist."
        }

        if ($jsFiles.Count -eq 0) {
            throw "No JavaScript files found in final dist."
        }

        # Log total counts for compiled asset types.
        Write-Log -Level SUCCESS -Message "✅ Final distribution successfully assembled."
        Write-Log -Level INFO -Message "📄 HTML files: $($htmlFiles.Count)"
        Write-Log -Level INFO -Message "🎨 CSS files: $($cssFiles.Count)"
        Write-Log -Level INFO -Message "📜 JS files: $($jsFiles.Count)"

        Write-Log -Level HEADER -Message "📦 Final dist contents"

        # Log paths of all individual files present in the distribution directory.
        Get-ChildItem -Path $distPath -Recurse -File |
            ForEach-Object {
                Write-Log -Level INFO -Message $_.FullName
            }
    }
    catch {
        # Log validation failure details and re-throw exception.
        Write-Log -Level ERROR -Message "❌ Web assets validation failed: $($_.Exception.Message)"
        throw
    }
    finally {
        # Log completion of the validation process.
        Write-Log -Level INFO -Message "🔚 Web assets validation process finished."
    }
}
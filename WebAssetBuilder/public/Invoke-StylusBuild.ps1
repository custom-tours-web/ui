<#
.SYNOPSIS
    Compiles Stylus template files into standard CSS stylesheets.

.DESCRIPTION
    Locates the project root directory and compiles all Stylus (.styl) files 
    found in the source directory into CSS using the external 'stylus' CLI tool.

.PARAMETER StartPath
    The starting directory path used to locate the project root.

.PARAMETER SourceSubDir
    Relative path from the project root to the directory containing Stylus files.
    Defaults to 'src/styl'.

.PARAMETER OutputSubDir
    Relative path from the project root to the destination directory for compiled CSS files.
    Defaults to 'dist/css'.

.EXAMPLE
    Invoke-StylusBuild -StartPath "C:\Projects\MyWebApp".

.EXAMPLE
    Invoke-StylusBuild -StartPath "." -SourceSubDir "styles" -OutputSubDir "public/css".
#>
function Invoke-StylusBuild {
    [CmdletBinding()]
    param(
        # Mandatory starting path used to locate the project root directory.
        [Parameter(Mandatory=$true)]
        [ValidateNotNullOrEmpty()]
        [string]$StartPath,

        # Relative path to the Stylus source files directory.
        [string]$SourceSubDir = "src/styl",

        # Relative path to the target CSS output directory.
        [string]$OutputSubDir = "dist/css"
    )

    try {
        Write-Log -Level INFO -Message "🚀 Starting Stylus compilation..."

        # Verify that the Stylus executable CLI is available in the current environment PATH.
        if (-not (Get-Command "stylus" -ErrorAction SilentlyContinue)) {
            throw [System.ComponentModel.Win32Exception]::new(
                "Stylus CLI not found. Install via 'npm install -g stylus'."
            )
        }

        # Locate the root directory of the project.
        $rootDir = Find-ProjectRoot -StartPath $StartPath
        if (-not $rootDir) {
            throw "Project root could not be determined."
        }

        # Resolve absolute paths for source and output directories.
        $srcDir = Join-Path $rootDir $SourceSubDir
        $outDir = Join-Path $rootDir $OutputSubDir

        # Ensure the source directory exists.
        if (-not (Test-Path $srcDir -PathType Container)) {
            throw "Stylus source directory not found: $srcDir"
        }

        # Create output directory if it does not already exist.
        if (-not (Test-Path $outDir -PathType Container)) {
            Write-Log -Level INFO -Message "🔧 Creating output directory: $outDir"
            New-Item -ItemType Directory -Path $outDir -Force | Out-Null
        }

        # Retrieve all .styl files recursively from the source directory.
        $stylFiles = @(Get-ChildItem -Path $srcDir -Filter "*.styl" -File -Recurse)

        if (-not $stylFiles -or $stylFiles.Count -eq 0) {
            throw "No Stylus files found in: $srcDir"
        }

        Write-Log -Level INFO -Message "📄 Found $($stylFiles.Count) Stylus file(s)."
        Write-Log -Level INFO -Message "🔧 Compiling $srcDir -> $outDir"

        # Execute Stylus compiler to build all source files into target directory.
        $null = & stylus $srcDir --out $outDir 2>&1

        # Validate execution exit code.
        if ($LASTEXITCODE -ne 0) {
            throw "Stylus compilation failed for '$srcDir' with exit code $LASTEXITCODE."
        }

        Write-Log -Level SUCCESS -Message "✅ Stylus build completed successfully."
    }
    catch {
        # Log error details and re-throw exception.
        Write-Log -Level ERROR -Message "❌ Stylus build failed: $($_.Exception.Message)"
        throw
    }
    finally {
        # Log build process completion.
        Write-Log -Level INFO -Message "🔚 Stylus build process finished."
    }
}

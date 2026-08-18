<#
.SYNOPSIS
    Compiles HAML template files into HTML documents.

.DESCRIPTION
    Searches for HAML templates within the project's source directory and compiles them 
    to HTML in the output folder using the external 'haml' Ruby CLI tool. Maintains 
    relative folder structures for nested templates.

.PARAMETER StartPath
    The starting directory path used to locate the project root.

.PARAMETER SourceSubDir
    Relative path from the project root to the directory containing HAML source files.
    Defaults to 'src/haml'.

.PARAMETER OutputSubDir
    Relative path from the project root to the destination directory for compiled HTML files.
    Defaults to 'dist'.

.EXAMPLE
    Invoke-HamlBuild -StartPath "C:\Projects\MyWebApp".

.EXAMPLE
    Invoke-HamlBuild -StartPath "." -SourceSubDir "views" -OutputSubDir "public".
#>
function Invoke-HamlBuild {
    [CmdletBinding()]
    param(
        # Mandatory starting path used to locate the project root directory.
        [Parameter(Mandatory=$true)]
        [ValidateNotNullOrEmpty()]
        [string]$StartPath,

        # Relative path to the HAML source files directory.
        [string]$SourceSubDir = "src/haml",

        # Relative path to the target HTML output directory.
        [string]$OutputSubDir = "dist"
    )

    try {
        Write-Log -Level INFO -Message "🚀 Starting HAML compilation..."

        # Verify that the HAML executable CLI is available in the current environment PATH.
        if (-not (Get-Command "haml" -ErrorAction SilentlyContinue)) {
            throw [System.ComponentModel.Win32Exception]::new(
                "HAML CLI not found. Install via 'gem install haml'."
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
            throw "HAML source directory not found: $srcDir"
        }

        # Create output directory if it does not already exist.
        if (-not (Test-Path $outDir -PathType Container)) {
            Write-Log -Level INFO -Message "🔧 Creating output directory: $outDir"
            New-Item -ItemType Directory -Path $outDir -Force | Out-Null
        }

        # Retrieve all .haml files recursively from the source directory.
        $hamlFiles = @(Get-ChildItem -Path $srcDir -Filter "*.haml" -File -Recurse)

        if (-not $hamlFiles -or $hamlFiles.Count -eq 0) {
            throw "No HAML files found in: $srcDir"
        }

        Write-Log -Level INFO -Message "📄 Found $($hamlFiles.Count) HAML file(s)."
        Write-Log -Level INFO -Message "🔧 Compiling files from $srcDir to $outDir"

        # Process each HAML file individually.
        foreach ($file in $hamlFiles) {
            # Compute relative path to preserve nested subfolder structure in destination.
            $relativePath = $file.FullName.Substring($srcDir.Length + 1)
            $outputFilePath = Join-Path $outDir $relativePath -Resolve:$false
            $outputFilePath = [System.IO.Path]::ChangeExtension($outputFilePath, ".html")

            # Create destination subdirectories if they do not exist.
            $targetDir = Split-Path $outputFilePath -Parent
            if (-not (Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }

            Write-Log -Level INFO -Message "   Compiling $($file.Name)..."

            # Invoke external HAML CLI tool and capture stdout/stderr output.
            $hamlOutput = & haml $file.FullName 2>&1

            # Validate execution exit code.
            if ($LASTEXITCODE -ne 0) {
                throw "HAML compilation failed for '$($file.FullName)' with exit code $LASTEXITCODE.`nDetails: $hamlOutput"
            }

            # Save compiled HTML output with UTF-8 encoding.
            Set-Content -Path $outputFilePath -Value $hamlOutput -Encoding UTF8
        }

        Write-Log -Level SUCCESS -Message "✅ HAML build completed successfully."
    }
    catch {
        # Log error details and re-throw exception.
        Write-Log -Level ERROR -Message "❌ HAML build failed: $($_.Exception.Message)"
        throw
    }
    finally {
        # Log build process completion.
        Write-Log -Level INFO -Message "🔚 HAML build process finished."
    }
}

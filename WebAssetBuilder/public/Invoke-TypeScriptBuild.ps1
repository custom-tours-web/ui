<#
.SYNOPSIS
    Compiles TypeScript source files into JavaScript output files.

.DESCRIPTION
    Locates the project root and compiles all TypeScript (.ts) files 
    found in the specified source directory into JavaScript using the external 'tsc' CLI tool.

.PARAMETER StartPath
    The starting directory path used to locate the project root.

.PARAMETER SourceSubDir
    Relative path from the project root to the directory containing TypeScript files.
    Defaults to 'src/ts'.

.PARAMETER OutputSubDir
    Relative path from the project root to the destination directory for compiled JavaScript files.
    Defaults to 'dist/js'.

.EXAMPLE
    Invoke-TypeScriptBuild -StartPath "C:\Projects\MyWebApp".

.EXAMPLE
    Invoke-TypeScriptBuild -StartPath "." -SourceSubDir "scripts" -OutputSubDir "public/js".
#>
function Invoke-TypeScriptBuild {
    [CmdletBinding()]
    param(
        # Mandatory starting path used to locate the project root directory.
        [Parameter(Mandatory=$true)]
        [ValidateNotNullOrEmpty()]
        [string]$StartPath,

        # Relative path to the TypeScript source files directory.
        [string]$SourceSubDir = "src/ts",

        # Relative path to the target JavaScript output directory.
        [string]$OutputSubDir = "dist/js"
    )

    try {
        Write-Log -Level INFO -Message "🚀 Starting TypeScript compilation..."

        # Verify that the TypeScript executable CLI (tsc) is available in the current environment PATH.
        if (-not (Get-Command "tsc" -ErrorAction SilentlyContinue)) {
            throw [System.ComponentModel.Win32Exception]::new(
                "TypeScript CLI (tsc) not found. Install via 'npm install -g typescript'."
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
            throw "TypeScript source directory not found: $srcDir"
        }

        # Create output directory if it does not already exist.
        if (-not (Test-Path $outDir -PathType Container)) {
            Write-Log -Level INFO -Message "🔧 Creating output directory: $outDir"
            New-Item -ItemType Directory -Path $outDir -Force | Out-Null
        }

        # Retrieve all .ts files recursively from the source directory.
        $tsFiles = @(Get-ChildItem -Path $srcDir -Filter "*.ts" -File -Recurse)

        if (-not $tsFiles -or $tsFiles.Count -eq 0) {
            throw "No TypeScript files found in: $srcDir"
        }

        Write-Log -Level INFO -Message "📄 Found $($tsFiles.Count) TypeScript file(s)."
        Write-Log -Level INFO -Message "🔧 Compiling $srcDir -> $outDir"

        # Extract full path strings for each TypeScript file.
        $tsFilePaths = $tsFiles.FullName

        # Execute TypeScript compiler (tsc) targeting output directory and source root.
        $null = & tsc `
            --outDir $outDir `
            --rootDir $srcDir `
            $tsFilePaths 2>&1

        # Validate execution exit code.
        if ($LASTEXITCODE -ne 0) {
            throw "TypeScript compilation failed for '$srcDir' with exit code $LASTEXITCODE."
        }

        Write-Log -Level SUCCESS -Message "✅ TypeScript build completed successfully."
    }
    catch {
        # Log error details and re-throw exception.
        Write-Log -Level ERROR -Message "❌ TypeScript build failed: $($_.Exception.Message)"
        throw
    }
    finally {
        # Log build process completion.
        Write-Log -Level INFO -Message "🔚 TypeScript build process finished."
    }
}

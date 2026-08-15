. "$PSScriptRoot/Logging.ps1"

function Find-ProjectRoot {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [ValidateNotNullOrEmpty()]
        [string]$StartPath
    )

    try {
        if (-not (Test-Path $StartPath -PathType Container)) {
            throw [System.IO.DirectoryNotFoundException]::new("Start path does not exist: $StartPath")
        }

        $currentDir = Get-Item $StartPath

        while ($null -ne $currentDir) {
            Write-Log -Level INFO -Message "🔍 Checking for src in: $($currentDir.FullName)"

            $srcDir = Join-Path $currentDir.FullName "src"

            if (Test-Path $srcDir -PathType Container) {
                Write-Log -Level SUCCESS -Message "📁 Project root found: $($currentDir.FullName)"
                return $currentDir.FullName
            }

            $currentDir = $currentDir.Parent
        }

        throw [System.Exception]::new("No 'src' directory found in any parent of $StartPath.")
    }
    catch {
        Write-Log -Level ERROR -Message "❌ Error in Find-Root: $($_.Exception.Message)"
        return $null
    }
    finally {
        Write-Log -Level INFO -Message "🔚 Finished searching for project root."
    }
}

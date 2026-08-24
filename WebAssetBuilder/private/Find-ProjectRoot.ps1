<#
.SYNOPSIS
    Traverses upward from a given directory to locate the project root containing a 'src' folder.

.DESCRIPTION
    Recursively inspects parent directories starting from a specified path to find a project root directory containing a 'src' subfolder. Utilizes 'Write-Log' for status output and returns the absolute directory path.

.PARAMETER StartPath
    The directory path from which to begin searching upward for the project root.

.OUTPUTS
    System.String
    Returns the absolute path of the project root directory if found; otherwise, returns $null on failure.

.EXAMPLE
    $root = Find-ProjectRoot -StartPath "C:\Repo\src\components".
#>
function Find-ProjectRoot {
    [CmdletBinding()]
    param(
        # Initial search path; must be a non-empty string.
        [Parameter(Mandatory=$true)]
        [ValidateNotNullOrEmpty()]
        [string]$StartPath
    )

    try {
        # Validate that the starting path exists and is a valid directory.
        if (-not (Test-Path $StartPath -PathType Container)) {
            throw [System.IO.DirectoryNotFoundException]::new("Start path does not exist: $StartPath")
        }

        # Initialize current directory item for iteration.
        $currentDir = Get-Item $StartPath

        # Traverse upward through parent directories until the filesystem root is reached.
        while ($null -ne $currentDir) {
            Write-Log -Level INFO -Message "🔍 Checking for src in: $($currentDir.FullName)"

            # Construct path to potential 'src' directory.
            $srcDir = Join-Path $currentDir.FullName "src"

            # If 'src' subfolder exists, log success and return project root path.
            if (Test-Path $srcDir -PathType Container) {
                Write-Log -Level SUCCESS -Message "📁 Project root found: $($currentDir.FullName)"
                return $currentDir.FullName
            }

            # Navigate up to the parent directory level.
            $currentDir = $currentDir.Parent
        }

        # Throw exception if search traverses to filesystem root without finding 'src'.
        throw [System.Exception]::new("No 'src' directory found in any parent of $StartPath.")
    }
    catch {
        # Capture, log error via Write-Log, and return $null.
        Write-Log -Level ERROR -Message "❌ Error in Find-Root: $($_.Exception.Message)"
        return $null
    }
    finally {
        # Log search completion regardless of success or failure.
        Write-Log -Level INFO -Message "🔚 Finished searching for project root."
    }
}

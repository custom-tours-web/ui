<#
.SYNOPSIS
    Writes formatted, color-coded log messages to the console.

.DESCRIPTION
    Standardizes output messages across build scripts by attaching a precise timestamp, 
    timezone ID, and severe level tag. Renders text in distinct foreground colors based on log severity.

.PARAMETER Level
    The log severity level. Accepts: 'INFO', 'SUCCESS', 'WARNING', 'ERROR', or 'HEADER'.

.PARAMETER Message
    The log text message to display.

.EXAMPLE
    Write-Log -Level "SUCCESS" -Message "Compilation completed successfully."

.EXAMPLE
    Write-Log -Level "ERROR" -Message "Failed to locate TypeScript config file."
#>
function Write-Log {
    [CmdletBinding()]
    param(
        # Specify severity level; enforced against a set list of valid levels.
        [Parameter(Mandatory=$true)]
        [ValidateNotNullOrEmpty()]
        [ValidateSet("INFO","SUCCESS","WARNING","ERROR","HEADER")]
        [string]$Level,

        # Specify the primary log message string.
        [Parameter(Mandatory=$true)]
        [ValidateNotNullOrEmpty()]
        [string]$Message
    )

    try {
        # Map log severity levels to specific console foreground colors.
        $colors = @{
            "INFO"    = "Cyan"
            "SUCCESS" = "Green"
            "WARNING" = "Yellow"
            "ERROR"   = "Red"
            "HEADER"  = "Magenta"
        }

        # Capture current time (ISO 8601 offset format) and the local time zone identifier.
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"
        $timezone  = (Get-TimeZone).Id

        # Construct standardized log entry string.
        $formattedMessage = "[$timestamp $timezone] [$Level] $Message"

        # Print the formatted string using the corresponding level color.
        Write-Host $formattedMessage -ForegroundColor $colors[$Level]
    }
    catch {
        # Fail-safe catch block to ensure logging errors are visible in red.
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"
        $timezone  = (Get-TimeZone).Id
        Write-Host "[$timestamp $timezone] [ERROR] ❌ Logging failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

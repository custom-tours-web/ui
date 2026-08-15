Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Log {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [ValidateNotNullOrEmpty()]
        [ValidateSet("INFO","SUCCESS","WARNING","ERROR","HEADER")]
        [string]$Level,

        [Parameter(Mandatory=$true)]
        [ValidateNotNullOrEmpty()]
        [string]$Message
    )

    try {
        $colors = @{
            "INFO"    = "Cyan"
            "SUCCESS" = "Green"
            "WARNING" = "Yellow"
            "ERROR"   = "Red"
            "HEADER"  = "Magenta"
        }

        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"
        $timezone  = (Get-TimeZone).Id

        $formattedMessage = "[$timestamp $timezone] [$Level] $Message"

        Write-Host $formattedMessage -ForegroundColor $colors[$Level]
    }
    catch {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"
        $timezone  = (Get-TimeZone).Id
        Write-Host "[$timestamp $timezone] [ERROR] ❌ Logging failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

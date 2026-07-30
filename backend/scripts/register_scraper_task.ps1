# =========================================================
# Register the twice-daily scraper task
# =========================================================
#
# Run ONCE, from an elevated PowerShell prompt:
#
#   powershell -ExecutionPolicy Bypass -File backend\scripts\register_scraper_task.ps1
#
# Creates a Windows Scheduled Task that runs the scrapers at 06:00 and 18:00.
# Remove it later with:
#   Unregister-ScheduledTask -TaskName 'JobHunter-Scrapers' -Confirm:$false

$ErrorActionPreference = 'Stop'

$TaskName = 'JobHunter-Scrapers'
$ScriptPath = Join-Path $PSScriptRoot 'run_scrapers.ps1'

if (-not (Test-Path $ScriptPath)) {
    Write-Error "Cannot find $ScriptPath"
    exit 1
}

$Action = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""

# Two runs a day. Adjust these times to suit.
$Triggers = @(
    New-ScheduledTaskTrigger -Daily -At 6:00AM
    New-ScheduledTaskTrigger -Daily -At 6:00PM
)

$Settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -DontStopIfGoingOnBatteries `
    -AllowStartIfOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1)

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Write-Host "Removing existing task '$TaskName'..."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Triggers `
    -Settings $Settings `
    -Description 'Runs Job Hunter scrapers twice daily and saves new jobs.' | Out-Null

Write-Host "Registered '$TaskName' (runs 06:00 and 18:00 daily)."
Write-Host "Run it now with:  Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "Logs:             backend\logs\scraper_<date>.log"

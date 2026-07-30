# =========================================================
# Scheduled job scraper run
# =========================================================
#
# Invoked by Windows Task Scheduler (see register_scraper_task.ps1).
# Replaces the old in-app "Fetch New Jobs" button, which ran every scraper
# synchronously inside an HTTP request.
#
# Manual run:
#   powershell -ExecutionPolicy Bypass -File backend\scripts\run_scrapers.ps1

$ErrorActionPreference = 'Stop'

# backend/ is two levels up from this script.
$BackendDir = Split-Path -Parent $PSScriptRoot
$Python = Join-Path $BackendDir 'venv\Scripts\python.exe'
$LogDir = Join-Path $BackendDir 'logs'

if (-not (Test-Path $Python)) {
    Write-Error "Python not found at $Python. Create the venv first."
    exit 1
}

if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}

$LogFile = Join-Path $LogDir ("scraper_" + (Get-Date -Format 'yyyy-MM-dd') + '.log')
$Started = Get-Date

Add-Content -Path $LogFile -Encoding utf8 -Value "`n===== Run started $Started ====="

# manage.py must run with backend/ as the working directory.
Push-Location $BackendDir
try {
    & $Python manage.py fetch_jobs *>&1 | Tee-Object -FilePath $LogFile -Append
    $exitCode = $LASTEXITCODE
}
finally {
    Pop-Location
}

$Duration = [int]((Get-Date) - $Started).TotalSeconds
Add-Content -Path $LogFile -Encoding utf8 -Value "===== Run finished in ${Duration}s (exit $exitCode) ====="

# Keep two weeks of logs.
Get-ChildItem -Path $LogDir -Filter 'scraper_*.log' |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-14) } |
    Remove-Item -Force -ErrorAction SilentlyContinue

exit $exitCode

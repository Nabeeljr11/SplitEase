$ErrorActionPreference = "SilentlyContinue"
$pgBin = "C:\Program Files\PostgreSQL\18\bin"
$dbDir = Join-Path $PSScriptRoot "..\backend\dev-db"

if (Test-Path $dbDir) {
    Write-Host "Stopping PostgreSQL cluster at $dbDir..."
    & "$pgBin\pg_ctl.exe" -D $dbDir stop
}

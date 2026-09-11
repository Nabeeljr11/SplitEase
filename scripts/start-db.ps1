$ErrorActionPreference = "SilentlyContinue"
$pgBin = "C:\Program Files\PostgreSQL\18\bin"
$dbDir = Join-Path $PSScriptRoot "..\backend\dev-db"

if (-not (Test-Path $dbDir)) {
    Write-Host "Database not found. Running init-db.ps1..."
    & "$PSScriptRoot\init-db.ps1"
} else {
    Write-Host "Starting PostgreSQL cluster on port 5433..."
    & "$pgBin\pg_ctl.exe" -D $dbDir -o "-p 5433" -l "$dbDir\server.log" start
}

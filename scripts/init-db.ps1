$ErrorActionPreference = "Stop"
$pgBin = "C:\Program Files\PostgreSQL\18\bin"
$dbDir = Join-Path $PSScriptRoot "..\backend\dev-db"

if (-not (Test-Path $dbDir)) {
    Write-Host "Initializing local PostgreSQL cluster at $dbDir..."
    & "$pgBin\initdb.exe" -D $dbDir -U postgres --auth=trust
    Write-Host "Database cluster initialized."
} else {
    Write-Host "Database directory already exists at $dbDir."
}

# Start temporarily to ensure 'splitease' database exists
Write-Host "Starting database server on port 5433 to verify database..."
& "$pgBin\pg_ctl.exe" -D $dbDir -o "-p 5433" -l "$dbDir\server.log" start
Start-Sleep -Seconds 2

# Check if database exists, create if not
$dbExists = & "$pgBin\psql.exe" -U postgres -p 5433 -h 127.0.0.1 -tAc "SELECT 1 FROM pg_database WHERE datname='splitease'" 2>$null
if ($dbExists -ne "1") {
    Write-Host "Creating database 'splitease' with UTF8 encoding..."
    & "$pgBin\psql.exe" -U postgres -p 5433 -h 127.0.0.1 -d postgres -c "CREATE DATABASE splitease WITH TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE = 'C' LC_CTYPE = 'C';"
    Write-Host "Database 'splitease' created successfully."
} else {
    Write-Host "Database 'splitease' already exists."
}

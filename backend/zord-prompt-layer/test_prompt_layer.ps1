<#
.SYNOPSIS
    Test script for Zord Prompt Layer

.DESCRIPTION
    This script runs the seed and query utilities to verify the prompt layer
    can correctly retrieve data from the databases and answer questions based
    on a failed intent.
#>

$ScriptPath = $MyInvocation.MyCommand.Path
$ScriptDir = Split-Path -Parent $ScriptPath

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "🧪 ZORD PROMPT LAYER - E2E TEST" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Set environment variables for the Go scripts
# Using localhost ports since running from host, these map to the DB containers
$env:INTENT_READ_DSN = "postgres://intent_user:intent_password@localhost:5436/zord_intent_engine_db?sslmode=disable"
$env:RELAY_READ_DSN = "postgres://relay_user:relay_password@localhost:5435/zord_relay_db?sslmode=disable"
$env:PROMPT_LAYER_BASE_URL = "http://localhost:8086"

Write-Host "`n[1/1] Seeding Data & Querying Prompt Layer..." -ForegroundColor Yellow
$SeedDir = Join-Path $ScriptDir "cmd\seed_and_test"
Set-Location $SeedDir

# Run the unified seed and test script
go run .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to run seed and test. Check databases or Prompt Layer URL." -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Test Complete." -ForegroundColor Green

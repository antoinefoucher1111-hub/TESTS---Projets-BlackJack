param(
    [switch]$Headless
)

# Script to run Katalium (Maven) tests from project root on Windows
# Usage:
#   .\run-katalium.ps1           -> runs tests in normal mode
#   .\run-katalium.ps1 -Headless -> runs tests with headless profile

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Push-Location "$scriptDir\katalium"
try {
    if ($Headless) {
        Write-Host "Running Katalium tests in headless mode..."
        mvn test -Pheadless
    } else {
        Write-Host "Running Katalium tests..."
        mvn test
    }
} finally {
    Pop-Location
}

# KP CLI Installation Script for Windows

Write-Host "[KP] Installing KP CLI..." -ForegroundColor Cyan

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed. Please install Node.js (v18+) and try again." -ForegroundColor Red
    exit 1
}

# Check if Git is installed
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Git is not installed. Please install Git and try again." -ForegroundColor Red
    exit 1
}

$InstallDir = "$env:USERPROFILE\.kp-cli"

if (Test-Path $InstallDir) {
    Write-Host "Updating existing installation..." -ForegroundColor Gray
    Set-Location $InstallDir
    git stash -q
    git pull -q
} else {
    Write-Host "Cloning repository..." -ForegroundColor Gray
    git clone -q https://github.com/Kaycee276/kp.git $InstallDir
    Set-Location $InstallDir
}

Write-Host "Installing dependencies..." -ForegroundColor Gray
npm install --silent

Write-Host "Building CLI..." -ForegroundColor Gray
npm run build --silent

Write-Host "Linking globally..." -ForegroundColor Gray
npm link --force --silent

Write-Host "[SUCCESS] Installation complete! You can now run 'kp' from anywhere." -ForegroundColor Green

Set-StrictMode -Version Latest
$PSNativeCommandUseErrorActionPreference = $true

$root = Resolve-Path ..
Write-Host "Repo root: $root"

# Step 1: Type-check
Write-Host "`n1) Type-checking (tsc)..."
# Use npx.cmd to avoid the buggy npx.ps1 shim on Windows PowerShell
& npx.cmd tsc -p apps/web/tsconfig.json --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Error "Type-check failed"
    exit $LASTEXITCODE
}

# Step 2: Tests
Push-Location apps/web
Write-Host "`n2) Web tests (npm test, fallback to direct Jest)..."
npm test
$code = $LASTEXITCODE
if ($code -ne 0) {
    Write-Warning "npm test failed (code $code). Trying direct jest..."
    node ../../node_modules/jest/bin/jest.js --runInBand
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Tests failed"
        Pop-Location
        exit 1
    }
}

# Step 3: Build
Write-Host "`n3) Web build (vite)..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed"
    Pop-Location
    exit 1
}

Pop-Location
Write-Host "`nAll checks passed ✅"

Write-Host "🧹 Cleaning ports 8080 and 5173..." -ForegroundColor Yellow

# Kill processes on port 8080 (Backend)
$port8080 = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($port8080) {
    $port8080 | ForEach-Object {
        $processId = $_.OwningProcess
        Write-Host "  ❌ Killing process $processId on port 8080" -ForegroundColor Red
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}

# Force kill any lingering Java processes (Nuclear Option)
Write-Host "  ⚠️ Ensuring no Java zombies remain..." -ForegroundColor Yellow
taskkill /F /IM java.exe /T 2>$null

if (!(Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue)) {
    Write-Host "  ✅ Port 8080 is free" -ForegroundColor Green
} else {
     Write-Host "  ❌ Port 8080 is still busy! Please restart PC." -ForegroundColor Red
}

# Kill processes on port 5173 (Frontend)
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($port5173) {
    $port5173 | ForEach-Object {
        $processId = $_.OwningProcess
        Write-Host "  ❌ Killing process $processId on port 5173" -ForegroundColor Red
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}

if (!(Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue)) {
    Write-Host "  ✅ Port 5173 is free" -ForegroundColor Green
}

Write-Host "✅ Ports cleaned successfully!" -ForegroundColor Green
Start-Sleep -Seconds 1

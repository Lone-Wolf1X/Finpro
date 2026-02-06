# Finpro Startup Script
# Kills old processes and clears ports before starting servers

Write-Host "🔄 Cleaning up old processes and ports..." -ForegroundColor Yellow

# Kill old Java and Node processes
Get-Process -Name "java", "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Kill processes on specific ports (8080 for backend, 5173 for frontend)
$ports = @(8080, 5173)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "  Killing process on port $port (PID: $($process.Id))" -ForegroundColor Gray
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

Start-Sleep -Seconds 2

Write-Host "✅ Cleanup complete" -ForegroundColor Green
Write-Host ""

# Start Backend
Write-Host "🚀 Starting Backend (Spring Boot) on port 8080..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host '🔧 Backend Server - http://localhost:8080/api' -ForegroundColor Green; mvn spring-boot:run"

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "🚀 Starting Frontend (Vite) on port 5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host '⚡ Frontend Server - http://localhost:5173' -ForegroundColor Blue; npm run dev"

Write-Host ""
Write-Host "✅ Both servers starting..." -ForegroundColor Green
Write-Host "📝 Backend:  http://localhost:8080/api" -ForegroundColor White
Write-Host "📝 Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "📝 Swagger:  http://localhost:8080/api/swagger-ui.html" -ForegroundColor White
Write-Host ""
Write-Host "© 2026 Next Gen Innovations Nepal" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Finpro Stop Script
# Stops all backend and frontend processes and clears ports

Write-Host "🛑 Stopping all Finpro processes..." -ForegroundColor Yellow

# Kill Java (Backend) and Node (Frontend) processes
Get-Process -Name "java", "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Kill processes on specific ports
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

Write-Host "✅ All processes stopped and ports cleared" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

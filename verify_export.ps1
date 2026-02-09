# verify_export.ps1

$baseUrl = "http://localhost:8080/api"
$email = "nextgeninnovationsprivatelimit@gmail.com"
$password = "123"

# 1. Login
Write-Host "Logging in..."
$loginBody = @{
    email    = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Logged in. Token length: $($token.Length)"
}
catch {
    Write-Error "Login Failed: $_"
    exit 1
}

$headers = @{
    Authorization = "Bearer $token"
}

# 2. Get Office Account ID
Write-Host "Fetching System Accounts..."
try {
    $sysAccounts = Invoke-RestMethod -Uri "$baseUrl/ledger/system-accounts" -Method Get -Headers $headers
    $officeAccount = $sysAccounts | Where-Object { $_.accountName -eq "Office Cash" }
    
    if (-not $officeAccount) {
        Write-Error "Office Cash account not found!"
        exit 1
    }
    Write-Host "Found Office Cash Account ID: $($officeAccount.id)"
}
catch {
    Write-Error "Failed to fetch system accounts: $_"
    exit 1
}

# 3. Export Statement
Write-Host "Exporting Statement for Office Cash..."
$outFile = "statement_dump.csv"
try {
    Invoke-RestMethod -Uri "$baseUrl/ledger/$($officeAccount.id)/statement/export" -Method Get -Headers $headers -OutFile $outFile
    
    if (Test-Path $outFile) {
        Write-Host "SUCCESS: Statement exported to $outFile"
        Get-Content $outFile -TotalCount 5
    }
    else {
        Write-Error "FAILURE: Export file not created."
        exit 1
    }
}
catch {
    Write-Error "Failed to export statement: $_"
    exit 1
}

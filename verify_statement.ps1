# verify_statement.ps1

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
    Authorization  = "Bearer $token"
    "Content-Type" = "application/json"
}

# 2. Get All System Accounts (to find Core Capital for deposit)
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

# 3. Create a Transaction (Capital Deposit)
# This will DEBIT "Office Cash" and CREDIT "Core Capital"
Write-Host "Creating Capital Deposit Transaction..."
$depositBody = @{
    targetAccountId = 1 # Assuming ID 1 is Core Capital (from V28 migration)
    amount          = 500.00
    description     = "Test Statement Verification"
} | ConvertTo-Json

try {
    $transaction = Invoke-RestMethod -Uri "$baseUrl/capital-deposits" -Method Post -Body $depositBody -Headers $headers
    Write-Host "Transaction Pending. ID: $($transaction.id)"
    
    # Approve it
    $approveUrl = "$baseUrl/capital-deposits/$($transaction.id)/approve"
    Invoke-RestMethod -Uri $approveUrl -Method Post -Headers $headers
    Write-Host "Transaction Approved."
}
catch {
    Write-Error "Transaction Creation/Approval Failed: $_"
    exit 1
}

# 4. Fetch Statement for Office Cash
Write-Host "Fetching Statement for Office Cash (ID: $($officeAccount.id))..."
try {
    $statement = Invoke-RestMethod -Uri "$baseUrl/ledger/$($officeAccount.id)/statement" -Method Get -Headers $headers
    
    Write-Host "Statement Retreived."
    Write-Host "Current Balance: $($statement.currentBalance)"
    
    $found = $statement.transactions | Where-Object { $_.description -eq "Test Statement Verification" }
    
    if ($found) {
        Write-Host "SUCCESS: Transaction found in statement!"
        Write-Host $found
    }
    else {
        Write-Error "FAILURE: Transaction NOT found in statement."
        Write-Host "Transactions found:"
        $statement.transactions | Format-Table
        exit 1
    }
}
catch {
    Write-Error "Failed to fetch statement: $_"
    exit 1
}

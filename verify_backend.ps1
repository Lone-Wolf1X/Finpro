
$ErrorActionPreference = "Stop"

function Login {
    $body = @{
        email    = "nextgeninnovationsprivatelimit@gmail.com"
        password = "123"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $body -ContentType "application/json"
        return $response.token
    }
    catch {
        Write-Error "Login Failed: $_"
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Login Error Body: $responseBody"
        }
        throw
    }
}

function Create-Transaction {
    param ($token)
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    # Get System Accounts
    try {
        $accounts = Invoke-RestMethod -Uri "http://localhost:8080/api/system-accounts" -Method Get -Headers $headers
        if ($accounts.Count -eq 0) {
            Write-Error "No system accounts found!"
            exit 1
        }
        $accountId = $accounts[0].id

        $body = @{
            transactionType = "CORE_CAPITAL_DEPOSIT"
            amount          = 1000
            targetAccountId = $accountId
            description     = "Test Deposit"
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "http://localhost:8080/api/capital-deposits" -Method Post -Headers $headers -Body $body -ContentType "application/json"
        return $response.id
    }
    catch {
        Write-Error "Create Transaction Failed: $_"
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Create Error Body: $responseBody"
        }
        throw
    }
}

function Approve-Transaction {
    param ($token, $txnId)
    $headers = @{
        Authorization = "Bearer $token"
    }
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8080/api/capital-deposits/$txnId/approve" -Method Post -Headers $headers -ContentType "application/json"
        return $response
    }
    catch {
        Write-Error "Approve Transaction Failed: $_"
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Approve Error Body: $responseBody"
        }
        throw
    }
}

try {
    Write-Host "Logging in..."
    $token = Login
    Write-Host "Logged in. Token length: $($token.Length)"

    Write-Host "Creating Transaction..."
    $txnId = Create-Transaction -token $token
    Write-Host "Transaction Created. ID: $txnId"

    Write-Host "Approving Transaction..."
    $result = Approve-Transaction -token $token -txnId $txnId
    Write-Host "Transaction Approved."
    Write-Host $result
}
catch {
    Write-Error "Script Failed: $_"
    exit 1
}

# verify_ipo.ps1

$baseUrl = "http://localhost:8080/api"
$adminEmail = "nextgeninnovationsprivatelimit@gmail.com"
$adminPassword = "123" 
$customerEmail = "nextgeninnovationsprivatelimit@gmail.com"
$customerPassword = "123"

# 1. Login as Admin
Write-Host "Logging in as Admin..."
$adminLoginBody = @{
    email    = $adminEmail
    password = $adminPassword
} | ConvertTo-Json

try {
    $adminLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
    $adminToken = $adminLoginResponse.token
    Write-Host "Admin Logged in."
}
catch {
    Write-Error "Admin Login Failed: $_"
    exit 1
}

$adminHeaders = @{
    Authorization  = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

# 2. Create an Active IPO
Write-Host "Creating Active IPO..."
$today = Get-Date
$openDate = $today.AddSeconds(5).ToString("yyyy-MM-ddTHH:mm:ss")
$closeDate = $today.AddDays(5).ToString("yyyy-MM-ddTHH:mm:ss")
$allotmentDate = $today.AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss")
$listingDate = $today.AddDays(10).ToString("yyyy-MM-ddTHH:mm:ss")

$ipoBody = @{
    companyName   = "Test Tech IPO $(Get-Random)"
    symbol        = "TEST$(Get-Random)"
    issueSize     = 1000000
    pricePerShare = 100
    minQuantity   = 10
    maxQuantity   = 100
    openDate      = $openDate
    closeDate     = $closeDate
    allotmentDate = $allotmentDate
    listingDate   = $listingDate
    description   = "Test IPO for verification"
} | ConvertTo-Json

try {
    $createdIpo = Invoke-RestMethod -Uri "$baseUrl/ipos" -Method Post -Headers $adminHeaders -Body $ipoBody
    Write-Host "IPO Created. ID: $($createdIpo.id), Status: $($createdIpo.status)"
    
    Write-Host "Waiting 10 seconds for IPO to become active..."
    Start-Sleep -Seconds 10
}
catch {
    Write-Error "Failed to create IPO: $_"
    exit 1
}

# 3. Login as Customer
Write-Host "Logging in as Customer..."
$customerLoginBody = @{
    email    = $customerEmail
    password = $customerPassword
} | ConvertTo-Json

try {
    $customerLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $customerLoginBody -ContentType "application/json"
    $customerToken = $customerLoginResponse.token
    Write-Host "Customer Logged in."
}
catch {
    Write-Error "Customer Login Failed: $_"
    exit 1
}

$customerHeaders = @{
    Authorization = "Bearer $customerToken"
}

# 4. Fetch Active IPOs as Customer
Write-Host "Fetching Active IPOs..."
try {
    $activeIpos = Invoke-RestMethod -Uri "$baseUrl/ipos/active" -Method Get -Headers $customerHeaders
    
    $foundIpo = $activeIpos | Where-Object { $_.id -eq $createdIpo.id }
    
    if ($foundIpo) {
        Write-Host "SUCCESS: Created IPO found in active list!"
        $foundIpo | Format-List
    }
    else {
        Write-Error "FAILURE: Created IPO NOT found in active list."
        Write-Host "Active IPOs found: $($activeIpos.Count)"
        $activeIpos | Format-Table id, companyName, status, openDate, closeDate
    }
}
catch {
    Write-Error "Failed to fetch active IPOs: $_"
    exit 1
}

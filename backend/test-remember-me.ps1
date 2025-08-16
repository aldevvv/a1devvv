# Test Remember Me Functionality using PowerShell
Write-Host "🧪 Testing Remember Me Functionality..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$API_BASE = if ($env:API_BASE) { $env:API_BASE } else { "http://localhost:4000" }
$TEST_EMAIL = "user@example.com"
$TEST_PASSWORD = "aldev.id"

# Test 1: Login WITHOUT Remember Me
Write-Host "📝 Test 1: Login without Remember Me" -ForegroundColor Yellow

$loginData1 = @{
    email = $TEST_EMAIL
    password = $TEST_PASSWORD
    rememberMe = $false
} | ConvertTo-Json

try {
    $response1 = Invoke-WebRequest -Uri "$API_BASE/auth/login" -Method POST -Body $loginData1 -ContentType "application/json" -SessionVariable session1
    Write-Host "Status: $($response1.StatusCode)" -ForegroundColor Green
    Write-Host "✅ Login successful" -ForegroundColor Green
    
    # Check refresh token cookie
    $refreshCookie1 = $response1.Headers.'Set-Cookie' | Where-Object { $_ -like "*refresh_token*" }
    if ($refreshCookie1) {
        if ($refreshCookie1 -match "Max-Age=(\d+)") {
            $maxAge1 = [int]$matches[1]
            $days1 = [math]::Round($maxAge1 / (24 * 60 * 60))
            Write-Host "🕒 Refresh token expiry: $days1 days (expected: 7 days)" -ForegroundColor White
            
            if ($days1 -eq 7) {
                Write-Host "✅ Correct expiration for regular login" -ForegroundColor Green
            } else {
                Write-Host "❌ Incorrect expiration for regular login" -ForegroundColor Red
            }
        }
    }
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host ("=" * 50)
Write-Host ""

# Test 2: Login WITH Remember Me
Write-Host "📝 Test 2: Login with Remember Me" -ForegroundColor Yellow

$loginData2 = @{
    email = $TEST_EMAIL
    password = $TEST_PASSWORD
    rememberMe = $true
} | ConvertTo-Json

try {
    $response2 = Invoke-WebRequest -Uri "$API_BASE/auth/login" -Method POST -Body $loginData2 -ContentType "application/json" -SessionVariable session2
    Write-Host "Status: $($response2.StatusCode)" -ForegroundColor Green
    Write-Host "✅ Login successful with Remember Me" -ForegroundColor Green
    
    # Check refresh token cookie
    $refreshCookie2 = $response2.Headers.'Set-Cookie' | Where-Object { $_ -like "*refresh_token*" }
    if ($refreshCookie2) {
        if ($refreshCookie2 -match "Max-Age=(\d+)") {
            $maxAge2 = [int]$matches[1]
            $days2 = [math]::Round($maxAge2 / (24 * 60 * 60))
            Write-Host "🕒 Refresh token expiry: $days2 days (expected: 30 days)" -ForegroundColor White
            
            if ($days2 -eq 30) {
                Write-Host "✅ Correct expiration for Remember Me login" -ForegroundColor Green
            } else {
                Write-Host "❌ Incorrect expiration for Remember Me login" -ForegroundColor Red
            }
        }
    }
} catch {
    Write-Host "❌ Login with Remember Me failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Remember Me test completed!" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Notes:" -ForegroundColor Yellow
Write-Host "   - Make sure the backend server is running on $API_BASE" -ForegroundColor White
Write-Host "   - Test user credentials: $TEST_EMAIL / $TEST_PASSWORD" -ForegroundColor White
Write-Host "   - You may need to create this test user first" -ForegroundColor White

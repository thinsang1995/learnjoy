# Ngrok Manager with Remote Redirect Server Support
# Auto-restart ngrok every 12 hours and push new URL to remote redirect server
# Run: powershell -ExecutionPolicy Bypass -File ngrok-manager-remote.ps1

param(
    [string]$NgrokPort = "8080",  # Nginx port (proxies frontend + backend)
    [string]$NgrokRegion = "ap",
    [int]$RestartIntervalHours = 12,
    [string]$RedirectServerUrl = "",  # e.g., https://your-redirect-server.com
    [string]$UpdateKey = "learnjoy-secret"
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$NgrokUrlFile = "$ScriptDir\current-ngrok-url.txt"
$NgrokHistoryFile = "$ScriptDir\ngrok-url-history.json"
$LogFile = "$ScriptDir\ngrok-manager.log"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage
    Add-Content -Path $LogFile -Value $logMessage
}

function Get-NgrokUrl {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method Get
        $tunnel = $response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
        if ($tunnel) {
            return $tunnel.public_url
        }
    } catch {
        Write-Log "Error getting ngrok URL: $_"
    }
    return $null
}

function Stop-Ngrok {
    Write-Log "Stopping ngrok..."
    Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
}

function Start-Ngrok {
    param([string]$Port)
    Write-Log "Starting ngrok on port $Port..."
    Start-Process -FilePath "ngrok" -ArgumentList "http", $Port, "--region", $NgrokRegion -WindowStyle Hidden
    Start-Sleep -Seconds 5
    
    $maxRetries = 10
    $retryCount = 0
    while ($retryCount -lt $maxRetries) {
        $url = Get-NgrokUrl
        if ($url) {
            Write-Log "Ngrok started successfully: $url"
            return $url
        }
        Start-Sleep -Seconds 2
        $retryCount++
    }
    Write-Log "Failed to start ngrok after $maxRetries retries"
    return $null
}

function Save-NgrokUrl {
    param([string]$Url)
    
    Set-Content -Path $NgrokUrlFile -Value $Url
    
    $history = @()
    if (Test-Path $NgrokHistoryFile) {
        $content = Get-Content $NgrokHistoryFile -Raw
        if ($content) {
            $history = $content | ConvertFrom-Json
            if (-not $history) { $history = @() }
        }
    }
    
    $entry = [PSCustomObject]@{
        url = $Url
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
        expiresAt = (Get-Date).AddHours($RestartIntervalHours).ToString("yyyy-MM-ddTHH:mm:ss")
    }
    
    $historyArray = @($history) + @($entry)
    if ($historyArray.Count -gt 10) {
        $historyArray = $historyArray | Select-Object -Last 10
    }
    
    $historyArray | ConvertTo-Json -Depth 10 | Set-Content -Path $NgrokHistoryFile
    Write-Log "Saved ngrok URL to local files"
}

function Update-RemoteRedirectServer {
    param([string]$NewUrl)
    
    if ([string]::IsNullOrEmpty($RedirectServerUrl)) {
        Write-Log "No remote redirect server configured, skipping..."
        return
    }
    
    Write-Log "Updating remote redirect server: $RedirectServerUrl"
    
    try {
        $body = @{
            key = $UpdateKey
            url = $NewUrl
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$RedirectServerUrl/api/update" -Method Post -Body $body -ContentType "application/json"
        
        if ($response.success) {
            Write-Log "Remote redirect server updated successfully"
        } else {
            Write-Log "Failed to update remote redirect server: $($response.error)"
        }
    } catch {
        Write-Log "Error updating remote redirect server: $_"
    }
}

function Update-LocalRedirectHtml {
    param([string]$NewUrl)
    
    $redirectHtml = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=$NewUrl">
    <title>Redirecting to LearnJoy...</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container { text-align: center; padding: 2rem; }
        .spinner {
            width: 50px; height: 50px;
            border: 5px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        a { color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h2>Redirecting to LearnJoy...</h2>
        <p>If not redirected, <a href="$NewUrl">click here</a></p>
        <p style="font-size: 0.8rem; opacity: 0.7;">Current URL: $NewUrl</p>
    </div>
    <script>window.location.href = "$NewUrl";</script>
</body>
</html>
"@
    
    Set-Content -Path "$ScriptDir\redirect.html" -Value $redirectHtml
    Write-Log "Updated local redirect.html"
}

function Start-DockerCompose {
    Write-Log "Starting Docker Compose with nginx proxy..."
    Set-Location $ProjectDir
    # Use ngrok compose file that includes nginx reverse proxy
    docker compose -f docker-compose.yml -f docker-compose.ngrok.yml up -d
    Start-Sleep -Seconds 20
    Write-Log "Docker Compose started (with nginx on port 8080)"
}

function Check-DockerRunning {
    try {
        Set-Location $ProjectDir
        $result = docker compose -f docker-compose.yml -f docker-compose.ngrok.yml ps --format json 2>$null
        return ($result -ne $null -and $result -ne "" -and $result -ne "[]")
    } catch {
        return $false
    }
}

# Main execution
Write-Log "========================================="
Write-Log "Ngrok Manager Started (Remote Mode)"
Write-Log "Port: $NgrokPort, Region: $NgrokRegion"
Write-Log "Restart Interval: $RestartIntervalHours hours"
Write-Log "Remote Server: $RedirectServerUrl"
Write-Log "========================================="

# Check if Docker Compose is running
Set-Location $ProjectDir
if (-not (Check-DockerRunning)) {
    Start-DockerCompose
}

# Initial ngrok start
Stop-Ngrok
$currentUrl = Start-Ngrok -Port $NgrokPort

if ($currentUrl) {
    Save-NgrokUrl -Url $currentUrl
    Update-LocalRedirectHtml -NewUrl $currentUrl
    Update-RemoteRedirectServer -NewUrl $currentUrl
    
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "LearnJoy is now accessible at:" -ForegroundColor Green
    Write-Host $currentUrl -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "The URL will be automatically refreshed every $RestartIntervalHours hours."
    Write-Host ""
}

# Schedule restart loop
Write-Log "Starting auto-restart scheduler (every $RestartIntervalHours hours)..."

while ($true) {
    $nextRestart = (Get-Date).AddHours($RestartIntervalHours)
    Write-Log "Next restart scheduled at: $($nextRestart.ToString('yyyy-MM-dd HH:mm:ss'))"
    
    Start-Sleep -Seconds ($RestartIntervalHours * 3600)
    
    Write-Log "Performing scheduled restart..."
    Stop-Ngrok
    $currentUrl = Start-Ngrok -Port $NgrokPort
    
    if ($currentUrl) {
        Save-NgrokUrl -Url $currentUrl
        Update-LocalRedirectHtml -NewUrl $currentUrl
        Update-RemoteRedirectServer -NewUrl $currentUrl
        Write-Log "New URL: $currentUrl"
    } else {
        Write-Log "ERROR: Failed to restart ngrok"
    }
}

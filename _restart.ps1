$proj = "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"
$taskName = "_cw_verify"

# Kill old dev + cleanup
schtasks /end /tn $taskName 2>$null
schtasks /delete /tn $taskName /f 2>$null
Start-Sleep -Seconds 2

# Start fresh task
$action = "cmd.exe"
$args = "/c cd /d $proj && npm run dev -- --port 3001"
schtasks /create /tn $taskName /sc once /st 00:00 /tr "$action $args" /f 2>&1 | Out-Null
schtasks /run /tn $taskName 2>&1 | Out-Null

# Wait for server
Start-Sleep -Seconds 8

# Test route
try {
    $r = Invoke-WebRequest -Uri http://localhost:3001/learn/arrays -UseBasicParsing -TimeoutSec 10
    Write-Output "learn/arrays: $($r.StatusCode)"
    if ($r.Content -match 'Arrays DSA Guide') {
        Write-Output "  Title OK"
    }
} catch {
    Write-Output "learn/arrays: ERROR $_"
}

# Cleanup temp scripts
Remove-Item "$proj\_fix3.ps1" -ErrorAction SilentlyContinue
Remove-Item "$proj\_check.ps1" -ErrorAction SilentlyContinue
Remove-Item "$proj\_verify.ps1" -ErrorAction SilentlyContinue

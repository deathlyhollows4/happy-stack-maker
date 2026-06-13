$proj = "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"
schtasks /end /tn _cw_verify 2>$null
schtasks /delete /tn _cw_verify /f 2>$null
Start-Sleep -Seconds 2
schtasks /create /tn _cw_verify /sc once /st 00:00 /tr "cmd.exe /c cd /d $proj & npm run dev -- --port 3001" /f 2>&1 | Out-Null
schtasks /run /tn _cw_verify 2>&1 | Out-Null
Start-Sleep -Seconds 10
try {
    $r = Invoke-WebRequest -Uri http://localhost:3001/learn/arrays -UseBasicParsing -TimeoutSec 10
    Write-Output "learn/arrays: $($r.StatusCode)"
    $h1 = [regex]::Match($r.Content, '<h1[^>]*>([^<]+)<').Groups[1].Value
    Write-Output "H1: $h1"
} catch {
    Write-Output "ERROR: $_"
}

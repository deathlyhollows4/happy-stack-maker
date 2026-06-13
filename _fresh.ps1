$proj = "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"
$taskName = "_cw_verify"
$action = "cmd.exe"
$args = "/c cd /d $proj && npm run dev -- --port 3001"
schtasks /create /tn $taskName /sc once /st 00:00 /tr "$action $args" /f 2>&1 | Out-Null
schtasks /run /tn $taskName 2>&1 | Out-Null
Start-Sleep -Seconds 10

try {
    $r = Invoke-WebRequest -Uri http://localhost:3001/learn/arrays -UseBasicParsing -TimeoutSec 10
    Write-Output "learn/arrays: $($r.StatusCode)"
    $h1s = [regex]::Matches($r.Content, '<h1[^>]*>(.*?)<\/h1>')
    foreach ($m in $h1s) {
        $text = $m.Groups[1].Value -replace '<[^>]+>', ''
        Write-Output "  H1: $text"
    }
    if ($r.Content -match 'Concept Overview') { Write-Output "  EDUCATION: YES" }
    else { Write-Output "  EDUCATION: NO" }
} catch {
    Write-Output "ERROR: $_"
}

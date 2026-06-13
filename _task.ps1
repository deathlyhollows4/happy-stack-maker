$proj = "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"
$taskName = "_cw_verify"
$action = "cmd.exe"
$args = "/c cd /d $proj && npm run dev -- --port 3001"

# Remove old task if exists
schtasks /delete /tn $taskName /f 2>$null

# Create one-time task
schtasks /create /tn $taskName /sc once /st 00:00 /tr "$action $args" /f 2>&1 | Out-Null

# Run it now
schtasks /run /tn $taskName 2>&1 | Out-Null

Write-Output "TASK_STARTED"

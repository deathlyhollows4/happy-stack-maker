$proj = "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"
cmd.exe /c "cd /d $proj && start /B npm run dev -- --port 3001 > C:\temp\codewise-dev.log 2>&1"
Start-Sleep -Seconds 6
Write-Output "SERVER_STARTED"

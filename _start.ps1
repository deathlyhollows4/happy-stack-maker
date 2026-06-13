$proj = "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "npm"
$psi.Arguments = "run dev -- --port 3001"
$psi.WorkingDirectory = $proj
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true
$p = [System.Diagnostics.Process]::Start($psi)
Write-Output "Started PID: $($p.Id)"

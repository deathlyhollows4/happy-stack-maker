$ErrorActionPreference = "Stop"
$proj = "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"
Set-Location $proj

# Try to get GH token from env or gh config
$token = $env:GH_TOKEN
if (-not $token) {
    # Read token from gh config file
    $ghConfig = "$env:USERPROFILE\.config\gh\hosts.yml"
    if (Test-Path $ghConfig) {
        $content = Get-Content $ghConfig -Raw
        if ($content -match 'oauth_token:\s*"([^"]+)"') {
            $token = $matches[1]
        }
        elseif ($content -match "oauth_token:\s*'([^']+)'") {
            $token = $matches[1]
        }
        elseif ($content -match 'oauth_token:\s*(\S+)') {
            $token = $matches[1]
        }
    }
    # Try gh auth token
    if (-not $token) {
        try { $token = gh auth token --hostname github.com 2>$null } catch {}
    }
}

if ($token) {
    Write-Output "Got token, pushing..."
    $url = "https://deathlyhollows4:$token@github.com/deathlyhollows4/happy-stack-maker.git"
    git remote set-url origin $url
    git push origin main 2>&1
    git remote set-url origin https://github.com/deathlyhollows4/happy-stack-maker.git
    Write-Output "PUSH_DONE"
} else {
    Write-Output "NO_TOKEN"
}
